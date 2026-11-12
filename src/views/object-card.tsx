import {
  Chevron,
  HStack,
  IconView,
  ThemedText,
  ThemedView,
  VStack,
  Pressable,
} from '@/components';
import { iconTiles } from '@/constants/icon-sizes';
import { getServiceIconBackground } from '@/constants/service-icons';
import {
  formatAddress,
  formatObjectSubtitle,
  getMonthName,
  type LedgerObject,
  type LedgerService,
  type MonthKey,
  type MonthStatus,
} from '@/services/ledger';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { EmojiTile } from './objects/emoji-tile';
import { StatusLine } from './status-line';

type ObjectCardProps = {
  object: LedgerObject;
  services?: LedgerService[];
  // Статус поточного місяця; без нього нижня частина картки не показується
  month?: MonthKey;
  status?: MonthStatus;
  testID?: string;
  onPress?: () => void;
  // Нижній рядок у тій самій поверхні (перемикач на екрані «Архів»)
  footer?: ReactNode;
};

export function ObjectCard({
  object,
  services = [],
  month,
  status,
  testID,
  onPress,
  footer,
}: ObjectCardProps) {
  const subtitle = formatObjectSubtitle(object);
  const showsFooter = services.length > 0;
  return (
    <ThemedView backgroundColor='surface' style={styles.container}>
      <Pressable
        disabled={!onPress}
        testID={testID}
        onPress={onPress}
        style={(state) => state.pressed && styles.pressed}
      >
        <VStack spacing={12} style={styles.content}>
          <HStack align='center' spacing={12}>
            <IconView
              icon={object.apartment ? 'apartment' : 'house'}
              background={object.apartment ? 'blueSoft' : 'surface2'}
              size={{ width: iconTiles.menu }}
            />

            <VStack spacing={2} style={styles.title}>
              <ThemedText font='rowTitle'>{formatAddress(object)}</ThemedText>
              {subtitle.length > 0 && (
                <ThemedText color='muted' font='caption'>
                  {subtitle}
                </ThemedText>
              )}
              {month && status && (
                <MonthStatusLine month={month} status={status} />
              )}
            </VStack>

            {onPress && <Chevron direction='right' />}
          </HStack>

          {showsFooter && (
            <>
              <ThemedView backgroundColor='line' style={styles.divider} />

              {/* Усі послуги обʼєкта; що не вміщається — переноситься */}
              <View style={styles.services}>
                {services.map((service) => (
                  <EmojiTile
                    key={service.id}
                    emoji={service.icon}
                    background={getServiceIconBackground(service.icon)}
                    size={iconTiles.compact}
                  />
                ))}
              </View>
            </>
          )}
        </VStack>
      </Pressable>

      {/* Поза Pressable: власні елементи керування (перемикач) лишаються
          окремими для дотику й VoiceOver */}
      {footer && (
        <VStack spacing={12} style={styles.footer}>
          <ThemedView backgroundColor='line' style={styles.divider} />
          {footer}
        </VStack>
      )}
    </ThemedView>
  );
}

function MonthStatusLine({
  month,
  status,
}: {
  month: MonthKey;
  status: MonthStatus;
}) {
  const isNew = status === 'new';
  const monthName = getMonthName(month);
  return (
    <VStack style={styles.statusLine}>
      <StatusLine
        tone={isNew ? 'attention' : 'done'}
        text={
          isNew
            ? `Внести показники за ${monthName.toLowerCase()}`
            : `${monthName} заповнено`
        }
      />
    </VStack>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 22,
    borderCurve: 'continuous',
  },
  content: {
    padding: 16,
  },
  title: {
    flex: 1,
  },
  statusLine: {
    marginTop: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  services: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  pressed: {
    opacity: 0.7,
  },
});
