// @ts-check

import { Operation, OperationTrade } from '/api/client';

/**
 * @class Fill
 */
export class Fill {
  /** идентификатор портфеля */
  portfolioId: string;

  /** идентификатор сделки */
  id: string;

  /** идентификатор инструмента */
  figi?: string;

  /** дата и время в ISO8601, например "2021-02-10T11:18:27.276+03:00" */
  date: string;

  /** тип операции, например "Buy" */
  operationType?: string;

  /** стоимость одного лота, например 100.21 */
  price?: number;

  /** количество лотов в заявке */
  quantity?: number;

  /** количество исполненных лотов */
  quantityExecuted?: number;

  /** сумма платежа */
  payment: number;

  /** комиссия **/
  commission?: number;

  /** сделки */
  trades?: OperationTrade[];

  // Расчётные накопительные параметры:

  /** средняя цена */
  averagePrice?: number;

  /** средняя цена с учётом комиссии */
  averagePriceCorrected?: number;

  /** текущее количество в позиции */
  currentQuantity?: number;

  /** зафиксированная прибыль */
  fixedPnL?: number;

  // Признак ручного редактирования
  /** true, если запись изменена вручную */
  manual?: boolean;

  constructor(portfolioId: string, item: Operation) {
    this.portfolioId = portfolioId;
    this.id = item.id;
    this.figi = item.figi;
    this.date = item.date;
    this.operationType = item.operationType;
    this.price = item.price;
    this.quantity = item.quantity;
    this.quantityExecuted = item.quantityExecuted;
    this.payment = item.payment;
    this.commission = item.commission?.value;
    this.trades = item.trades;

    // Расчётные накопительные параметры:
    this.averagePrice = undefined;
    this.averagePriceCorrected = undefined;
    this.currentQuantity = undefined;
    this.fixedPnL = undefined;
  }

  static getLastTradeDate(fill: Fill): Date | undefined {
    if (fill?.trades && fill.trades?.length > 0) {
      return new Date(fill.trades[fill.trades.length - 1].date);
    }
  }
}
