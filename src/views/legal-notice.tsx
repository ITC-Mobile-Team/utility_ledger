import { StyleSheet, type TextProps } from 'react-native';
import { openBrowserAsync } from 'expo-web-browser';
import { guardPress, ThemedText } from '@/components';

const TERMS_URL = 'https://google.com.ua';
const PRIVACY_URL = 'https://google.com.ua';

export const LegalNotice = ({ style }: TextProps) => {
  return (
    <ThemedText color='muted' font='footnote' align='center' style={style}>
      Продовжуючи, ви приймаєте <TextLink url={TERMS_URL}>умови</TextLink> й{' '}
      <TextLink url={PRIVACY_URL}>політику приватності</TextLink>.
    </ThemedText>
  );
};

function TextLink({ url, children }: { url: string; children: string }) {
  return (
    <ThemedText
      color='blueInk'
      font='footnote'
      style={styles.link}
      accessibilityRole='link'
      suppressHighlighting
      onPress={guardPress(() => openBrowserAsync(url))}
    >
      {children}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  link: { fontWeight: '600' },
});
