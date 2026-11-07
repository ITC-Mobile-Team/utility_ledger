import { iconTiles } from '@/constants/icon-sizes';
import { AppImage, ThemedText, ThemedView, VStack, HStack } from '@/components';
import {
  formatDuration,
  formatTime,
  type PowerStatus,
  type ZonedNow,
} from '@/services/outages';
import { StyleSheet } from 'react-native';

type PowerStatusCardProps = {
  status: PowerStatus;
  now: ZonedNow;
};

const describe = (
  status: PowerStatus,
  { date: today, minutes: now }: ZonedNow,
) => {
  switch (status.kind) {
    case 'off': {
      const { end, switchEnd } = status.interval;
      const until =
        switchEnd > end
          ? `Увімкнуть між ${formatTime(end)} і ${formatTime(switchEnd)}`
          : `Увімкнуть о ${formatTime(end)}`;
      return {
        title: 'Світла немає',
        subtitle: `${until} · через ${formatDuration(end - now)}`,
      };
    }
    case 'switching':
      return {
        title: 'Можливе увімкнення',
        subtitle: `Перемикання до ${formatTime(status.interval.switchEnd)} — світло можуть дати будь-якої миті`,
      };
    case 'on': {
      if (!status.next) {
        return { title: 'Світло є', subtitle: 'Найближчих вимкнень немає' };
      }
      const { date, interval } = status.next;
      const start = formatTime(interval.start);
      return date === today
        ? {
            title: 'Світло є',
            subtitle: `До ${start} · вимкнення через ${formatDuration(interval.start - now)}`,
          }
        : {
            title: 'Світло є',
            subtitle: `Наступне вимкнення завтра о ${start}`,
          };
    }
  }
};

// Велика картка «що зараз»: жовта, коли світло є, темна — коли немає
export function PowerStatusCard({ status, now }: PowerStatusCardProps) {
  const isOff = status.kind !== 'on';
  const { title, subtitle } = describe(status, now);
  return (
    <ThemedView
      backgroundColor={isOff ? 'powerOff' : 'powerOnSoft'}
      accessibilityRole='summary'
      accessibilityLiveRegion='polite'
      style={styles.card}
    >
      <HStack align='center' spacing={14}>
        <ThemedView
          backgroundColor={isOff ? 'powerOff' : 'powerOn'}
          style={[styles.icon, isOff && styles.iconOff]}
        >
          <AppImage
            icon={isOff ? 'bulbOff' : 'bulb'}
            container={iconTiles.large}
          />
        </ThemedView>
        <VStack spacing={2} style={styles.copy}>
          <ThemedText
            font='headline'
            color={isOff ? 'powerOffInk' : 'ink'}
            style={styles.title}
          >
            {title}
          </ThemedText>
          <ThemedText
            font='bodySmall'
            color={isOff ? 'powerOffInk' : 'ink'}
            style={styles.subtitle}
          >
            {subtitle}
          </ThemedText>
        </VStack>
      </HStack>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderCurve: 'continuous',
    padding: 18,
  },
  icon: {
    width: iconTiles.large,
    height: iconTiles.large,
    borderRadius: iconTiles.large / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOff: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  copy: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    opacity: 0.85,
  },
});
