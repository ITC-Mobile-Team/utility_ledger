# Implementation Plan: Таб «Профіль»

**Branch**: `feature/outages-tab` (тека фічі `specs/002-profile-tab`) | **Date**: 2026-11-06 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-profile-tab/spec.md`

## Summary

Таб «Ще» стає «Профілем»: спершу оновлюється канвас дизайну (назва розділу, артборди 16/16a/16b, новий 16c «Вихід з акаунта», підпис та іконка табу, тексти документів), потім заглушка `more.tsx` замінюється стеком `src/app/(tabs)/profile/` з чотирма екранами: профіль, «Ваше імʼя», «Політика конфіденційності», «Умови використання». Профіль (імʼя, email, спосіб входу) зберігається на пристрої в наявному сховищі ключ-значення через новий `ProfileRepository`, який пізніше заміниться Firestore без змін в екранах. «Вийти» і «Видалити акаунт» стирають усі локальні дані через `wipeLocalData()` з маркером для перерваного стирання. Перемикач сповіщень працює з тими самими налаштуваннями, що й «Світло». Деталі рішень — [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5 (strict), React 19.3, React Native 0.88, Expo SDK 58 (`expo@^58.0.14`)

**Primary Dependencies**: Expo Router 58 (`NativeTabs`, `Stack`), `expo-constants` (версія), `expo-notifications` (скасування попереджень), `@react-native-async-storage/async-storage` за `KeyValueStorage`, `react-native-keyboard-controller` (поле імені). Нових залежностей немає.

**Storage**: `KeyValueStorage` (`src/storage`) — ключі `authUser` (+ поле `method`), новий `userProfile`, новий `pendingWipe`; стираються також `ledgerState`, `outageSettings`, `outageSchedule:<providerId>`, `hasSeenOnboarding`.

**Testing**: автотестів у проєкті немає; перевірка — сценарій ui-check у iOS Simulator (`.claude/skills/ui-check/flows/profile.flow` + оновлений `smoke.flow`), звірка скриншотів з артбордами, `npx expo lint`, `npx tsc --noEmit`.

**Target Platform**: iOS 26+ та Android (Expo dev build); макети — iOS.

**Project Type**: mobile-app (Expo, Continuous Native Generation).

**Performance Goals**: екран профілю відкривається без видимого завантаження (дані вже в памʼяті після старту); збереження імені й стирання — до 1 с на пристрої.

**Constraints**: офлайн, без мережі; без нових нативних модулів (доставка OTA); українські тексти з макета; повторні тапи заблоковані глобальним замком `Pressable`.

**Scale/Scope**: 4 нові екрани, 1 сервіс профілю, 1 сервіс стирання, правки в 3 провайдерах і 3 сервісах; 1 користувач на пристрої.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Принцип | Як дотримано | Статус |
|---|---|---|
| I. Expo за документацією версії | Версія з `Constants.expoConfig` звірена з `docs.expo.dev/versions/v58.0.0/sdk/constants.md`; нових пакетів немає; `ActionSheetIOS`/`Alert`/`Switch` — з React Native | ✅ |
| II. Expo Router і `src/` | Маршрути лише в `src/app/(tabs)/profile/`; сервіси в `src/services/profile`, `src/services/account`, провайдер у `src/providers`, компоненти в `src/views/profile` | ✅ |
| III. CNG | `ios/`/`android/` не чіпаємо; нативних модулів не додаємо → **development build не потрібна, доставка OTA** | ✅ |
| IV. Дизайн і патерни | Артборди 16, 16a, 16b, 16c (новий), 17, 18, 19 оновлюються в канвасі першою задачею й служать еталоном; застосовні патерни — `tab-bar.md`, `navigation-bar-title.md`, `navigation-bar-buttons.md`, `keyboard.md`, `buttons.md`, `swipe-actions.md` (системне підтвердження), `test-ids.md`; новий патерн `account-actions.md` і зміни в `tab-bar.md`, `test-ids.md`, `README.md` — окремою задачею | ✅ |
| V. Українська | Усі тексти UI з макета; артефакти українською | ✅ |
| VI. Lint і typecheck | Остання задача `tasks.md` — `npx expo lint` і `npx tsc --noEmit` | ✅ |

Порушень немає — Complexity Tracking не заповнюється.

**Повторна перевірка після Phase 1**: дизайн у [data-model.md](data-model.md) і [contracts/](contracts/) не додає залежностей і не виходить за `src/` — ✅.

## Дизайн: артборди

Канвас: https://claude.ai/artifact/Px8EEBtJf8LRD97UwbGUjj (читання й правки — `docs/design.md`).

| Артборд | Файл | Зміна в канвасі | Екран |
|---|---|---|---|
| 16 · Профіль | `More.dc.html` | заголовок «Профіль», підзаголовок «Імʼя, документи та акаунт», рядок «Вийти» в окремій картці над «Видалити акаунт», таб «Профіль» з іконкою людини, `screenHeight` збільшується під новий рядок | `profile/index.tsx` |
| 16a · Профіль — вхід через Google | `MoreGoogle.dc.html` | лише назва | `profile/index.tsx` (method = google) |
| 16b · Видалення акаунта | `MoreDelete.dc.html` | лише назва | діалог на `profile/index.tsx` |
| 16c · Вихід з акаунта | новий `MoreSignOut.dc.html` (`initialDialog="signout"`) | новий діалог «Вийти з акаунта?» | діалог на `profile/index.tsx` |
| 17 · Змінити імʼя | `EditName.dc.html` | посилання «Назад» лишається | `profile/edit-name.tsx` |
| 18 · Політика конфіденційності | `Privacy.dc.html` | «у розділі «Ще»» → «Профіль» | `profile/privacy.tsx` |
| 19 · Умови використання | `Terms.dc.html` | «у розділі «Ще»» → «Профіль» | `profile/terms.tsx` |
| Таб-бар усіх артбордів | усі `*.dc.html` з `<nav class="tabbar">` | «Ще» → «Профіль», іконка людини | `src/app/(tabs)/_layout.tsx` |

Нотатка канвасу `flowMore` → «Профіль».

## Project Structure

### Documentation (this feature)

```text
specs/002-profile-tab/
├── spec.md
├── plan.md              # цей файл
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── profile-repository.md   # інтерфейс шару профілю (заміна на Firebase)
│   └── ui.md                   # маршрути, тексти, testID, доступність
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── app/(tabs)/
│   ├── _layout.tsx                  # змінено: Trigger 'profile', «Профіль», іконка, умова hidden
│   ├── more.tsx                     # видалено
│   └── profile/
│       ├── _layout.tsx              # Stack, headerShown: false
│       ├── index.tsx                # 16/16a + діалоги 16b/16c
│       ├── edit-name.tsx            # 17
│       ├── privacy.tsx              # 18
│       └── terms.tsx                # 19
├── services/
│   ├── auth/types.ts                # AuthUser.method?
│   ├── auth/local-auth-service.ts   # записує method
│   ├── profile/                     # новий: types.ts, local-profile-repository.ts, initial.ts, index.ts
│   ├── account/                     # новий: wipe-local-data.ts, index.ts
│   ├── ledger/                      # LedgerRepository.clear()
│   └── outages/                     # OutageSettingsRepository.clear(), cancelOutageNotifications()
├── providers/
│   ├── profile-provider.tsx         # новий: ProfileProvider, useProfile, useProfileRepository
│   ├── auth-provider.tsx            # довершення pendingWipe на старті
│   ├── onboarding-provider.tsx      # resetOnboarding()
│   └── outage-provider.tsx          # useOutageNotificationToggle()
├── views/profile/                   # новий: profile-card.tsx, avatar.tsx, sign-in-method-row.tsx,
│                                    #   legal-document.tsx, confirm-destructive.ts, index.ts
└── app/_layout.tsx                  # ProfileProvider у дереві провайдерів

docs/patterns/account-actions.md     # новий патерн
docs/patterns/{tab-bar,test-ids,README}.md   # оновлено
.claude/skills/ui-check/flows/{smoke,profile}.flow
```

**Structure Decision**: один мобільний проєкт; нові маршрути — у звичайній папці `profile/` всередині `(tabs)`, щоб URL був `/profile` (R8). Бізнес-логіка — сервіси з інтерфейсами, як `ledger` і `outages`; React-стан — через провайдери з `useSyncExternalStore`.

## Ризики

- **Перерване стирання** — закрите маркером `pendingWipe` (R4); перевірити вручну, вбивши застосунок одразу після підтвердження.
- **Екран «Світла» з відкритою чернеткою** — якщо перемкнути сповіщення в профілі, поки налаштування відкриті в іншому стеку, чернетка їх перезапише при «Зберегти». Прийнятно: таби не показують два екрани одночасно, а налаштування читаються при кожному відкритті.
- **Старі сесії без `method`** — нейтральний рядок без іконки (data-model, стан `unknown`).
