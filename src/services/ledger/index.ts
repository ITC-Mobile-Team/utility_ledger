import { storage } from '@/storage';
import { createLocalLedgerRepository } from './local-ledger-repository';
export * from './types';
export * from './billing';
export * from './format';

// Єдине місце підміни реалізації сховища (SQLite, Firebase…)
export const ledgerRepository = createLocalLedgerRepository(storage);
