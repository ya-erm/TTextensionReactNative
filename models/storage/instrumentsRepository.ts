import { Repository } from './baseRepository';
import { MarketInstrument } from '/api/client';

export class InstrumentsRepository extends Repository<MarketInstrument> {
  /**
   * Получить инструмент по идентификатору FIGI
   * @param {string} figi - идентификатор инструмента FIGI
   * @returns {Promise<MarketInstrument>}
   */
  async getOneByFigi(figi: string): Promise<MarketInstrument | undefined> {
    return await this.getOne(figi);
  }

  /**
   * Получить инструмент по тикеру
   * @param {string} ticker - тикер инструмента
   * @returns {Promise<MarketInstrument>}
   */
  async getOneByTicker(ticker: string): Promise<MarketInstrument | undefined> {
    return;
  }

  /**
   * Получить инструмент по идентификатору ISIN
   * @param {string} isin - идентификатор инструмента ISIN
   * @returns {Promise<MarketInstrument>}
   */
  async getOneByIsin(isin: string): Promise<MarketInstrument | undefined> {
    return;
  }
}

const instrumentsRepository = new InstrumentsRepository();

export default instrumentsRepository;
