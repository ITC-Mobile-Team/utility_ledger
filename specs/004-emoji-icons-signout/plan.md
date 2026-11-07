# Implementation Plan: Єдині emoji-іконки та «Вийти» без стирання даних

**Branch**: `feature/outages-tab` | **Date**: 2026-11-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-emoji-icons-signout/spec.md`

## Summary

1. **Іконки.** Карта `appIcons` (`src/constants/app-icons.tsx`) перестає посилатися на SVG і повертає для кожного ключа emoji. Усі місця, що малюють іконку (`AppImage`, `IconView`, `RowIcon`, `EmojiTile`, три компоненти навбару, `month-picker-sheet`, `icon-picker`), рендерять її через один новий компонент `EmojiGlyph`. Він ставить гліф у квадрат фіксованого розміру, вимикає масштабування шрифту й вирівнює emoji по центру з платформними поправками. Розміри задаються не числом у кожному місці, а роллю зі шкали `iconSizes` (`src/constants/icon-sizes.ts`). Пропи кольору іконки (`tintColor`, `iconColor`, `color`) зникають, бо emoji має власні кольори; кольорові підкладки лишаються. Таб-бар (`NativeTabs` з SF Symbols), логотипи Google/Apple і стрілка «Назад» у навбарі не змінюються (див. [research.md](research.md) R3).
2. **Вихід.** «Вийти» і «Видалити акаунт» після підтвердження викликають лише `useAuth().signOut()`. `Stack.Protected` у `src/app/_layout.tsx` сам переводить користувача з `(tabs)` на `(auth)`. Модуль `src/services/account` (`wipeLocalData`, `finishPendingWipe`, маркер `pendingWipe`) видаляється разом із викликами в `AuthProvider` і `PreferencesProvider`. Також зникають `resetOnboarding` і `resetPreferences`, яких більше ніхто не викликає. Підписи про стирання й тексти підтверджень змінюються ([contracts/ui.md](contracts/ui.md)).

## Technical Context

**Language/Version**: TypeScript 5 (strict), React 19, React Native 0.88

**Primary Dependencies**: Expo SDK 58 (`expo@^58.0.14`), Expo Router (`Stack.Protected`, `NativeTabs`), `expo-image` (лишається для логотипів і стрілки «Назад»), `react-native` `Text` для emoji

**Storage**: локальне key-value сховище (`src/storage`); схема не змінюється, ключ `pendingWipe` більше не пишеться й не читається

**Testing**: немає unit-тестів; перевірка — сценарії скілу `ui-check` (`.claude/skills/ui-check/flows/*.flow`) в iOS Simulator, ручна перевірка на Android-емуляторі, `npx expo lint`, `npx tsc --noEmit`

**Target Platform**: iOS 26+ і Android (Expo, CNG)

**Project Type**: mobile-app

**Performance Goals**: 60 fps у списках з іконками (emoji-`Text` не дорожчий за `expo-image` з SVG); вихід до екрана входу — один кадр після відповіді `signOut()`

**Constraints**: центрування гліфа ±1 pt на обох платформах; розмір іконки не залежить від розміру шрифту системи; без нових залежностей і без нативних змін — доставляється OTA

**Scale/Scope**: ~45 місць рендеру іконок у 35 файлах, 35 ключів `AppIcon`, 1 екран із логікою виходу

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Принцип | Перевірка | Статус |
|---|---|---|
| I. Expo за документацією версії | Нових Expo API немає; `Text`, `expo-image` і `Stack.Protected` уже використовуються. `allowFontScaling`/`maxFontSizeMultiplier` для `Text` звірити з документацією RN 0.88. Залежності не додаються | ✅ |
| II. Expo Router і `src/` | `EmojiGlyph` → `src/components/emoji-glyph.tsx`, шкала → `src/constants/icon-sizes.ts`. У `src/app/` змінюються лише екрани, не-маршрутного коду там не додається | ✅ |
| III. CNG | `ios/` і `android/` не змінюються, нативних модулів немає → OTA-оновлення, нова development build не потрібна | ✅ |
| IV. Дизайн і патерни | Артборди: 01–04 (вхід), 05–15 (обʼєкти, аналітика), 16, 16a, 16b, 16c, 16d–16g (профіль), 20–22 (онбординг), 20–21d (світло), «Дизайн-система» — оновити в канвасі під emoji і нові тексти виходу. Патерни: оновити `account-actions.md`, `buttons.md`, `navigation-bar-buttons.md`, `preferences.md`, `swipe-actions.md`; додати `icons.md` і рядок у `README.md` | ✅ (окремі задачі в tasks.md) |
| V. Українська мова | Артефакти й тексти UI українською | ✅ |
| VI. Lint і typecheck | Остання задача tasks.md — `npx expo lint` і `npx tsc --noEmit` | ✅ |

**Після Phase 1**: дизайн не додав порушень. Скасування стирання при виході не суперечить конституції; патерн `account-actions.md` переписується в тій самій зміні.

## Project Structure

### Documentation (this feature)

```text
specs/004-emoji-icons-signout/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── icons.md         # EmojiGlyph, шкала розмірів, карта AppIcon → emoji
│   └── ui.md            # профіль: рядки й підтвердження «Вийти» / «Видалити акаунт»
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── constants/
│   ├── app-icons.tsx            # SVG require → emoji-рядки (ключі AppIcon ті самі)
│   └── icon-sizes.ts            # НОВИЙ: шкала ролей іконок
├── components/
│   ├── emoji-glyph.tsx          # НОВИЙ: центрований emoji фіксованого розміру
│   ├── app-image.tsx            # рендерить EmojiGlyph; без tintColor
│   ├── icon-view.tsx            # коло + EmojiGlyph; без iconColor
│   ├── transparent-action-button.tsx
│   ├── index.ts                 # експорт EmojiGlyph
│   └── navigation-bar/
│       ├── navigation-bar-button.tsx       # Image → EmojiGlyph
│       ├── navigation-bar-chip.tsx         # Image → EmojiGlyph
│       └── navigation-bar-icon-button.tsx  # Image → EmojiGlyph
├── views/
│   ├── objects/emoji-tile.tsx, month-picker-sheet.tsx, empty-state-view.tsx,
│   │   list-card.tsx, swipeable-row.tsx, days-sheet.tsx, city-picker-sheet.tsx
│   ├── profile/row-icon.tsx, start-tab-row(-content).tsx, theme-option-card.tsx,
│   │   outage-setup-notice.tsx, confirm-destructive.ts(x)
│   ├── outages/outage-message.tsx, power-status-card.tsx, outage-city-sheet.tsx
│   ├── onboarding/*-illustration.tsx
│   ├── object-card.tsx, info-banner.tsx, app-header.tsx
├── app/
│   ├── (auth)/index.tsx, auth-error.tsx
│   ├── (tabs)/(objects)/**     # виклики AppImage без tintColor, icon-picker
│   ├── (tabs)/(outages)/**     # те саме
│   └── (tabs)/profile/index.tsx   # іконки + вихід через useAuth().signOut()
├── providers/
│   ├── auth-provider.tsx        # без finishPendingWipe
│   ├── preferences-provider.tsx # без PENDING_WIPE_KEY і resetPreferences
│   └── onboarding-provider.tsx  # без resetOnboarding
└── services/account/            # ВИДАЛЯЄТЬСЯ (wipe-local-data.ts, index.ts)

assets/images/icons/*.svg        # видаляються, крім arrow-back.svg і socials/*
docs/patterns/icons.md           # НОВИЙ патерн
.claude/skills/ui-check/flows/   # новий sign-out.flow; profile.flow — перевірка рядка «Вийти»
```

**Structure Decision**: структура `src/` не змінюється. Додаються один компонент і одна константа, видаляється один сервісний модуль.

## Complexity Tracking

Порушень конституції немає.
