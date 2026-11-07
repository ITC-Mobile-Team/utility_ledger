import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../pressable';
import { Image } from 'expo-image';
import { useRouter, useRoute } from 'expo-router';
import { useNavigationState } from 'expo-router/build/react-navigation/index.js';
import Animated from 'react-native-reanimated';
import { type AppColor } from '@/constants/colors';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { type AppFont, ThemedText } from '../themed-text';
import { VStack } from '../stack';
import {
  BUTTONS_TOP_GAP,
  EMPTY_BOTTOM,
  HORIZONTAL_PADDING,
  SHORT_TITLE_ROW_HEIGHT,
} from './constants';
import { type NavigationBarVariant } from './types';
import { type NavigationBarProgress } from './use-navigation-bar-progress';

type NavigationBarHeaderProps = {
  type?: NavigationBarVariant;
  title: string;
  subtitle?: string;
  accessory?: ReactNode;
  content?: ReactNode;
  trailing?: ReactNode;
  // Ряд великих кнопок; входить у великий блок і згортається з ним
  buttons?: ReactNode;
  isTransparent: boolean;
  // Колір підзаголовка на кольоровому навбарі
  heroSubtitleColor?: AppColor;
  safeAreaTop: number;
  // Великий блок згорнутий: не натискається й схований від доступності
  isCollapsed: boolean;
  progress: NavigationBarProgress;
};

const BACK_TAP_SIZE = 44;
const BACK_ICON_SIZE = 22;

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
  accessory,
  content,
  trailing,
  buttons,
  isTransparent,
  heroSubtitleColor = 'heroSub',
  safeAreaTop,
  isCollapsed,
  progress,
}: NavigationBarHeaderProps) => {
  const router = useRouter();
  const route = useRoute();
  const canGoBack = useNavigationState((state) => {
    return (
      state?.type === 'stack' &&
      state.routes.findIndex((r) => r.key === route.key) > 0
    );
  });
  const subtitleColor: AppColor = isTransparent ? 'muted' : heroSubtitleColor;
  const backIconTintColor = useThemeColor(
    isTransparent ? 'coral' : 'onPrimary',
  );
  const titleColor: AppColor = isTransparent ? 'ink' : 'onPrimary';
  const isFull = type === 'full';
  const hasButtons = Boolean(buttons);
  // Великий блок: заголовок (full) і ряд кнопок. У short — лише кнопки
  const hasLargeBlock = isFull || hasButtons;
  // Без кнопки «назад» великий заголовок починається одразу під safe area, а
  // рядок короткого заголовка з'являється поверх нього під час згортання
  const topRowSpace = isFull && !canGoBack ? 0 : SHORT_TITLE_ROW_HEIGHT;

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
    <View
      style={{
        paddingTop: safeAreaTop + topRowSpace,
        paddingBottom: hasButtons ? 0 : EMPTY_BOTTOM,
      }}
    >
      {hasLargeBlock && (
        <Animated.View
          style={progress.largeContentStyle}
          pointerEvents={isCollapsed ? 'none' : 'auto'}
          // Згорнутий блок не має потрапляти до VoiceOver/TalkBack і в дерево
          // UI-перевірок: кожна дія навбару — рівно один раз
          accessibilityElementsHidden={isCollapsed}
          importantForAccessibility={
            isCollapsed ? 'no-hide-descendants' : 'auto'
          }
        >
          {isFull && (
            <VStack spacing={6} style={styles.largeContent}>
              <View style={styles.titleRow}>
                <ThemedText
                  color={titleColor}
                  font={getTitleFont(isTransparent, 'full')}
                  style={styles.titleText}
                >
                  {title}
                </ThemedText>
                {trailing}
              </View>
              {subtitle && (
                <ThemedText color={subtitleColor} font='navigationSubtitle'>
                  {subtitle}
                </ThemedText>
              )}
              {content && <View style={styles.content}>{content}</View>}
            </VStack>
          )}
          {hasButtons && <View style={styles.buttons}>{buttons}</View>}
        </Animated.View>
      )}
      <Animated.View
        // Без кнопки «назад» рядок лежить поверх великого заголовка: дотики
        // проходять крізь нього до кнопки праворуч від заголовка
        pointerEvents='box-none'
        style={[styles.row, { top: safeAreaTop }, progress.pinnedRowStyle]}
      >
        {canGoBack && (
          <Pressable
            accessibilityRole='button'
            accessibilityLabel='Назад'
            testID='navigationBar.back'
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
            style={[styles.shortTitleWrap, progress.shortTitleStyle]}
          >
            {shortTitleLabel}
          </Animated.View>
        ) : (
          shortTitleLabel
        )}
        {accessory && <View style={styles.accessory}>{accessory}</View>}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: SHORT_TITLE_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
  },
  accessory: {
    flex: 1,
    alignItems: 'flex-end',
    paddingStart: 12,
    paddingEnd: HORIZONTAL_PADDING,
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
  content: {
    paddingTop: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleText: {
    flex: 1,
  },
  largeContent: {
    paddingTop: 6,
    // Same inset as the navbar buttons and screen content
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  buttons: {
    paddingTop: BUTTONS_TOP_GAP,
  },
  // 44x44 tap area; the centred 22px icon starts at HORIZONTAL_PADDING like the title
  back: {
    width: BACK_TAP_SIZE,
    height: BACK_TAP_SIZE,
    marginStart: HORIZONTAL_PADDING - (BACK_TAP_SIZE - BACK_ICON_SIZE) / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: BACK_ICON_SIZE,
    height: BACK_ICON_SIZE,
  },
  pressed: {
    opacity: 0.5,
  },
});
