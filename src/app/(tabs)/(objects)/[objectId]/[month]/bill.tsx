import {
  ActionButton,
  AppImage,
  HStack,
  NavigationView,
  ThemedText,
  ThemedView,
  VStack,
  Pressable,
} from '@/components';
import { useLedgerObject, useLedgerState } from '@/providers/ledger-provider';
import {
  calculateMonth,
  formatMoney,
  formatMonthTitle,
  formatNumber,
  formatShortAddress,
  formatTariff,
  getMonthName,
  isMonthKey,
  type MonthKey,
  pluralForms,
  pluralize,
  type ServiceBill,
} from '@/services/ledger';
import { ServiceIcon } from '@/views';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  type CSSTransitionProperties,
} from 'react-native-reanimated';

// Рядок у розгорнутих деталях послуги; 'divider' — тонка лінія між блоками
type DetailLine = { label: string; value: string } | 'divider';

type BillRow = {
  subtitle: string;
  lines: DetailLine[];
};

const range = (previous: number, current: number) =>
  `${formatNumber(previous)} → ${formatNumber(current)}`;

const describe = (item: ServiceBill, month: MonthKey): BillRow => {
  const { service } = item;
  const unit = service.unit;
  switch (service.mode) {
    case 'meter': {
      const previous = item.previous ?? 0;
      if (item.current === undefined) {
        return {
          subtitle: 'Показник ще не внесено',
          lines: [
            item.night
              ? { label: '☀️ День, попередній', value: formatNumber(previous) }
              : { label: 'Попередній показник', value: formatNumber(previous) },
            ...(item.night
              ? [
                  {
                    label: '🌙 Ніч, попередній',
                    value: formatNumber(item.night.previous),
                  },
                ]
              : []),
            'divider',
            { label: 'Тариф', value: formatTariff(service) },
          ],
        };
      }
      const consumption = item.consumption ?? 0;
      if (item.night) {
        const night = item.night;
        const nightConsumption = night.consumption ?? 0;
        const nightTariff = service.nightTariff ?? 0;
        return {
          subtitle: `${formatNumber(consumption + nightConsumption)} ${unit} · день / ніч`,
          lines: [
            { label: '☀️ День', value: range(previous, item.current) },
            {
              label: '🌙 Ніч',
              value: range(night.previous, night.current ?? night.previous),
            },
            'divider',
            {
              label: `${formatNumber(consumption)} ${unit} × ${formatMoney(service.tariff)}`,
              value: formatMoney(consumption * service.tariff),
            },
            {
              label: `${formatNumber(nightConsumption)} ${unit} × ${formatMoney(nightTariff)}`,
              value: formatMoney(nightConsumption * nightTariff),
            },
          ],
        };
      }
      if (item.water) {
        const { water } = item;
        return {
          subtitle: `${formatNumber(consumption)} ${unit} · вода і стоки`,
          lines: [
            { label: 'Показники', value: range(previous, item.current) },
            'divider',
            {
              label: `Вода · ${formatNumber(consumption)} ${unit} × ${formatMoney(service.tariff)}`,
              value: formatMoney(water.supply),
            },
            {
              label: `Стоки · ${formatNumber(consumption)} ${unit} × ${formatMoney(service.sewageTariff ?? 0)}`,
              value: formatMoney(water.sewage),
            },
            ...(water.fees > 0
              ? [{ label: 'Абонплата', value: formatMoney(water.fees) }]
              : []),
          ],
        };
      }
      return {
        subtitle: `${formatNumber(consumption)} ${unit} спожито`,
        lines: [
          { label: 'Показники', value: range(previous, item.current) },
          'divider',
          {
            label: `${formatNumber(consumption)} ${unit} × ${formatMoney(service.tariff)}`,
            value: formatMoney(item.amount ?? 0),
          },
        ],
      };
    }
    case 'fixed':
      return {
        subtitle: 'Фіксована сума',
        lines: [{ label: 'Щомісяця', value: formatMoney(service.tariff) }],
      };
    case 'day': {
      const days = item.days;
      if (days === undefined) {
        const monthName = getMonthName(month).toLocaleLowerCase('uk');
        return {
          subtitle: 'Дні ще не внесено',
          lines: [
            {
              label: `Кількість днів за ${monthName} ще не внесено`,
              value: '—',
            },
          ],
        };
      }
      return {
        subtitle: `${days} ${pluralize(days, pluralForms.day)}`,
        lines: [
          {
            label: `${days} ${pluralize(days, pluralForms.day)} × ${formatMoney(service.tariff)}`,
            value: formatMoney(item.amount ?? 0),
          },
        ],
      };
    }
    case 'invoice': {
      // «за листопад» — знахідний відмінок збігається з називним
      const monthName = getMonthName(month).toLocaleLowerCase('uk');
      return {
        subtitle:
          item.amount === null ? 'Суму ще не внесено' : 'Сума з рахунку',
        lines: [
          item.amount === null
            ? { label: `Суму за ${monthName} ще не внесено`, value: '—' }
            : {
                label: `Внесено вручну за ${monthName}`,
                value: formatMoney(item.amount),
              },
        ],
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
  const [openIds, setOpenIds] = useState<string[]>([]);

  if (!object || !isMonthKey(month)) return null;

  const { items, total, calculatedCount } = calculateMonth(
    state,
    object.id,
    month,
  );

  const groups = [
    {
      title: 'За лічильниками',
      items: items.filter((item) => item.service.mode === 'meter'),
    },
    {
      title: 'Щомісячні платежі',
      items: items.filter((item) => item.service.mode !== 'meter'),
    },
  ].filter((group) => group.items.length > 0);

  const serviceCount = `${items.length} ${pluralize(items.length, pluralForms.service)}`;
  const summary =
    calculatedCount === items.length
      ? `до сплати · ${serviceCount}`
      : `до сплати · розраховано ${calculatedCount} з ${serviceCount}`;

  const toggle = (id: string) =>
    setOpenIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );

  return (
    <NavigationView
      type='short'
      title='Розрахунок'
      barType='blue'
      cornerRadius={28}
      contentInsets={{ horizontal: 20, bottom: 32 }}
    >
      {/* У макеті між чеком і кнопкою 14 px; зубці вже займають TOOTH_HEIGHT */}
      <VStack spacing={14 - TOOTH_HEIGHT}>
        <ThemedView backgroundColor='surface' style={styles.receipt}>
          <ZigzagEdge edge='top' />
          <ZigzagEdge edge='bottom' />

          <VStack spacing={4} align='center' style={styles.head}>
            <ThemedText color='muted' font='overline' align='center'>
              {formatMonthTitle(month).toLocaleUpperCase('uk')}
            </ThemedText>
            <ThemedText color='muted' font='caption' align='center'>
              {formatShortAddress(object)}
            </ThemedText>
            <ThemedText
              font='receiptTotal'
              color={total === 0 ? 'muted' : 'ink'}
              style={[styles.headTotal, styles.tabular]}
            >
              {formatMoney(total)}
            </ThemedText>
            {items.length > 0 && (
              <ThemedText color='muted' font='caption' align='center'>
                {summary}
              </ThemedText>
            )}
          </VStack>

          {items.length === 0 ? (
            <>
              <Dashed />
              <VStack spacing={10} align='center' style={styles.empty}>
                <ThemedView backgroundColor='surface2' style={styles.emptyIcon}>
                  <AppImage
                    icon='gauge'
                    tintColor='muted'
                    size={{ width: 22 }}
                  />
                </ThemedView>
                <ThemedText font='heading'>Ще нічого рахувати</ThemedText>
                <ThemedText color='muted' font='caption' align='center'>
                  {`Додайте послуги обʼєкта з тарифами та внесіть показники за ${getMonthName(month).toLocaleLowerCase('uk')} — тут зʼявиться чек.`}
                </ThemedText>
              </VStack>
            </>
          ) : (
            groups.map((group) => (
              <View key={group.title}>
                <Dashed />
                <ThemedText color='muted' font='overline' style={styles.group}>
                  {group.title.toLocaleUpperCase('uk')}
                </ThemedText>
                {group.items.map((item) => (
                  <BillItem
                    key={item.service.id}
                    item={item}
                    row={describe(item, month)}
                    open={openIds.includes(item.service.id)}
                    onToggle={() => toggle(item.service.id)}
                  />
                ))}
              </View>
            ))
          )}

          <View style={styles.footer}>
            <Dashed />
            <View style={styles.totalRow}>
              <ThemedText font='rowTitle' style={[styles.flex, styles.bold]}>
                Разом
              </ThemedText>
              <ThemedText
                font='totalValue'
                color={total === 0 ? 'muted' : 'ink'}
                style={styles.tabular}
              >
                {formatMoney(total)}
              </ThemedText>
            </View>
            {items.length > 0 && (
              <ThemedText color='muted' font='caption' style={styles.help}>
                Торкніться послуги, щоб побачити показники й тариф. Це
                розрахунок, а не підтвердження оплати.
              </ThemedText>
            )}
          </View>
        </ThemedView>

        {items.length > 0 ? (
          <ActionButton
            title='Зберегти розрахунок'
            onPress={() => router.back()}
          />
        ) : (
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

const chevronTransition: CSSTransitionProperties = {
  transitionProperty: 'transform',
  transitionDuration: 200,
  transitionTimingFunction: 'ease-out',
};

type BillItemProps = {
  item: ServiceBill;
  row: BillRow;
  open: boolean;
  onToggle: () => void;
};

function BillItem({ item, row, open, onToggle }: BillItemProps) {
  const isZero = item.amount === null || item.amount === 0;
  return (
    <View>
      <Pressable
        guarded={false}
        accessibilityRole='button'
        accessibilityState={{ expanded: open }}
        onPress={onToggle}
        style={(state) => [styles.itemRow, state.pressed && styles.pressed]}
      >
        <ServiceIcon icon={item.service.icon} size={36} />
        <VStack spacing={2} style={styles.flex}>
          <ThemedText font='rowTitleCompact'>{item.service.name}</ThemedText>
          <ThemedText color='muted' font='caption'>
            {row.subtitle}
          </ThemedText>
        </VStack>
        <ThemedText
          font='rowTitleCompact'
          color={isZero ? 'muted' : 'ink'}
          style={styles.tabular}
        >
          {item.amount === null ? '—' : formatMoney(item.amount)}
        </ThemedText>
        {/* chevronRight, повернутий донизу; відкритий — догори */}
        <Animated.View
          style={[
            { transform: [{ rotate: open ? '-90deg' : '90deg' }] },
            chevronTransition,
          ]}
        >
          <AppImage icon='chevronRight' tintColor='chev' size={{ width: 18 }} />
        </Animated.View>
      </Pressable>

      {open && (
        <ThemedView backgroundColor='surface2' style={styles.details}>
          {row.lines.map((line, index) =>
            line === 'divider' ? (
              <ThemedView
                key={index}
                borderColor='line'
                style={styles.detailsDivider}
              />
            ) : (
              <HStack key={index} spacing={12} style={styles.detailsRow}>
                <ThemedText color='muted' font='caption' style={styles.flex}>
                  {line.label}
                </ThemedText>
                <ThemedText font='status' align='right' style={styles.tabular}>
                  {line.value}
                </ThemedText>
              </HStack>
            ),
          )}
        </ThemedView>
      )}
    </View>
  );
}

// Зубці як у макеті: 14 px завширшки, 7 px заввишки
const TOOTH_WIDTH = 14;
const TOOTH_HEIGHT = TOOTH_WIDTH / 2;

function ZigzagEdge({ edge }: { edge: 'top' | 'bottom' }) {
  const [width, setWidth] = useState(0);
  const count = Math.max(1, Math.round(width / TOOTH_WIDTH));
  const step = width / count;
  const side = step / Math.SQRT2;

  return (
    <View
      pointerEvents='none'
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={[styles.zigzag, { [edge]: 0 }]}
    >
      {width > 0 &&
        Array.from({ length: count }, (_, index) => (
          <ThemedView
            key={index}
            backgroundColor='surface'
            style={[
              styles.tooth,
              {
                width: side,
                height: side,
                left: index * step + (step - side) / 2,
                [edge]: -side / 2,
              },
            ]}
          />
        ))}
    </View>
  );
}

const DASH_WIDTH = 1.5;

// iOS не малює пунктир лише на одній стороні рамки, тож беремо рамку з усіх
// боків і показуємо тільки верхню через обрізання
function Dashed() {
  return (
    <View style={styles.dashedClip}>
      <ThemedView borderColor='line' style={styles.dashed} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
  receipt: {
    // У макеті відступи 30/26 рахуються від вершин зубців, а тут зубці
    // малюються поза блоком — віднімаємо їхню висоту
    paddingTop: 30 - TOOTH_HEIGHT,
    paddingHorizontal: 20,
    paddingBottom: 26 - TOOTH_HEIGHT,
    marginVertical: TOOTH_HEIGHT,
    boxShadow: '0 6px 14px rgba(16, 32, 64, 0.10)',
  },
  head: {
    paddingBottom: 22,
  },
  headTotal: {
    marginTop: 10,
  },
  group: {
    paddingTop: 18,
    paddingBottom: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  pressed: {
    opacity: 0.6,
  },
  details: {
    marginTop: 2,
    marginBottom: 10,
    borderRadius: 14,
    borderCurve: 'continuous',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 8,
  },
  detailsRow: {
    justifyContent: 'space-between',
  },
  detailsDivider: {
    borderTopWidth: StyleSheet.hairlineWidth * 2,
  },
  footer: {
    marginTop: 8,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingTop: 18,
  },
  bold: {
    fontWeight: '700',
  },
  help: {
    paddingTop: 10,
  },
  zigzag: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  tooth: {
    position: 'absolute',
    transform: [{ rotate: '45deg' }],
  },
  dashedClip: {
    height: DASH_WIDTH,
    overflow: 'hidden',
  },
  dashed: {
    height: DASH_WIDTH * 4,
    borderWidth: DASH_WIDTH,
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
});
