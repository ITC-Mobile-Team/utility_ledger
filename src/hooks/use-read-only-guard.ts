import { isObjectReadOnly, type LedgerObject } from '@/services/ledger';
import { router } from 'expo-router';
import { useEffect } from 'react';

// Екрани редагування не відкриваються для архівованого обʼєкта (лише
// перегляд): якщо сюди потрапили через історію чи посилання — одразу назад.
// Повертає true, поки екран має нічого не рендерити
export function useReadOnlyGuard(object: LedgerObject | undefined) {
  const isReadOnly = object !== undefined && isObjectReadOnly(object);
  useEffect(() => {
    if (isReadOnly && router.canGoBack()) router.back();
  }, [isReadOnly]);
  return isReadOnly;
}
