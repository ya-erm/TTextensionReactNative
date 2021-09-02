import { Currency } from '/api/client';

/**
 * Конвертация строкового представления валюты в символ
 * @param {string} currency Валюта (RUB, USD, EUR)
 */
export function mapCurrency(currency: Currency | string | undefined) {
  if (!currency) {
    return '';
  }
  switch (currency) {
    case 'RUB':
      return '₽';
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    case 'TRY':
      return '₺';
    case 'CHF':
      return '₣';
    case 'JPY':
      return '¥';
    case 'CNY':
      return '元';
    default:
      return currency;
  }
}

/**
 * Отображение денежного значения
 * @param {number} value Числовое значение
 * @param {string} currency Валюта
 * @param {boolean} withSign true, если нужно добавить знак + перед положительным значением
 * @param {number} precision Количество знаков после запятой
 */
export function printMoney(
  value: number | undefined,
  currency: Currency | string = '',
  withSign: boolean = false,
  precision: number = 2,
) {
  if (value == null || value == undefined || isNaN(value)) {
    return '';
  }
  const sign = withSign && value > 0 ? '+' : '';
  const parts = value.toFixed(precision).split('.');
  const fractionalPart = parts.length > 1 ? '.' + parts[1] : '';
  return `${sign}${parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}${fractionalPart} ${mapCurrency(
    currency,
  )}`;
}
