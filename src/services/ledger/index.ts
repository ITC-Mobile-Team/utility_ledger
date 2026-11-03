import { createInMemoryLedgerRepository } from './in-memory-ledger-repository';
export * from './types';
export * from './billing';
export * from './format';

// Єдине місце підміни реалізації сховища (AsyncStorage, SQLite, Firebase…)
export const ledgerRepository = createInMemoryLedgerRepository();
