import { createFirestoreLedgerRepository } from './firestore-ledger-repository';
export * from './types';
export * from './billing';
export * from './format';

// Єдине місце підміни реалізації сховища: Firestore на iOS і Android,
// локальне сховище на web (index.web.ts)
export const ledgerRepository = createFirestoreLedgerRepository();
