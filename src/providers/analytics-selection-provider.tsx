import { useLedgerState } from '@/providers/ledger-provider';
import {
  type AnalyticsPeriod,
  type AnalyticsSelection,
  getDefaultPeriod,
  normalizeSelection,
} from '@/services/analytics';
import { createContext, type PropsWithChildren, use, useState } from 'react';

type AnalyticsSelectionValue = {
  period: AnalyticsPeriod;
  setPeriod: (period: AnalyticsPeriod) => void;
  rawSelection: AnalyticsSelection | null;
  setSelection: (selection: AnalyticsSelection) => void;
};

const AnalyticsSelectionContext = createContext<AnalyticsSelectionValue | null>(
  null,
);

// Період і адреса «Аналітики», спільні для головного екрана й деталей.
// Живуть, поки змонтована вкладка (перемикання вкладок не скидає), у сховище
// не пишуться: після холодного запуску — значення за замовчуванням
export function AnalyticsSelectionProvider({ children }: PropsWithChildren) {
  const [period, setPeriod] = useState(() => getDefaultPeriod());
  const [rawSelection, setSelection] = useState<AnalyticsSelection | null>(
    null,
  );
  return (
    <AnalyticsSelectionContext
      value={{ period, setPeriod, rawSelection, setSelection }}
    >
      {children}
    </AnalyticsSelectionContext>
  );
}

export function useAnalyticsSelection() {
  const context = use(AnalyticsSelectionContext);
  if (!context) {
    throw new Error(
      'useAnalyticsSelection must be used within AnalyticsSelectionProvider',
    );
  }
  const state = useLedgerState();
  const { rawSelection, ...rest } = context;
  // Адреса, доступна в поточних даних (видалену чи виключену замінює перша)
  return { ...rest, selection: normalizeSelection(state, rawSelection) };
}
