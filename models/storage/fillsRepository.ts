import { Fill } from '../fill';
import { Repository } from './baseRepository';

export class FillsRepository extends Repository<Fill> {
  portfolioId: string;

  constructor(portfolioId: string) {
    super();
    this.portfolioId = portfolioId;
  }

  /**
   * Получить все сделки для указанного инструмента
   * @param {string} figi - идентификатор инструмента
   * @returns {Promise<Fill[]>}
   */
  async getAllByFigi(figi: string): Promise<Fill[]> {
    return [];
  }

  /**
   * Получить все сделки указанного типа
   * @param {string} type - тип сделки
   * @returns {Promise<Fill[]>}
   */
  async getAllByType(type: string): Promise<Fill[]> {
    return [];
  }

  /**
   * Получить все сделки указанных типов
   * @param {string[]} types - массив типов сделок
   * @returns {Promise<Fill[]>}
   */
  async getAllByTypes(types: string[]): Promise<Fill[]> {
    return [];
  }

  /**
   * @override
   * Получить все элементы хранилища
   * @returns {Promise<Fill[]>}
   */
  async getAll(): Promise<Fill[]> {
    return [];
  }

  /**
   * @override
   * Получить элемент по идентификатору
   * @param {string} id - идентификатор
   * @returns {Promise<Fill | undefined>}
   */
  async getOne(id: string): Promise<Fill | undefined> {
    const item = await super.getOne(id);
    return item?.portfolioId == this.portfolioId ? item : undefined;
  }
}

/** Кэшированный список репозиториев */
const repositories = new Map();

/**
 * Получить хранилище сделок для указанного портфеля
 * @param {string} portfolioId - идентификатор портфеля
 * @returns {FillsRepository}
 */
export default function getFillsRepository(portfolioId: string): FillsRepository {
  if (repositories.has(portfolioId)) {
    return repositories.get(portfolioId);
  }
  const repository = new FillsRepository(portfolioId);
  repositories.set(portfolioId, repository);
  return repository;
}
