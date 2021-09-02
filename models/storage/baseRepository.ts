export class Repository<T> {
  /**
   * Сохранить элемент в БД
   * @param {T} item - элемент
   * @returns {Promise<void>}
   */
  async putOne(item: T) {
    return;
  }

  /**
   * Сохранить список элементов в БД
   * @param {T[]} items - список элементов
   * @returns {Promise<void>}
   */
  async putMany(items: T[]) {
    return;
  }

  /**
   * Получить элемент по идентификатору
   * @param {string} id - идентификатор
   * @returns {Promise<T>}
   */
  async getOne(id: string): Promise<T | undefined> {
    return undefined;
  }

  /**
   * Получить все элементы хранилища
   * @returns {Promise<T[]>}
   */
  async getAll(): Promise<T[]> {
    return [];
  }

  /**
   * Удалить элемент по идентификатору
   * @param {string} id - идентификатор элемента
   * @returns {Promise<void>}
   */
  async deleteOne(id: string) {
    return;
  }

  /**
   * Удалить базу данных
   */
  async dropDatabase() {
    return;
  }
}
