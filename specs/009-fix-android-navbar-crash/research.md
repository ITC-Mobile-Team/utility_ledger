# Research: краш на Android через ScrollViewMarker

## Причина краху

Відтворено на `emulator-5554` з development build і Metro:

```text
java.lang.IllegalStateException: [RNScreens] Failed to find supported type of ScrollView in children of ScrollViewMarker
  at com.swmansion.rnscreens.gamma.scrollviewmarker.ScrollViewMarker.findScrollView(ScrollViewMarker.kt:44)
  at ...ScrollViewMarker.onAttachedToWindow(ScrollViewMarker.kt:21)
```

`ScrollViewMarker.kt` (react-native-screens 4.30.0) при приєднанні до вікна шукає серед прямих дочірніх
`android.widget.ScrollView` або `NestedScrollView` і робить `checkNotNull`. Коментар у коді прямо каже, що
горизонтальні скроли ігноруються. RN `ScrollView horizontal` на Android — `ReactHorizontalScrollView`
(`HorizontalScrollView`), тож пошук завжди невдалий. Обгортку в
`src/components/navigation-bar/navigation-bar-buttons-row.tsx` додано в `bc7c55c` для iOS 26+.

## Рішення 1: як прибрати краш

- **Decision**: рендерити `ScrollViewMarker` лише на iOS (`Platform.OS === 'ios'`), на Android — голий горизонтальний `ScrollView`.
- **Rationale**: проп `scrollEdgeEffects` у `ScrollViewMarker.types.ts` позначено `@platform ios`, `@supported iOS 26 or higher`; на Android обгортка не дає жодного ефекту, лише ризик краху. Найменша зміна, тільки JS, iOS-поведінка не змінюється.
- **Alternatives considered**:
  - Окремі файли `navigation-bar-buttons-row.ios.tsx` / `.android.tsx` — дублювання всього компонента заради однієї обгортки.
  - Обгорнути горизонтальний скрол у вертикальний `ScrollView`, щоб маркер знайшов його, — зайвий шар, змінює жести й розкладку, на Android все одно без користі.
  - Прибрати маркер повністю — повертає світлу смугу на iOS 26+ (FR-004).
  - Патч `react-native-screens` (не кидати виняток) — нативна зміна, потрібна нова build і підтримка патча; експериментальний API може змінитися.

## Рішення 2: чи потрібна нова development build

- **Decision**: ні.
- **Rationale**: змінюється лише JS; нативний модуль уже в збірці. Перевірка — reload у наявній development build на емуляторі.

## Рішення 3: як перевіряти

- **Decision**: Android — холодні запуски й обхід екранів з рядом кнопок на емуляторі, плюс реліз-збірка; iOS — сценарій смуги з `bc7c55c` і `navbar.flow`.
- **Rationale**: `ui-check` працює лише з iOS, тож Android перевіряється через `adb` (запуск, `logcat -b crash`). Реальний пристрій користувача — фінальна ручна перевірка (припущення в spec).
