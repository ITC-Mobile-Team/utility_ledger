import {
  AppImage,
  HStack,
  IconView,
  Spacer,
  ThemedBadge,
  ThemedText,
  ThemedView,
  VStack,
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
import { Pressable, StyleSheet } from 'react-native';
import { EmojiTile } from './objects/emoji-tile';

type ObjectCardProps = {
  object: LedgerObject;
  services?: LedgerService[];
  // Статус поточного місяця; без нього нижня частина картки не показується
  month?: MonthKey;
  status?: MonthStatus;
  onPress?: () => void;
};

export function ObjectCard({
  object,
  services = [],
  month,
  status,
  onPress,
}: ObjectCardProps) {
  const subtitle = formatObjectSubtitle(object);
  const showsFooter = services.length > 0 && month && status;
  return (
    <Pressable
      disabled={!onPress}
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

                <Spacer />

                {status === 'new' ? (
                  <ThemedBadge
                    text={`${getMonthName(month)} · внести показники`}
                    type='red'
                  />
                ) : (
                  <ThemedBadge
                    text={`${getMonthName(month)} заповнено`}
                    type='green'
                  />
                )}
              </HStack>
            </>
          )}
        </VStack>
      </ThemedView>
    </Pressable>
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
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.7,
  },
});
