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

// const itemsLength = 3;

const Indicator = ({ isActive }: { isActive: boolean }) => {
  const style = isActive ? styles.activeIndicator : styles.indicator;
  return (
    <ThemedView backgroundColor={isActive ? 'coral' : 'track'} style={style} />
  );
};

export default function Onboarding() {
  // const [value, setValue] = useState('12660');
  const { height: screenHeight } = useWindowDimensions();
  const { top: safeAreaTopInset } = useSafeAreaInsets();
  const backgroundHeight = screenHeight * (500 / 874);
  console.log(backgroundHeight);
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
          <VStack filled spacing={12} style={{ marginHorizontal: 51 }}>
            <Spacer />
            <TransparentActionButton
              icon='house'
              title='вул. Шевченка, 8'
              subtitle='Будинок батьків'
            />
            <ObjectCard />
            <Spacer />
          </VStack>
        </View>

        <VStack filled spacing={20} style={styles.content}>
          <HStack spacing={6}>
            <Indicator isActive={true} />
            <Indicator isActive={false} />
            <Indicator isActive={false} />
          </HStack>

          <VStack spacing={12}>
            <ThemedText font='onboardingTitle'>
              Усі адреси в одному місці
            </ThemedText>
            <ThemedText color='muted'>
              Квартира, будинок батьків чи офіс — додайте кожну адресу та її
              послуги: світло, воду, газ та інші послуги.
            </ThemedText>
          </VStack>
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
