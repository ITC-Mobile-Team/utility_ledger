import { StyleSheet, ScrollView } from 'react-native';
import {
  ThemedText,
  AppFont,
  ThemedView,
  ActionButton,
  Segment,
  ThemedTextInput,
  ThemedBadge,
  RadioGroup,
  ThemedNavigationBar,
  VStack,
} from '@/components';
import { typography } from '@/constants/typography';
import { useThemeColor } from '@/hooks/use-theme-colors';
import { useState } from 'react';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import { BillingMode, billingModes } from '@/constants/billing-mode';

const fonts = Object.keys(typography) as AppFont[];
const weights = ['400', '500', '600', '700'] as const;
const previewText = 'Їжак Йод 12 803,00 ₴';

export default function Preview() {
  const bgColor = useThemeColor('bg');
  const [disabled, setDisabled] = useState(true);
  const [displayText, setDisplayText] = useState<string | null>(null);

  const periodLabels = {
    services: 'Послуги',
    months: 'Місяці',
  } as const;
  type SegmentPeriod = keyof typeof periodLabels;
  const periods = (Object.keys(periodLabels) as SegmentPeriod[]).map(
    (value) => ({
      value,
      label: periodLabels[value],
    }),
  );
  const [period, setPeriod] = useState<SegmentPeriod>('months');
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState<BillingMode>('meter');
  return (
    <VStack style={{ flex: 1 }}>
      <ThemedNavigationBar type='blue' title='Preview' />

      <ScrollView
        contentInsetAdjustmentBehavior='automatic'
        style={{ backgroundColor: bgColor }}
        contentContainerStyle={[styles.content]}
      >
        <ThemedView
          style={{
            flexDirection: 'row',
            paddingTop: 16,
            gap: 16,
            alignSelf: 'center',
          }}
        >
          <ThemedBadge text='Новий' type='red' />
          <ThemedBadge text='Заповнено' type='green' />
          <ThemedBadge text='UAH' type='blue' />
        </ThemedView>

        <Segment items={periods} value={period} onChange={setPeriod} />

        <RadioGroup items={billingModes} value={mode} onChange={setMode} />

        <ThemedText>Вибрано: {periodLabels[period]}</ThemedText>

        <ThemedTextInput title='Поле' onChangeText={setInputText} />

        <ThemedText>Заповнено в полі: {inputText}</ThemedText>

        <ActionButton
          title='Продовжити з Apple'
          type='apple'
          onPress={() => {
            setDisplayText('Натиснуто на Apple кнопку');
          }}
        />

        <ActionButton
          title='Продовжити з Google'
          type='google'
          onPress={() => {
            setDisplayText('Натиснуто на Google кнопку');
          }}
        />

        <ActionButton
          title='Основна дія'
          onPress={() => {
            setDisabled((prev) => !prev);
            setDisplayText('Стан кнопки змінено');
          }}
        />

        <ActionButton
          title='Вторинна дія'
          type='secondary'
          onPress={() => {
            setDisplayText('Дія вторинної кнопки');
          }}
        />

        <ActionButton
          title='Кнопка з контуром'
          type='outline'
          onPress={() => {
            setDisplayText('Дія кнопки з контуром');
          }}
        />

        <ActionButton
          title={disabled ? 'Неактивна' : 'Активна'}
          disabled={disabled}
          onPress={() => {
            setDisplayText(null);
          }}
        />

        {displayText && (
          <Animated.View
            key={displayText}
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
          >
            <ThemedText>{displayText}</ThemedText>
          </Animated.View>
        )}

        <Animated.View
          style={styles.content}
          layout={LinearTransition.duration(300)}
        >
          {fonts.map((font) => {
            const { fontSize, fontWeight, lineHeight } = typography[font];
            return (
              <ThemedView key={font} style={styles.item}>
                <ThemedText color='coral' font='headline'>
                  {`${font} ${fontSize}/${fontWeight} lh: ${lineHeight}`}
                </ThemedText>
                <ThemedText color='ink' font={font}>
                  {previewText}
                </ThemedText>
              </ThemedView>
            );
          })}

          <ThemedText color='ink' font='section'>
            Ваги
          </ThemedText>
          {weights.map((weight) => {
            return (
              <ThemedText
                key={weight}
                color='ink'
                font='body'
                style={{ fontWeight: weight }}
              >{`${weight} ${previewText}`}</ThemedText>
            );
          })}
        </Animated.View>
      </ScrollView>
    </VStack>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    gap: 20,
    paddingBottom: 16,
  },
  item: {
    gap: 4,
  },
});
