import {
  ActionButton,
  HStack,
  NavigationBarBackground,
  ScreenView,
  Spacer,
  ThemedText,
  ThemedView,
  TransparentActionButton,
  VStack,
} from '@/components';
import { ObjectCard } from '@/views';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Carousel,
  Pagination,
  type CarouselRef,
} from 'react-native-reanimated-carousel';
import { useSharedValue } from 'react-native-reanimated';
import { useRef } from 'react';

// const itemsLength = 3;

type TextBlockItem = {
  title: string;
  subtitle: string;
};

const TextBlock = ({ item }: { item: TextBlockItem }) => {
  return (
    <VStack spacing={12}>
      <ThemedText font='onboardingTitle'>{item.title}</ThemedText>
      <ThemedText color='muted'>{item.subtitle}</ThemedText>
    </VStack>
  );
};

const Indicator = ({ isActive }: { isActive: boolean }) => {
  const style = isActive ? styles.activeIndicator : styles.indicator;
  return (
    <ThemedView backgroundColor={isActive ? 'coral' : 'track'} style={style} />
  );
};

export default function Onboarding() {
  // const [value, setValue] = useState('12660');
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { top: safeAreaTopInset } = useSafeAreaInsets();
  const backgroundHeight = screenHeight * (500 / 874);
  const ref = useRef<CarouselRef>(null);
  const progress = useSharedValue(0);

  const array = [0, 1, 2];
  const textItems: TextBlockItem[] = [
    { title: '0', subtitle: '1' },
    { title: '2', subtitle: '3' },
    { title: '4', subtitle: '5' },
  ];
  return (
    <ScreenView
      edges={['bottom']}
      backgroundColor='surface'
      contentInsets={{ bottom: 8 }}
    >
      <VStack filled>
        <View style={[{ height: backgroundHeight }, styles.navigation]}>
          <NavigationBarBackground
            type='blue'
            style={[StyleSheet.absoluteFill]}
          />
          <HStack
            align='center'
            style={[
              { marginTop: safeAreaTopInset },
              styles.navigationIndicator,
            ]}
          >
            <ThemedText color='onPrimary' font='segment'>
              1 з 3
            </ThemedText>
            <Spacer />
            <TransparentActionButton title='Пропустити' />
          </HStack>
          <VStack
            filled
            spacing={12}
            // style={{ marginHorizontal: 51 }}
          >
            <Spacer />
            <TransparentActionButton
              icon='house'
              title='вул. Шевченка, 8'
              subtitle='Будинок батьків'
              disabled
            />

            <Carousel
              ref={ref}
              data={array}
              progress={progress}
              // style={{ height: 200 }}
              renderItem={() => <ObjectCard />}
            />

            {/* <ObjectCard /> */}
            <Spacer />
          </VStack>
        </View>

        <VStack filled spacing={20} style={styles.content}>
          <HStack spacing={6}>
            <Indicator isActive={true} />
            <Indicator isActive={false} />
            <Indicator isActive={false} />
          </HStack>

          <Carousel
            ref={ref}
            data={textItems}
            progress={progress}
            renderItem={({ item }) => <TextBlock item={item} />}
          />
        </VStack>

        <VStack style={{ marginHorizontal: 20 }}>
          <Spacer />
          <ActionButton title='Далі' />
        </VStack>
      </VStack>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  navigation: {
    overflow: 'hidden',
    borderBottomRightRadius: 36,
    borderBottomLeftRadius: 36,
  },
  navigationIndicator: {
    marginHorizontal: 20,
  },
  content: {
    paddingTop: 36,
    paddingHorizontal: 24,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeIndicator: {
    width: 28,
    height: 8,
    borderRadius: 4,
  },
});
