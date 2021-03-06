// @ts-check
import { Fill } from './fill.js';
import { Candle, Currency } from '/api/client.js';
import { marketClient } from '/api/httpClient.js';

const currencyRates: { [key in Currency]?: number } = {
  RUB: 1,
  USD: 73.1,
  EUR: 86.2,
};

/**
 * Получить текущий курс валюты в рублях
 * @param {string} currency Валюта (USD, EUR)
 * @returns {Promise<number>}
 */
export async function fetchCurrencyRate(currency: Currency): Promise<number | undefined> {
  let currencyRate = currencyRates[currency];
  if (!currencyRate) {
    switch (currency) {
      case 'USD':
        currencyRate = (await marketClient.orderbook('BBG0013HGFT4', 1)).payload.lastPrice; // Доллар США
        break;
      case 'EUR':
        currencyRate = (await marketClient.orderbook('BBG0013HJJ31', 1)).payload.lastPrice; // Евро
        break;
      case 'RUB':
        currencyRate = 1;
        break;
    }
    console.log(currency, currencyRate);
    currencyRates[currency] = currencyRate;
  }
  return currencyRate;
}

/**
 * Получить курс валюты
 * @param {string} from - из какой валюты
 * @param {string} to - в какую валюту
 */
export function getCurrencyRate(from: string, to: string) {
  if (from == to) {
    return 1.0;
  }

  const usdToRub = currencyRates['USD']; // Доллар США
  if (from == 'USD' && to == 'RUB') {
    return usdToRub;
  } else if (from == 'RUB' && to == 'USD') {
    return 1.0 / usdToRub!;
  }

  const eurToRub = currencyRates['EUR']; // Евро
  if (from == 'EUR' && to == 'RUB') {
    return eurToRub;
  } else if (from == 'RUB' && to == 'EUR') {
    return 1.0 / eurToRub!;
  }

  throw new Error(`Failed to convert from ${from} to ${to}`);
}

/**
 * Получить цену закрытия за предыдущий торговый день
 * @param {string} figi - идентификатор инструмента
 * @param {Date?} date - текущая дата
 */
export async function getPreviousDayClosePrice(figi: string, date: Date | undefined = undefined) {
  if (figi == 'RUB') {
    return 1;
  }
  const now = date ?? new Date();
  const previousTradingDay = new Date(now.getTime());
  previousTradingDay.setUTCHours(15);
  previousTradingDay.setUTCMinutes(0);
  previousTradingDay.setUTCSeconds(0);
  previousTradingDay.setUTCMilliseconds(0);
  if (now.getUTCDay() <= 1) {
    // 0 = Вс, 1 = Пн
    previousTradingDay.setUTCDate(previousTradingDay.getUTCDate() - 2 - now.getUTCDay());
  } else {
    previousTradingDay.setUTCDate(previousTradingDay.getUTCDate() - 1);
  }
  const toDate = new Date(previousTradingDay.getTime() + 8 * 60 * 60000); // Add 8 hours
  // Ищем информацию о свечах в кэше
  let candles: Candle[] = []; // TODO: await findCandles(figi, previousTradingDay, toDate, "hour");
  if (candles.length == 0) {
    // Если не нашли, загружаем из API
    candles = (
      await marketClient.candles(
        figi,
        previousTradingDay.toISOString(),
        toDate.toISOString(),
        'hour',
      )
    ).payload.candles;
  }
  if (candles.length > 0) {
    const lastCandle = candles[candles.length - 1];
    return lastCandle.c; // close price
  }
}

/**
 * Рассчитать изменение цены актива в процентах
 * @param {number} previousDayPrice
 * @param {number} currentPrice
 */
export function calcPriceChangePercents(previousDayPrice: number, currentPrice: number) {
  const change = (100 * currentPrice) / previousDayPrice - 100;
  if (Math.abs(change) < 0.01) {
    return 0;
  }
  return change;
}

/**
 * Рассчитать изменение цены
 * @param {number} previousDayPrice
 * @param {number} currentPrice
 */
export function calcPriceChange(previousDayPrice: number, currentPrice: number) {
  const change = currentPrice - previousDayPrice;
  if (Math.abs(change) < 0.01) {
    return 0;
  }
  return change;
}

/**
 * Функция просчёта операций
 * @param {object} accumulated Накопленный результат
 * @param {Fill} fill Операция
 */
export function processFill(accumulated: any, fill: Fill) {
  let { currentQuantity, totalFixedPnL, averagePrice, averagePriceCorrected } = accumulated;

  const price = fill.price;
  const cost = -fill.payment;
  const quantity = fill.quantityExecuted ?? 0;
  const commission = fill.commission ? Math.abs(fill.commission) : 0;
  const direction = -Math.sign(fill.payment);
  const costCorrected = cost + commission;

  let sumUp = currentQuantity * (averagePrice || 0) + cost;
  let sumUpCorrected = currentQuantity * (averagePriceCorrected || 0) + costCorrected;

  let nextQuantity = currentQuantity + direction * quantity;

  let fixedPnL = null;

  // Переход через 0
  if ((nextQuantity < 0 && currentQuantity > 0) || (nextQuantity > 0 && currentQuantity < 0)) {
    const proportion = Math.abs(currentQuantity / quantity);

    const partialCostCorrected = costCorrected * proportion;

    fixedPnL =
      Math.sign(currentQuantity) *
      direction *
      (currentQuantity * (averagePriceCorrected || 0) + partialCostCorrected);

    averagePrice = price;
    averagePriceCorrected = (costCorrected * (1 - proportion)) / nextQuantity;

    currentQuantity = nextQuantity;
  } else {
    if (direction * currentQuantity < 0) {
      fixedPnL = direction * quantity * (averagePriceCorrected || 0) - costCorrected;

      currentQuantity = nextQuantity;
    } else {
      currentQuantity = nextQuantity;

      if (currentQuantity != 0) {
        averagePrice = Math.abs(sumUp / currentQuantity);
        averagePriceCorrected = Math.abs(sumUpCorrected / currentQuantity);
      }
    }

    if (currentQuantity == 0) {
      sumUp = 0;
      sumUpCorrected = 0;
      averagePrice = null;
      averagePriceCorrected = null;
    }
  }

  totalFixedPnL += fixedPnL || 0;

  return {
    currentQuantity,
    totalFixedPnL,
    averagePrice,
    averagePriceCorrected,
    sumUp,
    sumUpCorrected,
    fixedPnL,
  };
}
