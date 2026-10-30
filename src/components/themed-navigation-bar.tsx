import {
  ColorValue,
  StyleSheet,
  useColorScheme,
  ColorSchemeName,
  Pressable,
  ScrollView,
} from 'react-native';
import { AppFont, ThemedText } from './themed-text';
import { HStack, VStack } from './stack';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients, gradientLocations, AppColor } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { useRouter, useRoute } from 'expo-router';
import { useNavigationState } from 'expo-router/build/react-navigation/index.js';
import NavigationBarButton from './navigation-bar-button';

type NavigationBarType = 'blue' | 'green' | 'purple' | 'transparent';

const getColors = ({
  type,
  scheme,
}: {
  type: NavigationBarType;
  scheme: ColorSchemeName;
}): readonly [ColorValue, ColorValue, ...ColorValue[]] => {
  if (type === 'transparent') {
    return ['transparent', 'transparent'];
  } else {
    switch (type) {
      case 'blue':
        return gradients[scheme].heroBlue;
      case 'green':
        return gradients[scheme].heroGreen;
      case 'purple':
        return gradients[scheme].heroPurple;
    }
  }
};

type ThemedNavigationBarProps = {
  type?: NavigationBarType;
  title: string;
  subtitle?: string;
};

export function ThemedNavigationBar({
  type = 'transparent',
  title,
  subtitle,
}: ThemedNavigationBarProps) {
  const router = useRouter();
  const route = useRoute();
  const canGoBack = useNavigationState((state) => {
    return (
      state?.type === 'stack' &&
      state.routes.findIndex((r) => r.key === route.key) > 0
    );
  });
  const scheme = useColorScheme() ?? 'light';
  const gradientColors = getColors({ type, scheme });
  const isTransparent = type === 'transparent';
  const titleColor: AppColor = isTransparent ? 'ink' : 'onPrimary';
  const titleFont: AppFont = isTransparent ? 'display' : 'title';
  const subtitleColor: AppColor = isTransparent ? 'muted' : 'heroSub';
  const { top: safeAreaTop } = useSafeAreaInsets();
  const backIconTintColor = useThemeColor(
    isTransparent ? 'coral' : 'onPrimary',
  );
  const content = (
    <VStack
      spacing={6}
      style={[
        styles.stack,
        { paddingTop: safeAreaTop, paddingBottom: 48 /* 24 */ },
      ]}
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

  if (isTransparent) {
    return <VStack>{content}</VStack>;
  } else {
    return (
      <VStack>
        <LinearGradient
          colors={gradientColors}
          locations={gradientLocations}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          {content}
        </LinearGradient>

        <ScrollView
          horizontal
          style={{ marginTop: -36 }}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          showsHorizontalScrollIndicator={false}
        >
          <HStack spacing={12} style={{ flex: 1 }}>
            <NavigationBarButton
              title='Button 1'
              icon='plus'
              iconBackground='coral'
            />
            <NavigationBarButton
              title='Button 2'
              icon='plus'
              iconBackground='inkTile'
            />
            <NavigationBarButton
              title='Button 3'
              icon='plus'
              iconBackground='coral'
            />
            <NavigationBarButton
              title='Button 4'
              icon='plus'
              iconBackground='coral'
            />
          </HStack>
        </ScrollView>
      </VStack>
    );
  }
}

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
  stack: {
    paddingHorizontal: 20,
  },
  pressed: {
    opacity: 0.5,
  },
});
