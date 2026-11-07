import {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { BUTTONS_GRADIENT_OVERLAP } from './constants';

// Один прогрес згортання на весь навбар. Навбар — накладка над скролом, тож
// згортається лише трансформаціями: накладка їде вгору на D, рядок «назад»
// лишається на місці, великий блок (заголовок і кнопки) прозорішає. Висота
// нічого не анімує, тому під час скролу розкладка не перераховується
export const useNavigationBarProgress = ({
  scrollY,
  collapsedHeight,
  collapseDistance,
}: {
  // Нормалізований зсув контенту (0 — верх), вже з урахуванням клавіатури
  scrollY: SharedValue<number>;
  // Висота згорнутого навбару: safe area + рядок «назад» + хвіст градієнта
  collapsedHeight: number;
  // Вихід для NavigationView: скрол, за який навбар згортається повністю
  collapseDistance: SharedValue<number>;
}) => {
  // Висоту розгорнутої накладки міряємо максимумом: під час згортання вона
  // не змінюється, а повторні заміри посеред анімації ламали б її
  const expandedHeight = useSharedValue(0);
  // Висота ряду великих кнопок (0, якщо кнопок немає)
  const buttonsHeight = useSharedValue(0);

  const distance = useDerivedValue(() =>
    Math.max(expandedHeight.value - collapsedHeight, 0),
  );

  useAnimatedReaction(
    () => distance.value,
    (value) => collapseDistance.set(value),
  );

  const progress = useDerivedValue(() => {
    const d = distance.value;
    return d > 0
      ? interpolate(scrollY.value, [0, d], [0, 1], Extrapolation.CLAMP)
      : 0;
  });

  const overlayStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -progress.value * distance.value }],
  }));

  // Рядок «назад» і короткий заголовок не їдуть разом із накладкою
  const pinnedRowStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: progress.value * distance.value }],
  }));

  const largeContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.7], [1, 0], Extrapolation.CLAMP),
  }));

  const shortTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.6, 1], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [0.6, 1],
          [8, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  // З кнопками градієнт розгорнутого навбару закінчується посеред них, а у
  // згорнутому — внизу накладки: він з'їжджає вниз відносно неї
  const gradientStyle = useAnimatedStyle(() => {
    const tail =
      buttonsHeight.value > 0
        ? Math.max(buttonsHeight.value - BUTTONS_GRADIENT_OVERLAP, 0)
        : 0;
    return {
      bottom: tail,
      transform: [{ translateY: progress.value * tail }],
    };
  });

  // Кути шторки: без заокруглень у розгорнутому стані, повний радіус у
  // згорнутому; навбар без згортання — завжди з повним радіусом
  const sheetCornerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: distance.value > 0 ? progress.value : 1 }],
  }));

  return {
    progress,
    overlayStyle,
    pinnedRowStyle,
    largeContentStyle,
    shortTitleStyle,
    gradientStyle,
    sheetCornerStyle,
    // Повертає висоту накладки, з якою рахується відступ контенту
    onExpandedHeightChange: (height: number) => {
      const next = Math.max(expandedHeight.get(), height);
      expandedHeight.set(next);
      return next;
    },
    onButtonsHeightChange: (height: number) => buttonsHeight.set(height),
  };
};

export type NavigationBarProgress = ReturnType<typeof useNavigationBarProgress>;
