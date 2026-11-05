import {
  AppImage,
  HStack,
  IconView,
  ThemedText,
  ThemedView,
  VStack,
  Pressable,
} from '@/components';
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
import { StyleSheet } from 'react-native';
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
};

export function ObjectCard({
  object,
  services = [],
  month,
  status,
  testID,
  onPress,
}: ObjectCardProps) {
  const subtitle = formatObjectSubtitle(object);
  const showsFooter = services.length > 0;
  return (
    <Pressable
      disabled={!onPress}
      testID={testID}
      onPress={onPress}
      style={(state) => state.pressed && styles.pressed}
    >
      <ThemedView backgroundColor='surface' style={styles.container}>
        <VStack spacing={12} style={styles.content}>
          <HStack align='center' spacing={12}>
            <IconView
              icon={object.apartment ? 'apartment' : 'house'}
              background={object.apartment ? 'blue' : 'inkTile'}
              iconSize={{ width: 18 }}
              size={{ width: 42 }}
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

            {onPress && (
              <AppImage
                icon='chevronRight'
                tintColor='chev'
                size={{ width: 18 }}
              />
            )}
          </HStack>

          {showsFooter && (
            <>
              <ThemedView backgroundColor='line' style={styles.divider} />

              <HStack spacing={6} align='center'>
                {services.slice(0, 5).map((service) => (
                  <EmojiTile
                    key={service.id}
                    emoji={service.icon}
                    background={getServiceIconBackground(service.icon)}
                    size={28}
                    rounded
                  />
                ))}
              </HStack>
            </>
          )}
        </VStack>
      </ThemedView>
    </Pressable>
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
  pressed: {
    opacity: 0.7,
  },
});
