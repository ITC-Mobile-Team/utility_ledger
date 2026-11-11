// Web поза обсягом хмарного зберігання: дані лишаються локальними, без
// Firestore (щоб web-бандл не тягнув нативний модуль)
export type AccountDataStatus = 'loading' | 'offline' | 'ready';

export const isUnavailable = (_error: unknown) => false;
export const isSynced = async (_uid: string) => true;
export const markSynced = async (_uid: string) => {};
export const unmarkSynced = async (_uid: string) => {};
export const fetchFromServer = async (_uid: string) => ({ isEmpty: false });
export const deleteAccountData = async (_uid: string) => {};
export const migrateLegacyData = async (
  _uid: string,
  _result: { isEmpty: boolean },
) => {};
