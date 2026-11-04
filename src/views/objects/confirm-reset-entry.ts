import {
  getMonthName,
  type LedgerService,
  type MonthKey,
} from '@/services/ledger';
import { Alert } from 'react-native';

// Підтвердження скидання внесеного за місяць значення послуги
export function confirmResetEntry(
  service: Pick<LedgerService, 'name'>,
  month: MonthKey,
  onReset: () => void,
) {
  const monthName = getMonthName(month).toLocaleLowerCase('uk');
  const message = `Внесене значення за ${monthName} буде видалено, а послуга знову стане «Внести». Тариф і налаштування послуги не зміняться.`;
  Alert.alert(`Скинути «${service.name}»?`, message, [
    { text: 'Скасувати', style: 'cancel' },
    { text: 'Скинути', style: 'destructive', onPress: onReset },
  ]);
}
