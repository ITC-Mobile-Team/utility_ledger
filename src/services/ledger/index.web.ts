import { storage } from '@/storage';
import { createLocalLedgerRepository } from './local-ledger-repository';
export * from './types';
export * from './billing';
export * from './format';

// Web поза обсягом хмарного зберігання: дані лишаються локальними
export const ledgerRepository = createLocalLedgerRepository(storage);
