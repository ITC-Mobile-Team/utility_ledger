import { useAccountDataStatus } from '@/providers/account-data-provider';
import type { PropsWithChildren, ReactNode } from 'react';
import { AccountDataOffline } from './account-data-offline';

type Props = PropsWithChildren<{ skeleton: ReactNode }>;

// Вміст кореневого екрана табу, поки дані акаунта не отримані вперше на цьому
// пристрої: скелетон, без звʼязку — «Немає інтернету». Порожні стани й
// пропозиції налаштувати до цього не показуються (FR-011)
export function AccountDataGate({ skeleton, children }: Props) {
  const { status, retry } = useAccountDataStatus();
  if (status === 'loading') return skeleton;
  if (status === 'offline') return <AccountDataOffline onRetry={retry} />;
  return children;
}
