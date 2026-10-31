import { Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useRoute } from 'expo-router';
import { useNavigationState } from 'expo-router/build/react-navigation/index.js';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColor } from '@/constants/colors';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { AppFont, ThemedText } from '../themed-text';
import { HStack, VStack } from '../stack';
import { NavigationBarVariant } from './types';

type NavigationBarHeaderProps = {
  type: NavigationBarVariant;
  title: string;
  subtitle?: string;
  isTransparent: boolean;
  paddingBottom: number;
};

const getTitleFont = (
  isTransparent: boolean,
  type: NavigationBarVariant,
): AppFont => {
  if (isTransparent) return 'display';
  if (type === 'full') return 'title';
  return 'headline';
};

export const NavigationBarHeader = ({
  type,
  title,
  subtitle,
  isTransparent,
  paddingBottom,
}: NavigationBarHeaderProps) => {
  const router = useRouter();
  const route = useRoute();
  const canGoBack = useNavigationState((state) => {
    return (
      state?.type === 'stack' &&
      state.routes.findIndex((r) => r.key === route.key) > 0
    );
  });
  const { top: safeAreaTop } = useSafeAreaInsets();
  const subtitleColor: AppColor = isTransparent ? 'muted' : 'heroSub';
  const backIconTintColor = useThemeColor(
    isTransparent ? 'coral' : 'onPrimary',
  );
  const titleColor: AppColor = isTransparent ? 'ink' : 'onPrimary';
  const titleFont = getTitleFont(isTransparent, type);

  const titleLabel = (
    <ThemedText color={titleColor} font={titleFont}>
      {title}
    </ThemedText>
  );

  return (
    <VStack
      spacing={6}
      style={{
        paddingTop: safeAreaTop,
        paddingBottom,
      }}
    >
      <HStack align='center' spacing={6}>
        {canGoBack && (
          <Pressable
            style={(state) => [state.pressed && styles.pressed, styles.back]}
            onPress={() => {
              router.back();
            }}
          >
            <Image
              source={require('@/images/navigation/arrow-back.svg')}
              contentFit='contain'
              tintColor={backIconTintColor}
              style={styles.backIcon}
            />
          </Pressable>
        )}
        {type === 'short' && titleLabel}
      </HStack>
      <VStack spacing={6} style={{ paddingHorizontal: 15 }}>
        {type === 'full' && titleLabel}
        {subtitle && type === 'full' && (
          <ThemedText color={subtitleColor} font='navigationSubtitle'>
            {subtitle}
          </ThemedText>
        )}
      </VStack>
    </VStack>
  );
};

const styles = StyleSheet.create({
  back: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingStart: 10,
  },
  backIcon: {
    width: 22,
    height: 22,
  },
  pressed: {
    opacity: 0.5,
  },
});
