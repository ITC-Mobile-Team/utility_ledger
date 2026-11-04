import { Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useRoute } from 'expo-router';
import { useNavigationState } from 'expo-router/build/react-navigation/index.js';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { type SharedValue } from 'react-native-reanimated';
import { type AppColor } from '@/constants/colors';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { type AppFont, ThemedText } from '../themed-text';
import { VStack } from '../stack';
import { HORIZONTAL_PADDING } from './constants';
import { type NavigationBarVariant } from './types';
import { useTitleCollapse } from './use-title-collapse';

type NavigationBarHeaderProps = {
  type?: NavigationBarVariant;
  title: string;
  subtitle?: string;
  isTransparent: boolean;
  paddingBottom: number;
  scrollY: SharedValue<number>;
  maxScrollY: SharedValue<number>;
  titleShrink: SharedValue<number>;
  collapseScroll: SharedValue<number>;
  titleCollapseDistance: SharedValue<number>;
};

const getTitleFont = (
  isTransparent: boolean,
  type: NavigationBarVariant,
): AppFont => {
  if (type === 'short') return 'headline';
  return isTransparent ? 'display' : 'title';
};

export const NavigationBarHeader = ({
  type = 'full',
  title,
  subtitle,
  isTransparent,
  paddingBottom,
  scrollY,
  maxScrollY,
  titleShrink,
  collapseScroll,
  titleCollapseDistance,
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
  const collapse = useTitleCollapse({
    scrollY,
    maxScrollY,
    shrink: titleShrink,
    collapseScroll,
    collapseDistance: titleCollapseDistance,
    hasBackButton: canGoBack,
  });
  const isFull = type === 'full';

  const shortTitleLabel = (
    <ThemedText
      color={titleColor}
      font={getTitleFont(isTransparent, 'short')}
      numberOfLines={1}
      style={[
        styles.shortTitle,
        canGoBack ? styles.afterBack : isFull && styles.inset,
      ]}
    >
      {title}
    </ThemedText>
  );

  return (
    <VStack
      style={{
        paddingTop: safeAreaTop,
        paddingBottom,
      }}
    >
      <Animated.View style={[styles.row, isFull && collapse.rowStyle]}>
        {canGoBack && (
          <Pressable
            style={(state) => [state.pressed && styles.pressed, styles.back]}
            onPress={() => {
              router.back();
            }}
          >
            <Image
              source={require('@/assets/images/icons/arrow-back.svg')}
              contentFit='contain'
              tintColor={backIconTintColor}
              style={styles.backIcon}
            />
          </Pressable>
        )}
        {isFull ? (
          <Animated.View
            style={[styles.shortTitleWrap, collapse.shortTitleStyle]}
          >
            {shortTitleLabel}
          </Animated.View>
        ) : (
          shortTitleLabel
        )}
      </Animated.View>
      {isFull && (
        <Animated.View style={[styles.largeArea, collapse.largeAreaStyle]}>
          <Animated.View
            style={collapse.largeContentStyle}
            onLayout={(e) =>
              collapse.onLargeHeightChange(e.nativeEvent.layout.height)
            }
          >
            <VStack spacing={6} style={styles.largeContent}>
              <ThemedText
                color={titleColor}
                font={getTitleFont(isTransparent, 'full')}
              >
                {title}
              </ThemedText>
              {subtitle && (
                <ThemedText color={subtitleColor} font='navigationSubtitle'>
                  {subtitle}
                </ThemedText>
              )}
            </VStack>
          </Animated.View>
        </Animated.View>
      )}
    </VStack>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  shortTitleWrap: {
    flexShrink: 1,
  },
  shortTitle: {
    flexShrink: 1,
  },
  afterBack: {
    marginStart: 6,
  },
  inset: {
    marginStart: 15,
  },
  largeArea: {
    overflow: 'hidden',
  },
  largeContent: {
    paddingTop: 6,
    // Same inset as the navbar buttons and screen content
    paddingHorizontal: HORIZONTAL_PADDING,
  },
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
