import { InMemoryStorage } from './in-memory-storage';
import type { KeyValueStorage } from './key-value-storage';
export type { KeyValueStorage } from './key-value-storage';

export const storage: KeyValueStorage = new InMemoryStorage();
