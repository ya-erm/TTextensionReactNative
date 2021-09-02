// @ts-check

import { mapCurrency, printMoney } from '/utils/printUtils';
import { Currency, InstrumentType, Order, PortfolioPosition } from '/api/client';

/**
 * @class Position
 */
export class Position {
  /** короткий идентификатор */
  ticker: string;

  /** полное название актива */
  name: string;

  /** идентификатор FIGI (Financial Instrument Global Identifier) */
  figi: string;

  /** идентификатор ISIN (International Securities Identification Number) */
  isin: string;

  /** тип (Stock, Currency, Bond, Etf) */
  instrumentType: InstrumentType;

  /** валюта (RUB, USD, EUR, GBP, HKD, CHF, JPY, CNY, TRY) */
  currency?: Currency;

  /** количество */
  count: number;

  /** средняя цена */
  average?: number;

  /** ожидаемая (незафиксированная) прибыль или убыток */
  expected?: number;

  /** зафиксированная прибыль или убыток */
  fixedPnL?: number;

  /** текущая цена (последняя известная цена) */
  lastPrice?: number;

  /** дата последнего обновления цены */
  lastPriceUpdated?: Date;

  /** идентификатор портфеля */
  portfolioId: string;

  /** рассчитанная по сделкам средняя цена */
  calculatedAverage?: number;

  /** рассчитанное по сделкам количество */
  calculatedCount?: number;

  /** рассчитанная по сделкам ожидаемая прибыль*/
  calculatedExpected?: number;

  /** цена инструмента на момент окончания предыдущего дня */
  previousDayPrice?: number;

  /** список активных заявок */
  orders: Order[];

  /** true, если тикер находится в избранном */
  isFavourite?: boolean;

  constructor(portfolioId: string, item: PortfolioPosition) {
    this.ticker = item.ticker || item.figi;
    this.name = item.name;
    this.figi = item.figi;
    this.isin = item.isin || item.figi;
    this.instrumentType = item.instrumentType;
    this.currency = item.averagePositionPrice?.currency || item.expectedYield?.currency;
    this.count = item.balance;
    this.average = item.averagePositionPrice?.value;
    this.expected = item.expectedYield?.value;
    this.fixedPnL = undefined;
    this.lastPrice =
      item.expectedYield && item.averagePositionPrice
        ? item.expectedYield?.value / item.balance + item.averagePositionPrice?.value
        : undefined;
    this.lastPriceUpdated = new Date();
    this.portfolioId = portfolioId;
    this.calculatedAverage = undefined;
    this.calculatedCount = undefined;
    this.calculatedExpected = undefined;
    this.previousDayPrice = undefined;
    this.orders = [];
    this.isFavourite = false;
  }
  // #region Properties

  get priceChange() {
    return 0; // TODO: price change
  }

  get cost() {
    return this.lastPrice != undefined ? this.lastPrice * this.count : undefined;
  }

  get expectedValue() {
    if (this.instrumentType == 'Currency') {
      return this.expected;
    }
    if (this.lastPrice && this.average) {
      return (this.lastPrice - this.average) * (this.calculatedCount ?? this.count);
    }
    return this.expected;
  }

  get currencySymbol() {
    return mapCurrency(this.currency);
  }

  // #endregion

  // #region Print functions

  printTitle(): string {
    switch (this.instrumentType) {
      case 'Bond':
      case 'Currency':
        return this.name;
      case 'Etf':
      case 'Stock':
        return this.ticker;
    }
  }
  printPrice(withCurrency: boolean = true): string {
    return printMoney(this.lastPrice, withCurrency ? this.currencySymbol : '');
  }
  printPriceChange(): string {
    return printMoney(this.priceChange, '%', true);
  }
  printAveragePrice(withCurrency: boolean = true): string {
    return printMoney(this.average, withCurrency ? this.currencySymbol : '');
  }
  printQuantity(): string {
    if (this.instrumentType == 'Currency') {
      return printMoney(this.calculatedCount ?? this.count);
    }
    const quantity = this.calculatedCount ?? this.count;
    return quantity.toFixed(0); // TODO: print quantity with suffix (for example 9.75К, 75.5K, 1.54M)
  }
  printCost(withCurrency: boolean = true): string {
    return printMoney(this.cost, withCurrency ? this.currencySymbol : '');
  }
  printExpected(): string {
    const expectedPercents = (100.0 * (this.expected ?? 0)) / (this.cost ?? 1);
    return (
      printMoney(this.expected, this.currencySymbol, true) +
      ' (' +
      printMoney(expectedPercents, '%') +
      ')'
    );
  }
  printFixedPnL(): string {
    return printMoney(this.fixedPnL ?? 0, this.currencySymbol);
  }

  // #endregion
}

/**
 * Обновить позицию
 * @param {Position} position - позиция
 * @param {number} average - средняя цена
 * @param {number} fixedPnL - зафиксированную прибыль
 */
export function updatePosition(position: Position, average: number, fixedPnL: number) {
  position.calculatedAverage = average || position.calculatedAverage;
  position.fixedPnL = fixedPnL || position.fixedPnL;
  position.calculatedExpected =
    (position.lastPrice! - position.calculatedAverage!) * position.calculatedCount!;
  console.log(
    `Position ${position.ticker} updated (average: ${average?.toFixed(
      2,
    )}, fixedPnL: ${fixedPnL?.toFixed(2)})`,
  );
  window.dispatchEvent(new CustomEvent('PositionUpdated', { detail: { position } }));
}
