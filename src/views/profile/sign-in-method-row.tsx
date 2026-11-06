import {
  HStack,
  ThemedBadge,
  ThemedText,
  ThemedView,
  VStack,
} from '@/components';
import type { SignInMethod } from '@/services/auth';
import { getProviderSubtitle } from '@/services/profile';
import { StyleSheet } from 'react-native';
import { ProviderLogo } from './provider-logo';

export function SignInMethodRow({ method }: { method: SignInMethod | null }) {
  const subtitle = getProviderSubtitle(method);
  return (
    <HStack
      align='center'
      spacing={14}
      style={styles.row}
      testID='profile.signInMethod'
      accessible
      accessibilityLabel={['Спосіб входу', subtitle, 'Підключено']
        .filter(Boolean)
        .join('. ')}
    >
      {method && (
        <ThemedView
          backgroundColor={method === 'apple' ? 'btnDarkBg' : 'surface2'}
          style={styles.logo}
        >
          <ProviderLogo method={method} size={20} />
        </ThemedView>
      )}
      <VStack spacing={2} style={styles.copy}>
        <ThemedText font='rowTitle'>Спосіб входу</ThemedText>
        {subtitle && (
          <ThemedText font='caption' color='muted'>
            {subtitle}
          </ThemedText>
        )}
      </VStack>
      <ThemedBadge text='Підключено' type='green' />
    </HStack>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 64,
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
  },
});
