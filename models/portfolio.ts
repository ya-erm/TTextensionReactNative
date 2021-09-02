// @ts-check
import { calcPriceChange, calcPriceChangePercents, processFill } from './calculate';
import { Fill } from './fill';
import { Position, updatePosition } from './position';
import getFillsRepository, { FillsRepository } from './storage/fillsRepository';
import instrumentsRepository from './storage/instrumentsRepository';
import getOperationsRepository, { OperationsRepository } from './storage/operationsRepository';
import { CurrencyPosition, Operation, PortfolioPosition } from '/api/client.js';
import { marketClient, operationsClient, ordersClient, portfolioClient } from '/api/httpClient';

export type PortfolioFilter = {
  currencies: { [currency: string]: boolean };
  zeroPositions: { zero: boolean; nonZero: boolean };
};

export type PortfolioSorting = {
  /** поле сортировки */
  field?: string;
  /** true, если сортировка по возрастанию */
  ascending: boolean;
};

export type PortfolioSettings = {
  /** переключатель отображения изменения цены за день (Percents, Absolute) **/
  priceChangeUnit: string;
  /** переключатель отображения ожидаемой прибыли (Percents, Absolute) **/
  expectedUnit: string;
  /** переключатель отображения прибыли (All, Day) **/
  allDayPeriod: string;
  /** параметры фильтрации */
  filter?: PortfolioFilter;
  /** параметры сортировки */
  sorting: PortfolioSorting;
};

/**
 * @class Portfolio
 */
export class Portfolio {
  /** идентификатор портфеля */
  id: string;
  /** название портфеля */
  title: string;
  /** идентификатор счёта */
  account?: string;
  /** список позиций*/
  positions: Position[] = [];
  /** настройки портфеля */
  settings: PortfolioSettings;

  /**
   * @constructor
   * @param {string} title - название портфеля
   * @param {string} id - идентификатор портфеля
   */
  constructor(title: string, id: string) {
    this.id = id;
    this.title = title;
    this.settings = {
      allDayPeriod: 'All',
      priceChangeUnit: 'Percents',
      expectedUnit: 'Absolute',
      filter: undefined,
      sorting: {
        field: undefined,
        ascending: true,
      },
    };
  }

  /** @type {FillsRepository} хранилище сделок */
  get fillsRepository(): FillsRepository {
    return getFillsRepository(this.id);
  }

  /** @type {OperationsRepository} хранилище операций */
  get operationsRepository(): OperationsRepository {
    return getOperationsRepository(this.account!);
  }

  /**
   * Сохранить портфель
   */
  save() {
    console.log('TODO: savePortfolios()');
  }

  // #region Positions

  /**
   * Загрузить позиции, используя API
   */
  async loadPositions() {
    if (!!this.account) {
      // Загружаем позиции
      const positions = (await portfolioClient.portfolio(this.account)).payload.positions;
      this.updatePortfolio(positions);
      // Загружаем валютные позиции
      const currencies = (await portfolioClient.currencies(this.account)).payload.currencies;
      this.updateCurrencies(currencies);

      // Узнаём текущую цену нулевых позиций
      // TODO: загружать стаканы только для избранных позиций, т.к. много запросов
      this.positions
        .filter((_) => _.count == 0)
        .forEach(async (position) => {
          const orderbook = (await marketClient.orderbook(position.figi, 1)).payload;
          position.lastPrice = orderbook.lastPrice;
          position.lastPriceUpdated = new Date();
          window.dispatchEvent(new CustomEvent('PositionUpdated', { detail: { position } }));
        });
    }

    return this.positions;
  }

  /**
   * Обновить позиции
   * @param {import("./TTApi.js").PortfolioPosition[]} items - список позиций
   */
  updatePortfolio(items: PortfolioPosition[]) {
    const now = new Date();
    let created = 0;
    let updated = 0;
    items.forEach((item) => {
      // @ts-ignore
      const lastPrice = item.expectedYield?.value / item.balance + item.averagePositionPrice?.value;
      // Находим существующую позицию в портфеле или создаём новую
      let position = this.positions.find((_) => _.figi === item.figi);
      if (!position) {
        position = new Position(this.id, item);
        this.positions.push(position);
        created++;
      }
      let changed = false;
      if (position.count !== item.balance) {
        position.count = item.balance;
        changed = true;
      }
      position.lastPriceUpdated = now;
      if (position.lastPrice !== lastPrice) {
        position.lastPrice = lastPrice;
        // @ts-ignore
        position.expected = (position.lastPrice - position.average) * position.count;
        changed = true;
      }
      if (changed) {
        updated++;
      }
    });
    // Обнуляем позиции, которых больше нет среди новых позиций
    this.positions
      .filter(
        (position) =>
          position.count != 0 &&
          position.ticker != 'RUB' &&
          !items.find((_) => _.figi == position.figi),
      )
      .forEach((item) => {
        item.count = 0;
        item.expected = undefined;
        item.lastPrice = undefined;
        item.lastPriceUpdated = new Date();
        updated++;
      });
    // Сортируем позиции
    this.sortPositions();
    this.save();

    console.log(`Positions created: ${created}, updated: ${updated}`);
  }

  /**
   * Отсортировать позиции
   */
  sortPositions() {
    const comparer = this.getComparer();
    this.positions.sort(comparer);
  }

  /**
   * Получить компаратор для сравнения двух позиций
   * @returns {(a: Position, b: Position) => number}
   */
  getComparer() {
    /**
     * Сравнение с undefined
     * @param {(a: Position, b: Position) => number} comparer
     * @returns {(a: Position, b: Position) => number}
     */
    const withNull = (
      comparer: (a: Position, b: Position) => number,
    ): ((a: Position, b: Position) => number) => {
      return (a, b) => {
        if (a == undefined && b != undefined) {
          return 1;
        }
        if (a != undefined && b == undefined) {
          return -1;
        }
        if (a == undefined && b == undefined) {
          return 0;
        }
        return comparer(a, b);
      };
    };

    /**
     * С учётом сортировки
     * @param {(a: Position, b: Position) => number} comparer
     * @returns {(a: Position, b: Position) => number}
     */
    const withAsc = (
      comparer: (a: Position, b: Position) => number,
    ): ((a: Position, b: Position) => number) => {
      return this.settings.sorting?.ascending ?? true
        ? (a, b) => comparer(a, b)
        : (a, b) => comparer(b, a);
    };

    let defaultComparer: (a: Position, b: Position) => number = (a, b) => {
      // Сравнение по типу инструмента
      let compareByType = a.instrumentType.localeCompare(b.instrumentType);
      if (compareByType != 0) {
        return compareByType;
      }
      // Сравнение по количеству (zero/non-zero)
      if (a.count == 0 && b.count != 0) {
        return 1;
      }
      if (b.count == 0 && a.count != 0) {
        return -1;
      }
      // Сравнение по тикеру
      return a.ticker.localeCompare(b.ticker);
    };

    let fieldSelector: (position: Position) => number | undefined = () => undefined;

    const sort = this.settings.sorting.field ?? 'default';
    switch (sort) {
      case 'ticker':
        return withAsc((a, b) => a.ticker.localeCompare(b.ticker));
      case 'count':
        fieldSelector = (position) => position.count;
        break;
      case 'average':
        fieldSelector = (position) => position.average;
        break;
      case 'lastPrice':
        fieldSelector = (position) => position.lastPrice;
        break;
      case 'cost':
        fieldSelector = (position) =>
          position.lastPrice ? position.count * position.lastPrice : undefined;
        break;
      case 'expected':
        fieldSelector = (position) => (position.expected ? position.expected : undefined);
        break;
      case 'fixed':
        fieldSelector = (position) => (position.fixedPnL ? position.fixedPnL : undefined);
        break;
      case 'change':
        fieldSelector =
          this.settings.priceChangeUnit == 'Percents'
            ? (p) => {
                if (p.previousDayPrice && p.lastPrice) {
                  const change = calcPriceChangePercents(p.previousDayPrice, p.lastPrice);
                  return change ? change : undefined;
                }
                return undefined;
              }
            : (p) => {
                if (p.previousDayPrice && p.lastPrice) {
                  const change = calcPriceChange(p.previousDayPrice, p.lastPrice);
                  return Math.abs(change) < 0.01 ? undefined : change;
                }
                return undefined;
              };
        break;
      default:
        return withAsc(defaultComparer);
    }

    const comparer: (asc: boolean) => (a: Position, b: Position) => number = (asc) => (p1, p2) => {
      const a = fieldSelector(p1);
      const b = fieldSelector(p2);

      if (a == undefined && b != undefined) {
        return 1;
      }
      if (a != undefined && b == undefined) {
        return -1;
      }
      if (a == undefined && b == undefined) {
        return 0;
      }

      // @ts-ignore
      return asc ? a - b : b - a;
    };

    return comparer(this.settings.sorting.ascending);
  }

  /**
   * Обновить валютные позиции
   */
  updateCurrencies(items: CurrencyPosition[]) {
    items.forEach((item) => {
      let name, figi: string, ticker, lastPrice, average;
      switch (item.currency) {
        case 'USD':
          name = 'Евро';
          figi = 'BBG0013HGFT4';
          ticker = 'USD000UTSTOM';
          break;
        case 'EUR':
          name = 'Доллар США';
          figi = 'BBG0013HJJ31';
          ticker = 'EUR_RUB__TOM';
          break;
        case 'RUB':
          name = 'Рубли РФ';
          figi = item.currency;
          ticker = item.currency;
          lastPrice = 1;
          average = 1;
          break;
        default:
          name = item.currency;
          figi = item.currency;
          ticker = item.currency;
          break;
      }
      let position = this.positions.find((_) => _.instrumentType == 'Currency' && _.figi == figi);
      if (!position) {
        if (item.balance == 0) {
          return;
        }
        position = new Position(this.id, {
          name,
          figi,
          ticker,
          isin: undefined,
          instrumentType: 'Currency',
          balance: item.balance,
          lots: item.balance,
          blocked: undefined,
          expectedYield: undefined,
          averagePositionPrice: undefined,
        });
        position.currency = item.currency;
        position.lastPrice = lastPrice;
        position.average = average;
        this.positions.push(position);
      }
      if (position.count !== item.balance) {
        position.count = item.balance;
      }
      // Генерируем событие обновления позиции
      window.dispatchEvent(new CustomEvent('PositionUpdated', { detail: { position } }));
    });
    this.save();
  }

  /**
   * Поиск или создание позиции
   * @param {string} figi идентификатор
   */
  async findPosition(figi: string) {
    let position = this.positions.find((_) => _.figi == figi);
    if (!position) {
      const item = (await marketClient.byFigi(figi)).payload;
      position = new Position(this.id, {
        ticker: item.ticker,
        name: item.name,
        figi: item.figi,
        isin: item.isin,
        instrumentType: item.type,
        balance: 0,
        lots: 0,
        blocked: undefined,
        expectedYield: undefined,
        averagePositionPrice: undefined,
      });
      position.currency = item.currency;
    }
    return position;
  }

  /**
   * Добавление позиции в список позиций
   * @param {Position} position
   */
  addPosition(position: Position) {
    if (!this.positions.includes(position)) {
      this.positions.push(position);
    }
  }

  /**
   * Удалить позицию из списка позиций
   * @param {Position} position - позиция
   */
  removePosition(position: Position) {
    if (position.count != 0) {
      console.log(`Failed to remove non-zero position ${position.ticker}`);
      return;
    }
    const index = this.positions.indexOf(position);
    if (index >= 0) {
      this.positions.splice(index, 1);
      window.dispatchEvent(new CustomEvent('PositionRemoved', { detail: { position } }));
      this.save();
    } else {
      console.log(`Failed to remove position ${position.ticker}, it's not found`);
    }
  }

  /**
   * Проверить позицию на соответствие фильтру
   * @param {Position} position - позиция
   * @returns {boolean} true, если позиция соответствует фильтру
   */
  filterPosition(position: Position): boolean {
    if (this.settings.filter == undefined) {
      return true;
    }
    // Filter by currency
    if (
      this.settings.filter?.currencies &&
      this.settings.filter.currencies[position.currency!.toLowerCase()] == false
    ) {
      return false;
    }
    // Filter by zero/non-zero
    if (this.settings.filter?.zeroPositions?.zero == false && position.count == 0) {
      return false;
    }
    if (this.settings.filter?.zeroPositions?.nonZero == false && position.count != 0) {
      return false;
    }
    return true;
  }

  // #endregion

  // #region Orders

  /**
   * Загрузить заявки
   * @param {string} ticker - идентификатор
   */
  async loadOrdersByTicker(ticker: string) {
    let figi =
      this.positions.find((_) => _.ticker == ticker)?.figi ||
      (await instrumentsRepository.getOneByTicker(ticker))?.figi;

    if (!figi) {
      const item = (await marketClient.byTicker(ticker)).payload.instruments[0];
      if (!item) {
        throw new Error('Instrument not found');
      }
      figi = item.figi;
    }

    const orders = (await ordersClient.orders(this.account)).payload.filter((x) => x.figi == figi);
    return orders;
  }

  // #endregion

  // #region Fills

  /**
   * Загрузить сделки
   * @param {string} ticker - идентификатор
   */
  async loadFillsByTicker(ticker: string) {
    let figi =
      this.positions.find((_) => _.ticker == ticker)?.figi ||
      (await instrumentsRepository.getOneByTicker(ticker))?.figi;

    if (!figi) {
      const item = (await marketClient.byTicker(ticker)).payload.instruments[0];
      if (!item) {
        throw new Error('Instrument not found');
      }
      figi = item.figi;
    }

    const fromDate = encodeURIComponent('2000-01-01T00:00:00Z');
    const toDate = encodeURIComponent(new Date().toISOString());
    const operations = (await operationsClient.operations(fromDate, toDate, figi, this.account))
      .payload.operations;
    await this.operationsRepository.putMany(operations);
    const position = await this.findPosition(figi);
    this.addPosition(position);
    this.sortPositions();

    return await this.updateFills(position, operations);
  }

  /**
   * Загрузить все операции
   */
  async loadOperations() {
    const fromDate = encodeURIComponent('2000-01-01T00:00:00Z');
    const toDate = encodeURIComponent(new Date().toISOString());
    const operations = (
      await operationsClient.operations(fromDate, toDate, undefined, this.account)
    ).payload.operations;
    this.operationsRepository.putMany(operations);
    return operations;
  }

  /**
   * Обновить список сделок и просчитать позиции
   */
  async updateFills(position: Position, operations: Operation[]): Promise<Array<Fill>> {
    let created = 0;
    let updated = 0;
    let fills = (await this.fillsRepository.getAllByFigi(position.figi)) || [];

    operations
      .filter((_) => _.status == 'Done' && ['Buy', 'BuyCard', 'Sell'].includes(_.operationType!))
      .forEach((item) => {
        let fill = fills.find((_) => _.id == item.id);
        if (!fill) {
          fill = new Fill(this.id, item);
          fills.push(fill);
          created++;
        }
        // Не обновляем данные сделки, если она была исправлена вручную
        if (fill.manual) {
          return;
        }

        let fillUpdated = false;
        if (fill.price != item.price || fill.commission != item.commission?.value) {
          fill.price = item.price;
          fill.commission = item.commission?.value;
          fillUpdated = true;
        }
        if (fill.quantity != item.quantity || fill.quantityExecuted != item.quantityExecuted) {
          fill.quantity = item.quantity;
          fill.quantityExecuted = item.quantityExecuted;
          fillUpdated = true;
        }
        if (fill.trades?.length != item.trades?.length) {
          fill.trades = item.trades;
          fillUpdated = true;
        }
        if (fillUpdated) {
          updated++;
        }
      });

    let currentQuantity = 0;
    let totalFixedPnL = 0;
    let averagePrice = 0;
    let averagePriceCorrected = 0;

    fills = fills
      //.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // sort by order placed
      .sort((a: Fill, b: Fill) => {
        // sort by last trade executed or order creation if trades is unknown
        const aDate = Fill.getLastTradeDate(a) ?? new Date(a.date);
        const bDate = Fill.getLastTradeDate(b) ?? new Date(a.date);
        return aDate.getTime() - bDate.getTime();
      });

    fills.forEach((fill) => {
      const result = processFill(
        {
          currentQuantity,
          totalFixedPnL,
          averagePrice,
          averagePriceCorrected,
        },
        fill,
      );

      currentQuantity = result.currentQuantity;
      totalFixedPnL = result.totalFixedPnL;
      averagePrice = result.averagePrice;
      averagePriceCorrected = result.averagePriceCorrected;

      fill.averagePrice = averagePrice;
      fill.averagePriceCorrected = averagePriceCorrected;
      fill.currentQuantity = currentQuantity;
      fill.fixedPnL = result.fixedPnL!;
    });

    console.log(`Fills ${position.ticker} created: ${created}, updated: ${updated}`);

    await this.fillsRepository.putMany(fills);

    position.calculatedCount = currentQuantity;
    if (position.count != currentQuantity) {
      console.warn(
        'Calculated by fills position quantity',
        currentQuantity,
        'is not equal with actual position quantity',
        position.count,
      );
    }

    // Обновляем позицию
    updatePosition(position, averagePrice, totalFixedPnL);
    this.save();

    return fills;
  }

  // #endregion
}
