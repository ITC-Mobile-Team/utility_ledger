import {
  ActionButton,
  HStack,
  NavigationBarBackground,
  type NavigationBarType,
  ScreenView,
  Spacer,
  ThemedText,
  TransparentActionButton,
  VStack,
} from '@/components';
import { useOnboarding } from '@/providers/onboarding-provider';
import {
  AddressesIllustration,
  AnalyticsIllustration,
  PageIndicator,
  ReadingsIllustration,
} from '@/views/onboarding';
import { type ReactElement, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { Carousel, type CarouselRef } from 'react-native-reanimated-carousel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type OnboardingPage = {
  title: string;
  subtitle: string;
  background: Exclude<NavigationBarType, 'transparent'>;
  illustration: ReactElement;
};

const pages: OnboardingPage[] = [
  {
    title: 'Усі адреси в одному місці',
    subtitle:
      'Квартира, будинок батьків чи офіс — додайте кожну адресу та її послуги: світло, воду, газ чи інтернет.',
    background: 'blue',
    illustration: <AddressesIllustration />,
  },
  {
    title: 'Показники — за хвилину',
    subtitle:
      'Внесіть показник лічильника, а застосунок сам порахує споживання та суму за вашим тарифом.',
    background: 'blue',
    illustration: <ReadingsIllustration />,
  },
  {
    title: 'Бачте, куди йдуть гроші',
    subtitle:
      'Аналітика за будь-який період: які послуги коштують найбільше і як змінюються витрати з місяця в місяць.',
    background: 'green',
    illustration: <AnalyticsIllustration />,
  },
];

// Пропорції шапки з макета: 500 з 874
const headerRatio = 500 / 874;

const PageView = ({
  page,
  headerHeight,
}: {
  page: OnboardingPage;
  headerHeight: number;
}) => {
  return (
    <VStack filled>
      <View style={[styles.header, { height: headerHeight }]}>
        <NavigationBarBackground
          type={page.background}
          style={StyleSheet.absoluteFill}
        />
        {page.illustration}
      </View>

      <VStack spacing={12} style={styles.text}>
        <ThemedText font='onboardingTitle'>{page.title}</ThemedText>
        <ThemedText color='muted'>{page.subtitle}</ThemedText>
      </VStack>
    </VStack>
  );
};

export default function Onboarding() {
  const { height: screenHeight } = useWindowDimensions();
  const { top: safeAreaTopInset } = useSafeAreaInsets();
  const { completeOnboarding } = useOnboarding();
  const headerHeight = screenHeight * headerRatio;
  const ref = useRef<CarouselRef>(null);
  const progress = useSharedValue(0);
  const [index, setIndex] = useState(0);
  const isLast = index === pages.length - 1;

  const onNext = () => {
    if (isLast) {
      completeOnboarding();
    } else {
      ref.current?.next();
    }
  };

  return (
    <ScreenView
      edges={['bottom']}
      backgroundColor='surface'
      contentInsets={{ bottom: 8 }}
    >
      <VStack filled>
        <Carousel
          ref={ref}
          data={pages}
          loop={false}
          progress={progress}
          onSnapToItem={setIndex}
          style={styles.carousel}
          renderItem={({ item }) => (
            <PageView page={item} headerHeight={headerHeight} />
          )}
        />

        <View style={styles.footer}>
          <ActionButton title={isLast ? 'Почати' : 'Далі'} onPress={onNext} />
        </View>

        <HStack
          align='center'
          pointerEvents='box-none'
          style={[styles.topBar, { top: safeAreaTopInset }]}
        >
          <ThemedText color='onPrimary' font='segment' style={styles.counter}>
            {index + 1} з {pages.length}
          </ThemedText>
          <Spacer />
          <TransparentActionButton
            title='Пропустити'
            onPress={completeOnboarding}
          />
        </HStack>

        <View
          pointerEvents='none'
          style={[styles.indicator, { top: headerHeight + 28 }]}
        >
          <PageIndicator count={pages.length} progress={progress} />
        </View>
      </VStack>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  carousel: {
    flex: 1,
  },
  header: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  text: {
    // 28 відступ + 24 індикатор + 12 проміжок до заголовка
    paddingTop: 64,
    paddingHorizontal: 24,
  },
  footer: {
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  topBar: {
    position: 'absolute',
    left: 20,
    right: 20,
  },
  counter: {
    opacity: 0.85,
  },
  indicator: {
    position: 'absolute',
    left: 24,
  },
});
