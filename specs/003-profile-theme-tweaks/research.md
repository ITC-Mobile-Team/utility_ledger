# Research: Профіль — тема застосунку та дрібні правки

## R1. Як перемкнути тему всього застосунку

- **Decision**: `Appearance.setColorScheme(value)` з React Native, де `value` — `'light'`, `'dark'` або `'auto'` для «Як у системі». Усі місця застосунку вже читають тему через `useColorScheme()` (7 файлів, зокрема `useThemeColor`, кореневий `useNavigationTheme`, `ActionButton`, `NavigationBarBackground`, `OutageSkeleton`), тож вони отримують перевизначене значення без змін.
- **Rationale**: за документацією RN 0.88 перевизначення діє на рівні застосунку й на «усі нативні елементи в ньому (Alerts, Pickers тощо)»; `'auto'` знімає перевизначення й повертає систему, `'unspecified'` застарів, `null` не приймається. `app.json` уже має `userInterfaceStyle: "automatic"`, а `expo-system-ui` встановлений — це потрібні умови для Android. Нативних змін і нового пакета не треба.
- **Alternatives considered**: власний React-контекст зі схемою замість `useColorScheme` — довелося б міняти всі 7 місць, і нативні `Alert`, `ActionSheetIOS`, клавіатура та `NativeTabs` лишилися б у системній темі (порушує FR-008); `userInterfaceStyle` у `app.json` — статичний, без вибору в рантаймі.
- **Перевірити на пристрої**: клавіатура, `Switch` і рядок стану в документації прямо не названі — сценарій US1 №4 у [quickstart.md](quickstart.md).

## R2. Без спалаху іншої теми при запуску

- **Decision**: новий `AppearanceProvider` — найзовнішній провайдер у `src/app/_layout.tsx` (усередині `GestureHandlerRootView`). Він читає `themePreference` зі сховища, викликає `Appearance.setColorScheme` і лише тоді рендерить дітей; до того повертає `null`, як уже робить `OnboardingProvider`. `ThemeProvider` навігації і `SystemUI.setBackgroundColorAsync` переносяться в дочірній компонент, щоб брати вже перевизначену схему.
- **Rationale**: поки дерево порожнє, видно нативний splash, тож першим кадром буде вже правильна тема. Читання одного ключа з AsyncStorage паралельне з іншими провайдерами й не помітне на старті.
- **Alternatives considered**: синхронне сховище (`expo-sqlite/kv-store`) — новий нативний пакет, потрібна dev build; рендер одразу з подальшим перемиканням — спалах, порушує SC-002.

## R3. Плавна зміна теми

- **Decision**: при зміні вибору кореневий лейаут на мить кладе поверх застосунку `Animated.View` з фоном `bg` попередньої теми (непрозорий), застосовує нову тему й гасить оверлей до прозорості за 250 мс (Reanimated `withTiming`, `pointerEvents='none'`). Картки на екрані «Тема» додатково анімують рамку й позначку CSS-переходами Reanimated (як `MonthPickerSheet`).
- **Rationale**: без нативного знімка екрана (потрібен би `react-native-view-shot`) справжній cross-fade недоступний; затемнення через фон попередньої теми дає м'який перехід, вкладається в 0,5 с (SC-001) і ховає момент, коли нативні й JS-елементи перемальовуються не синхронно.
- **Alternatives considered**: без анімації — різке перемикання, не відповідає FR-007; знімок екрана й cross-fade — новий нативний пакет.
- **Швидкі дотики поспіль**: кожен вибір одразу пишеться в стан і сховище; оверлей перезапускається від поточного кольору, тож проміжні теми не залишаються (Edge Cases).

## R4. Де зберігати вибір і як його стирати

- **Decision**: ключ `themePreference` у наявному `KeyValueStorage`; невідоме чи пошкоджене значення → `system`. `createLocalDataWiper.eraseData` додає `storage.removeItem(THEME_KEY)`; екран профілю після `wipeLocalData()` викликає `resetAppearance()` поруч із `resetOnboarding()`. Якщо при старті висить маркер `pendingWipe`, провайдер одразу бере `system`, щоб перерване стирання не лишило темну тему до наступного запуску.
- **Rationale**: той самий шлях, що в онбордингу (`account-actions.md`); тема — налаштування пристрою, яке стирає вихід (Clarifications, FR-011).
- **Alternatives considered**: окремий репозиторій на кшталт `ProfileRepository` — зайвий для одного значення без хмарної синхронізації (поза обсягом).

## R5. Статус «Світла» в профілі

- **Decision**: чиста функція `getOutageSetupStatus(settings)` у `src/services/outages/setup-status.ts` повертає `'ready' | 'noCity' | 'noProvider' | 'noQueues'` за тими ж правилами, що зараз інлайн у `(outages)/index.tsx` (`getProviderForCity`, черги, відфільтровані за `provider.queues`). І вкладка «Світло», і профіль беруть її; профіль читає `useOutageSettings()`, тож статус оновлюється сам (FR-015).
- **Rationale**: одне визначення «налаштовано» для двох екранів (FR-012), без розбіжностей у майбутньому.
- **Alternatives considered**: дублювати умову в профілі — ризик розійтися з «Світлом».

## R6. Перехід у налаштування «Світла» з табу «Профіль»

- **Decision**: кнопка «Налаштувати» викликає `router.navigate('/outage-settings')`; у `src/app/(tabs)/(outages)/_layout.tsx` додається `export const unstable_settings = { anchor: 'index' }`, тож під екраном налаштувань завжди лежить головний екран «Світла», і «Назад» веде на нього (FR-014). `navigate` не додає другу копію, якщо налаштування вже відкриті у стеку «Світла».
- **Rationale**: Expo Router сам перемикає таб-бар на таб, що містить маршрут; `anchor` — механізм роутера для початкового екрана вкладеного стеку (у `node_modules/expo-router/build/layoutAnchor.d.ts`). Точну назву ключа звірити з документацією v58 перед задачею.
- **Alternatives considered**: `router.push` — може покласти другу копію; два кроки (перемкнути таб, потім `push`) — мигтить головний екран і залежить від таймінгу.

## R7. Картка профілю без дотику

- **Decision**: `ProfileCard` втрачає `Pressable`, `onPress` і `AppImage` зі стрілкою; кореневий `ThemedView` отримує `accessible` і `accessibilityLabel={`${name}, ${email}`}` без ролі кнопки; `testID='profile.card'` лишається на `ThemedView`.
- **Rationale**: FR-001, US3 №1–2; testID потрібен ui-check для перевірки, що тап нічого не відкриває.

## R8. Відступ перед «Вийти»

- **Decision**: розділи профілю йдуть у `VStack spacing={14}` з `marginTop: 6` на кожному розділі (разом 20). Картка «Вийти» отримує `marginTop: 26` (разом 40) — удвічі більше (FR-017); остаточне число звіряється з артбордом 16.
