import { AsyncKeyValueStorage } from './async-storage';
import type { KeyValueStorage } from './key-value-storage';
export type { KeyValueStorage } from './key-value-storage';
export { InMemoryStorage } from './in-memory-storage';

export const storage: KeyValueStorage = new AsyncKeyValueStorage();
