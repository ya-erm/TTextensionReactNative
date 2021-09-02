import { Repository } from './baseRepository';
import { Operation } from '/api/client';

export class OperationsRepository extends Repository<Operation> {
  account: string;

  constructor(account: string) {
    super();
    this.account = account;
  }

  /**
   * Получить все операции для указанного инструмента
   * @param {string} figi - идентификатор инструмента
   * @returns {Promise<Operation[]>}
   */
  async getAllByFigi(figi: string): Promise<Operation[]> {
    return [];
  }

  /**
   * Получить все операции указанного типа
   * @param {string} type - тип операции
   * @returns {Promise<Operation[]>}
   */
  async getAllByType(type: string): Promise<Operation[]> {
    return [];
  }

  /**
   * Получить все операции указанных типов
   * @param {string[]} types - массив типов операций
   * @returns {Promise<Operation[]>}
   */
  async getAllByTypes(types: string[]): Promise<Operation[]> {
    return [];
  }

  /**
   * @override
   * Получить все элементы хранилища
   * @returns {Promise<Operation[]>}
   */
  override async getAll(): Promise<Operation[]> {
    return [];
  }

  /**
   * @override
   * Получить элемент по идентификатору
   * @param {string} id - идентификатор
   * @returns {Promise<Operation?>}
   */
  override async getOne(id: string): Promise<Operation | undefined> {
    const item = await super.getOne(id);
    // @ts-ignores
    return item?.account == this.account ? item : undefined;
  }

  /**
   * Сохранить элемент в БД
   * @param {Operation} item - элемент
   * @returns {Promise<void>}
   */
  override async putOne(item: Operation): Promise<void> {
    // @ts-ignores
    await super.putOne({ ...item, account: this.account });
  }

  /**
   * Сохранить список элементов в БД
   * @param {Operation[]} items - список элементов
   * @returns {Promise<void>}
   */
  override async putMany(items: Operation[]): Promise<void> {
    const operations = items.map((item) => ({ ...item, account: this.account }));
    await super.putMany(operations);
  }
}

/** Кэшированный список репозиториев */
const repositories = new Map();

/**
 * Получить хранилище операций для указанного счёта
 * @param {string} account - идентификатор счёта
 * @returns {OperationsRepository}
 */
export default function getOperationsRepository(account: string): OperationsRepository {
  if (repositories.has(account)) {
    return repositories.get(account);
  }
  const repository = new OperationsRepository(account);
  repositories.set(account, repository);
  return repository;
}
