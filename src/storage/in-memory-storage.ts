import { KeyValueStorage } from './key-value-storage';

export class InMemoryStorage implements KeyValueStorage {
  private store = new Map<string, string>();

  async getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  async setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  async removeItem(key: string) {
    this.store.delete(key);
  }
}
