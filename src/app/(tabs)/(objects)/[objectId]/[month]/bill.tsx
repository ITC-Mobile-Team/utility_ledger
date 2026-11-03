import {
  ActionButton,
  AppImage,
  HStack,
  NavigationView,
  ThemedText,
  ThemedView,
  VStack,
} from '@/components';
import { useLedgerObject, useLedgerState } from '@/providers/ledger-provider';
import {
  calculateMonth,
  formatMoney,
  formatMonthTitle,
  formatNumber,
  formatShortAddress,
  formatTariff,
  getMonthLocative,
  getMonthName,
  isMonthKey,
  type MonthKey,
  pluralForms,
  pluralize,
  type ServiceBill,
} from '@/services/ledger';
import { ServiceIcon } from '@/views';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';

type BillLine = {
  tag: string;
  details: string;
  formula: string;
};

const describe = (item: ServiceBill, month: MonthKey): BillLine => {
  const { service } = item;
  switch (service.mode) {
    case 'meter':
      if (item.night) {
        const { night } = item;
        return {
          tag: 'День / Ніч',
          details:
            item.current === undefined
              ? 'Показник ще не внесено'
              : `☀️ ${formatNumber(item.previous ?? 0)} → ${formatNumber(item.current)} · 🌙 ${formatNumber(night.previous)} → ${formatNumber(night.current ?? 0)}`,
          formula: `☀️ ${formatNumber(item.consumption ?? 0)} + 🌙 ${formatNumber(night.consumption ?? 0)} ${service.unit} × тариф`,
        };
      }
      return {
        tag: 'Показник',
        details:
          item.current === undefined
            ? 'Показник ще не внесено'
            : `${formatNumber(item.previous ?? 0)} → ${formatNumber(item.current)} · спожито ${formatNumber(item.consumption ?? 0)} ${service.unit}`,
        formula: `${formatNumber(item.consumption ?? 0)} ${service.unit} × тариф`,
      };
    case 'fixed':
      return {
        tag: 'Фіксована',
        details: 'Однакова сума щомісяця',
        formula: 'Фіксований тариф',
      };
    case 'day': {
      const days = item.days ?? 0;
      return {
        tag: 'За днями',
        details: `${days} ${pluralize(days, pluralForms.day)} у ${getMonthLocative(month)}`,
        formula: `${days} ${pluralize(days, pluralForms.day)} × ставка`,
      };
    }
  }
};

export default function Bill() {
  const { objectId, month } = useLocalSearchParams<{
    objectId: string;
    month: string;
  }>();
  const state = useLedgerState();
  const object = useLedgerObject(objectId);

  if (!object || !isMonthKey(month)) return null;

  const { items, total, calculatedCount } = calculateMonth(
    state,
    object.id,
    month,
  );

  return (
    <NavigationView
      type='short'
      title='Розрахунок'
      barType='blue'
      cornerRadius={28}
      contentInsets={{ horizontal: 20, bottom: 32 }}
    >
      <VStack spacing={20}>
        <ThemedView backgroundColor='surface' style={styles.receipt}>
          <VStack spacing={8} align='center'>
            <ThemedView backgroundColor='blueSoft' style={styles.receiptIcon}>
              <AppImage icon='document' tintColor='blue' size={{ width: 18 }} />
            </ThemedView>
            <ThemedText font='dialogTitle'>Розрахунок за місяць</ThemedText>
            <ThemedText color='muted' font='caption' align='center'>
              {`${formatMonthTitle(month)} · ${formatShortAddress(object)}`}
            </ThemedText>
          </VStack>

          <Dashed />

          {items.length === 0 ? (
            <VStack spacing={10} align='center' style={styles.empty}>
              <ThemedView backgroundColor='surface2' style={styles.emptyIcon}>
                <AppImage icon='gauge' tintColor='muted' size={{ width: 22 }} />
              </ThemedView>
              <ThemedText font='heading'>Ще нічого рахувати</ThemedText>
              <ThemedText color='muted' font='caption' align='center'>
                {`Додайте послуги обʼєкта з тарифами та внесіть показники за ${getMonthName(month).toLocaleLowerCase('uk')} — тут зʼявиться чек.`}
              </ThemedText>
            </VStack>
          ) : (
            items.map((item) => {
              const line = describe(item, month);
              return (
                <VStack key={item.service.id} spacing={8} style={styles.line}>
                  <HStack align='center' spacing={8}>
                    <ServiceIcon icon={item.service.icon} size={24} />
                    <ThemedText font='rowTitle' style={styles.flex}>
                      {item.service.name}
                    </ThemedText>
                    <ThemedText
                      font='rowTitle'
                      color={item.amount === null ? 'muted' : 'ink'}
                    >
                      {item.amount === null ? '—' : formatMoney(item.amount)}
                    </ThemedText>
                  </HStack>
                  <HStack align='center' spacing={8}>
                    <ThemedView backgroundColor='surface2' style={styles.tag}>
                      <ThemedText color='muted' font='serviceTag'>
                        {line.tag}
                      </ThemedText>
                    </ThemedView>
                    <ThemedText
                      color='muted'
                      font='caption'
                      style={styles.flex}
                    >
                      {line.details}
                    </ThemedText>
                  </HStack>
                  <HStack align='center' spacing={8}>
                    <ThemedText
                      color='muted'
                      font='caption'
                      style={styles.flex}
                    >
                      {line.formula}
                    </ThemedText>
                    <ThemedView
                      backgroundColor='surface2'
                      style={styles.tariff}
                    >
                      <ThemedText font='labelStrong'>
                        {formatTariff(item.service)}
                      </ThemedText>
                    </ThemedView>
                  </HStack>
                </VStack>
              );
            })
          )}

          <Dashed />

          <HStack align='center'>
            <ThemedText font='heading' style={styles.flex}>
              Разом до сплати
            </ThemedText>
            <ThemedText
              font='counterValue'
              color={total === 0 ? 'muted' : 'ink'}
            >
              {formatMoney(total)}
            </ThemedText>
          </HStack>

          {items.length > 0 && (
            <ThemedText color='muted' font='caption'>
              {`Розраховано послуг: ${calculatedCount} з ${items.length}. Тарифи задані в налаштуваннях послуг. Це розрахунок, а не підтвердження оплати.`}
            </ThemedText>
          )}
        </ThemedView>

        {items.length === 0 && (
          <ActionButton
            title='+  Додати послугу'
            onPress={() =>
              router.push({
                pathname: '/[objectId]/service-form',
                params: { objectId: object.id },
              })
            }
          />
        )}
      </VStack>
    </NavigationView>
  );
}

function Dashed() {
  return (
    <ThemedView
      backgroundColor='surface'
      borderColor='line'
      style={styles.dashed}
    />
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  receipt: {
    padding: 20,
    gap: 18,
    borderRadius: 4,
    boxShadow: '0 8px 24px rgba(15, 27, 45, 0.08)',
  },
  receiptIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashed: {
    borderWidth: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
  },
  empty: {
    paddingVertical: 12,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    paddingBottom: 4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tariff: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
});
