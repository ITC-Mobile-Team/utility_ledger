import type { SignInMethod } from '@/services/auth';
import { Image, type ImageSource } from 'expo-image';
import { useColorScheme } from 'react-native';

const googleLogo: ImageSource = require('@/assets/images/icons/socials/google.svg');

// Світла тема — білий логотип на темному колі, темна — навпаки (як кнопка входу)
const appleLogos: Record<'light' | 'dark', ImageSource> = {
  light: require('@/assets/images/icons/socials/apple-light.svg'),
  dark: require('@/assets/images/icons/socials/apple-dark.svg'),
};

type ProviderLogoProps = {
  method: SignInMethod;
  size: number;
  // Логотип Apple на світлому фоні (підказка на екрані імені)
  onLight?: boolean;
};

export function ProviderLogo({ method, size, onLight }: ProviderLogoProps) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const source =
    method === 'google'
      ? googleLogo
      : appleLogos[onLight ? (scheme === 'dark' ? 'light' : 'dark') : scheme];
  return (
    <Image
      source={source}
      style={{ width: size, height: size }}
      contentFit='contain'
    />
  );
}
