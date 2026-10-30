import { Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useRoute } from 'expo-router';
import { useNavigationState } from 'expo-router/build/react-navigation/index.js';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColor } from '@/constants/colors';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { AppFont, ThemedText } from '../themed-text';
import { VStack } from '../stack';
import { HORIZONTAL_PADDING } from './constants';

type NavigationBarHeaderProps = {
  title: string;
  subtitle?: string;
  isTransparent: boolean;
  paddingBottom: number;
};

export const NavigationBarHeader = ({
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
  const titleColor: AppColor = isTransparent ? 'ink' : 'onPrimary';
  const titleFont: AppFont = isTransparent ? 'display' : 'title';
  const subtitleColor: AppColor = isTransparent ? 'muted' : 'heroSub';
  const backIconTintColor = useThemeColor(
    isTransparent ? 'coral' : 'onPrimary',
  );

  return (
    <VStack
      spacing={6}
      style={{
        paddingTop: safeAreaTop,
        paddingHorizontal: HORIZONTAL_PADDING,
        paddingBottom,
      }}
    >
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
      <ThemedText color={titleColor} font={titleFont}>
        {title}
      </ThemedText>
      {subtitle && (
        <ThemedText color={subtitleColor} font='navigationSubtitle'>
          {subtitle}
        </ThemedText>
      )}
    </VStack>
  );
};

const styles = StyleSheet.create({
  back: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  backIcon: {
    width: 22,
    height: 22,
  },
  pressed: {
    opacity: 0.5,
  },
});
