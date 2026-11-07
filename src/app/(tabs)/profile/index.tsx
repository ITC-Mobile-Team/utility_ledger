import {
  HStack,
  NavigationView,
  ThemedText,
  ThemedView,
  VStack,
} from '@/components';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { useAuth } from '@/providers/auth-provider';
import {
  useOutageNotificationToggle,
  useOutageSettings,
} from '@/providers/outage-provider';
import { usePreferences } from '@/providers/preferences-provider';
import { useProfile } from '@/providers/profile-provider';
import {
  getOutageSetupMessage,
  getOutageSetupStatus,
} from '@/services/outages';
import { getThemeLabel } from '@/services/preferences';
import {
  formatProfileEmail,
  getDisplayName,
  getInitial,
} from '@/services/profile';
import { ListCard, ListRow, SectionHeader } from '@/views';
import {
  confirmDestructive,
  OutageSetupNotice,
  ProfileCard,
  RowIcon,
  SignInMethodRow,
  StartTabRow,
} from '@/views/profile';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useRef } from 'react';
import { StyleSheet, Switch } from 'react-native';

export default function ProfileScreen() {
  const profile = useProfile();
  const { signOut } = useAuth();
  const { theme, startTab, setStartTab } = usePreferences();
  const notifications = useOutageNotificationToggle();
  const setupStatus = getOutageSetupStatus(useOutageSettings());
  const switchOn = useThemeColor('green');
  // Підтвердження приходить із системного діалогу, тож повторний вихід
  // блокуємо самі
  const isSigningOut = useRef(false);

  const name = getDisplayName(profile);
  const method = profile?.method ?? null;
  const version = Constants.expoConfig?.version;

  const openEditName = () => router.push('/profile/edit-name');

  // Таб-бар перемикається на «Світло» сам: `navigate` не дублює екран, якщо
  // налаштування вже відкриті там
  const openOutageSettings = () => router.navigate('/outage-settings');

  // Вихід лише знімає сесію: `Stack.Protected` сам відкриває `(auth)`, а дані
  // й налаштування лишаються на пристрої, доки їх не замінить Firebase
  const leave = async () => {
    if (isSigningOut.current) return;
    isSigningOut.current = true;
    try {
      await signOut();
    } finally {
      isSigningOut.current = false;
    }
  };

  const confirmSignOut = () =>
    confirmDestructive({
      title: 'Вийти з акаунта?',
      confirmText: 'Вийти',
      onConfirm: leave,
    });

  const confirmDelete = () =>
    confirmDestructive({
      title: 'Видалити акаунт?',
      message:
        'Поки що це лише вихід з акаунта. Видалення даних зʼявиться згодом.',
      confirmText: 'Видалити акаунт',
      onConfirm: leave,
    });

  return (
    <NavigationView
      title='Профіль'
      subtitle='Імʼя, документи та акаунт'
      barType='purple'
      cornerRadius={28}
      testID='profile.screen'
      contentInsets={{ top: 24, horizontal: 20, bottom: 32 }}
    >
      <VStack spacing={14}>
        <ProfileCard
          name={name}
          email={formatProfileEmail(profile?.email)}
          initial={getInitial(profile?.name)}
        />

        <VStack spacing={8} style={styles.section}>
          <SectionHeader title='Акаунт' variant='overline' />
          <ListCard>
            <ListRow
              leading={<RowIcon icon='person' background='purpleSoft' />}
              trailing={
                <ThemedText style={styles.value} numberOfLines={1}>
                  {name}
                </ThemedText>
              }
              testID='profile.name'
              onPress={openEditName}
            >
              <ThemedText font='rowTitle'>Імʼя</ThemedText>
            </ListRow>
            <SignInMethodRow method={method} />
          </ListCard>
        </VStack>

        <VStack spacing={8} style={styles.section}>
          <SectionHeader title='Сповіщення' variant='overline' />
          <ThemedView backgroundColor='surface' style={styles.card}>
            <HStack align='center' spacing={14} style={styles.row}>
              <RowIcon icon='bell' background='powerOnSoft' />
              <VStack spacing={2} style={styles.flex}>
                <ThemedText font='rowTitle'>Вимкнення світла</ThemedText>
                <ThemedText font='caption' color='muted'>
                  {notifications.enabled
                    ? 'Попереджати перед вимкненням за графіком'
                    : 'Сповіщення вимкнено'}
                </ThemedText>
              </VStack>
              <Switch
                value={notifications.enabled}
                onValueChange={notifications.setEnabled}
                trackColor={{ true: switchOn }}
                accessibilityLabel='Вимкнення світла'
                testID='profile.notify'
              />
            </HStack>
            {setupStatus !== 'ready' && (
              <>
                <ThemedView backgroundColor='line' style={styles.divider} />
                <OutageSetupNotice
                  message={getOutageSetupMessage(setupStatus)}
                  onSetup={openOutageSettings}
                />
              </>
            )}
          </ThemedView>
        </VStack>

        <VStack spacing={8} style={styles.section}>
          <SectionHeader title='Застосунок' variant='overline' />
          <ListCard>
            <StartTabRow value={startTab} onChange={setStartTab} />
            <ListRow
              leading={<RowIcon icon='contrast' background='purpleSoft' />}
              trailing={
                <ThemedText style={styles.valueWide} numberOfLines={1}>
                  {getThemeLabel(theme)}
                </ThemedText>
              }
              testID='profile.theme'
              onPress={() => router.push('/profile/theme')}
            >
              <ThemedText font='rowTitle'>Тема</ThemedText>
            </ListRow>
          </ListCard>
        </VStack>

        <VStack spacing={8} style={styles.section}>
          <SectionHeader title='Документи' variant='overline' />
          <ListCard>
            <ListRow
              leading={<RowIcon icon='shield' />}
              testID='profile.privacy'
              onPress={() => router.push('/profile/privacy')}
            >
              <ThemedText font='rowTitle'>Політика конфіденційності</ThemedText>
              <ThemedText font='caption' color='muted'>
                Які дані ми зберігаємо і навіщо
              </ThemedText>
            </ListRow>
            <ListRow
              leading={<RowIcon icon='document' />}
              testID='profile.terms'
              onPress={() => router.push('/profile/terms')}
            >
              <ThemedText font='rowTitle'>Умови використання</ThemedText>
              <ThemedText font='caption' color='muted'>
                Правила користування застосунком
              </ThemedText>
            </ListRow>
          </ListCard>
        </VStack>

        <ListCard style={styles.accountActions}>
          <ListRow
            leading={<RowIcon icon='signOut' background='surface2' />}
            showsChevron={false}
            testID='profile.signOut'
            onPress={confirmSignOut}
          >
            <ThemedText font='rowTitle'>Вийти</ThemedText>
          </ListRow>
        </ListCard>

        <ListCard>
          <ListRow
            leading={<RowIcon icon='trash' background='coralSoft' />}
            showsChevron={false}
            testID='profile.delete'
            onPress={confirmDelete}
          >
            <ThemedText font='rowTitle' color='coral'>
              Видалити акаунт
            </ThemedText>
          </ListRow>
        </ListCard>

        {version && (
          <ThemedText
            font='footnote'
            color='muted'
            style={styles.version}
            testID='profile.version'
          >
            Utility Ledger · версія {version}
          </ThemedText>
        )}
      </VStack>
    </NavigationView>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 6,
  },
  // Разом із відступом між блоками (14) дає 40 — вдвічі більше, ніж між
  // розділами, щоб «Вийти» і «Видалити акаунт» не плуталися з документами
  accountActions: {
    marginTop: 26,
  },
  card: {
    borderRadius: 22,
    borderCurve: 'continuous',
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 64,
  },
  flex: {
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  value: {
    maxWidth: 96,
    fontSize: 15,
  },
  valueWide: {
    maxWidth: 140,
    fontSize: 15,
  },
  version: {
    textAlign: 'center',
  },
});
