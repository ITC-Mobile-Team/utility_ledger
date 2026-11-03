import {
  type LedgerRepository,
  type LedgerState,
  ledgerRepository,
} from '@/services/ledger';
import {
  createContext,
  use,
  useSyncExternalStore,
  type PropsWithChildren,
} from 'react';

const LedgerContext = createContext<LedgerRepository | null>(null);

type Props = PropsWithChildren<{ repository?: LedgerRepository }>;

export function LedgerProvider({
  repository = ledgerRepository,
  children,
}: Props) {
  return <LedgerContext value={repository}>{children}</LedgerContext>;
}

// Репозиторій для мутацій (addObject, setReading…)
export function useLedger() {
  const repository = use(LedgerContext);
  if (!repository)
    throw new Error('useLedger must be used inside LedgerProvider');
  return repository;
}

// Поточний знімок даних; компонент перерендериться після кожної мутації
export function useLedgerState(): LedgerState {
  const repository = useLedger();
  return useSyncExternalStore(repository.subscribe, repository.getSnapshot);
}

export function useLedgerObject(objectId: string | undefined) {
  const state = useLedgerState();
  return state.objects.find((object) => object.id === objectId);
}
