# Research: Іконка застосунку, splash з анімацією та пульсація порожніх станів

Джерела: документація Expo SDK 58 — [SplashScreen](https://docs.expo.dev/versions/v58.0.0/sdk/splash-screen/), [Splash screen and app icon](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/); артборди канвасу `AppIcon.dc.html`, `Splash.dc.html`, `ui.css` («Pulse — empty / waiting states»); код проєкту (`expo` 58, `react-native` 0.88, `react-native-reanimated` 4.7, `expo-linear-gradient`, `expo-splash-screen` 58).

## R1. Іконка iOS — Icon Composer (`.icon`)

- **Decision**: замінити вміст наявного бандла `assets/expo.icon` (зараз стандартний символ Expo) на новий бандл `assets/app.icon` і вказати його в `ios.icon`. Шари: заливка — лінійний градієнт `#2B3A52` → `#0B1424` (діагональ, як в артборді); шар `house.svg` — білий будинок, блискавка вирізана (fill-rule `evenodd`), тож крізь неї видно тло; шар `shadow.svg` — довга тінь (чорний, прозорість .38 → 0) під будинком. Відблиск і обʼєм дає сам Icon Composer (specular/shadow групи), окремий шар відблиску не потрібен. Старий `assets/expo.icon` видаляється.
- **Rationale**: Expo підтримує `.icon` у `ios.icon` з SDK 54; «dark mode is handled in Icon Composer», тобто темний і тонований варіанти (FR-002) генеруються системою з шарів без окремих PNG. Векторні шари дають чітку іконку всіх розмірів.
- **Alternatives**: обʼєкт `ios.icon: { light, dark, tinted }` з трьома PNG — більше ручної роботи, тонований варіант доведеться малювати вручну, і без «Liquid Glass» вигляду iOS 26. Відкинуто.
- **Перевірка**: бандл відкривається в Icon Composer (Xcode 26, уже потрібний проєкту); `npx expo prebuild -p ios` + збірка, іконка на головному екрані симулятора в Default / Dark / Tinted.

## R2. Іконка Android — адаптивна

- **Decision**: `android.adaptiveIcon`:
  - `backgroundImage` — 1024×1024 PNG: градієнт артборда + відблиск (radial, білий .10) + довга тінь (тінь у тлі, бо вона доходить до країв, а маска все одно обріже);
  - `foregroundImage` — 1024×1024 PNG із прозорим тлом: білий будинок, блискавка — прозорий виріз (крізь нього видно градієнт тла); знак вписаний у безпечну зону адаптивної іконки (центральні 66 dp із 108 dp ≈ 61 %), з запасом — ширина будинку ≈ 52 % полотна;
  - `monochromeImage` — той самий силует будинку з вирізом, білий на прозорому, та сама геометрія (FR-004, тематичні іконки Android 13+);
  - `backgroundColor` — `#14213A` (запасний колір, збігається з середнім тоном градієнта).
  - Верхньорівневий `icon` (`assets/images/app/icon.png`, 1024×1024) — повна іконка артборда без прозорості: для легасі-іконки Android і як запасна.
- **Rationale**: документація Expo: `adaptiveIcon` перекриває інші налаштування, `backgroundImage` має бути тих самих розмірів, що й передній план, `monochromeImage` — для тематичних іконок. Безпечна зона — з настанов Android щодо адаптивних іконок (Expo посилається на них, не дублює числа).
- **Alternatives**: тінь у передньому плані — при паралаксі лаунчера тінь «відʼїжджала» б від тла з різким краєм; суцільний `backgroundColor` без зображення — втрачаються градієнт і тінь з артборда.

## R3. Растеризація SVG → PNG

- **Decision**: вихідні SVG (іконка повна, тло, передній план, монохром, знак для splash) зберігаються в `assets/images/app/source/` разом із коротким `README.md`, як їх перегенерувати. PNG генеруються одноразово скриптом Swift (`scripts/render-icons.swift`, AppKit `NSImage` читає SVG і малює в `NSBitmapImageRep` точного розміру) — без нових залежностей у `package.json`. Якщо CoreSVG неправильно відмалює градієнти, запасний варіант — `npx --yes @resvg/resvg-js-cli` у тимчасовій теці (не залежність проєкту). Результат звіряється з артбордом (`ui-check` / візуально).
- **Rationale**: у системі немає `rsvg-convert`/ImageMagick; Swift є на macOS разом з Xcode, що й так потрібен для збірки. Вихідні SVG у репозиторії дозволяють змінити іконку пізніше.
- **Alternatives**: додати `sharp` у devDependencies — зайва нативна залежність для разової задачі.

## R4. Системний (статичний) splash

- **Decision**: плагін `expo-splash-screen` в `app.json`: `backgroundColor: "#14213A"`, `image: "./assets/images/app/splash-icon.png"` — 1024×1024 PNG із прозорим тлом, білий знак будинку з блискавкою (виріз кольору `#14213A` — прозорий, крізь нього видно фон), знак займає ≈ 46 % ширини полотна по центру; `imageWidth: 288` (тоді знак на iOS має 132 pt, як в артборді); `resizeMode: "contain"`; ключ `dark` з тими самими значеннями, щоб splash був однаковий у темній темі.
- **Rationale**: Android 12+ показує іконку splash у колі: полотно 288 dp, видима частина — коло діаметром 192 dp (настанови Android SplashScreen API; у документації Expo цих чисел немає). Знак 132 dp ≈ 46 % від 288 вписується в коло з запасом, тож однакова картинка дає однаковий розмір знака на обох платформах. «Only .png images are supported».
- **Alternatives**: окремі `ios`/`android` зображення — зайве, якщо одна картинка дає однаковий розмір.

## R5. Анімований splash

- **Decision**: новий компонент `AppSplash` (`src/views/splash/app-splash.tsx`) — накладка на весь екран поверх навігатора, рендериться в `src/app/_layout.tsx` поруч із `RootNavigator` усередині `AppProviders`.
  - **Перший кадр** = системний splash: суцільний `#14213A`, знак 132×132 точно по центру екрана. На `onLayout` накладки викликається `SplashScreen.hide()` — системний splash зникає, а під ним уже такий самий кадр (FR-005, SC-003). Далі за ~300 мс проявляються градієнт, світло, тінь, напис і низ екрана.
  - **Знак у центрі**: в артборді група «знак + напис» піднята на 40 px; щоб збігтися з системним splash (він завжди центрує картинку), знак лишається в центрі, а «Utility Ledger» — під ним з відступом 28. Відхилення від артборда свідоме.
  - **Градієнт** — `expo-linear-gradient` (160° → `start/end`, зупинки 0 / .48 / 1).
  - **«Сонце»** — `View` 960×960 з `backgroundImage: 'radial-gradient(circle, rgba(255,236,200,.20) 0%, rgba(255,255,255,.07) 30%, transparent 60%)'` (RN 0.88 підтримує `radial-gradient` у `backgroundImage`). Рух — одна shared value `p` 0→1→0, `withRepeat(withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.ease) }), -1, true)`: `x = -170 + 340·p`, `y = 40 − 100·sin(π·p)` (дуга через вершину −60, як ключові кадри артборда).
  - **Тінь** — `View` 220×1000 під знаком з `transformOrigin: 'top'`, фон `radial-gradient(ellipse at top, rgba(0,0,0,.30), rgba(0,0,0,.12) 40%, transparent 85%)` — заміна `linear-gradient` + `mask-image` + `blur(18px)` з артборда, бо `mask-image` в RN немає, а `filter: blur` працює лише на Android. Поворот `−38° + 76°·p` від тієї самої `p` (тінь завжди протилежна сонцю).
  - **Індикатор** — `ActivityIndicator` з React Native, `color="#FFFFFF"`, `size="large"`: це нативні `UIActivityIndicatorView` на iOS і Material `ProgressBar` на Android (FR-008). Намальований спінер з макета не відтворюється.
  - **Статус-бар** — світлий вміст (`expo-status-bar`, `style="light"`), поки накладка видима.
  - **Зменшити рух** — `useReducedMotion()` з Reanimated: `p` фіксується на 0,5 (сонце у вершині, тінь вертикально), анімація не запускається (FR-011). Індикатор нативний і крутиться як завжди.
  - **Доступність** — накладка `accessible` з `accessibilityLabel="Utility Ledger, завантаження"` і `accessibilityRole="progressbar"`; світло й тінь `importantForAccessibility="no-hide-descendants"` / `accessibilityElementsHidden` (FR-012).
  - **Зникнення** — `withTiming(opacity 0, 300 мс)`, після нього накладка знімається (`pointerEvents="none"` під час згасання).
- **Rationale**: накладка в JS не вимагає нових нативних залежностей і доставляється OTA; спільна `p` для сонця й тіні гарантує протилежний рух; Reanimated уже в проєкті (патерн `reanimated.md`: лише `get()/set()`).
- **Alternatives**: Lottie / Rive — нова нативна залежність і окремий файл анімації; `react-native-svg` — немає в проєкті, а градієнти RN 0.88 закривають потребу.

## R6. Коли splash зникає

- **Decision**: хук `useSplashGate()` у `src/views/splash/` вирішує, коли накладка може згаснути:
  - накладка взагалі монтується лише тоді, коли всі провайдери вже відрендерили дітей: `PreferencesProvider` (налаштування), `AuthProvider` (відомо, чи є вхід), `OnboardingProvider`, `AccountDataProvider` (репозиторії привʼязані) — до того системний splash лишається (вже діє `preventAutoHideAsync` у глобальній області `preferences-provider.tsx`); шрифти Onest вбудовані нативно плагіном `expo-font`, чекати їх не треба;
  - **дані акаунта**: `ready`, якщо користувач не увійшов, або `useAccountDataStatus().status !== 'loading'` (`ready` чи `offline`), або минуло 3000 мс від монтування накладки (FR-009a);
  - **мінімум**: не раніше 1000 мс від монтування накладки (FR-009);
  - коли обидві умови виконані — згасання 300 мс.
  - `SplashScreen.hideAsync()` прибирається з `PreferencesProvider` — тепер його викликає `AppSplash` на `onLayout`; глобальний `preventAutoHideAsync()` лишається на місці.
- **Лише холодний запуск**: модульний прапорець `splashFinished` (у памʼяті JS). `AccountDataProvider` повертає `null` на мить при зміні акаунта (вхід/вихід), тож дерево під ним перемонтовується; без прапорця splash зʼявився б після входу. Повернення з фону не перемонтовує дерево — splash не показується (FR-010).
- **Rationale**: точка монтування накладки збігається з моментом, коли перший екран уже готовий під нею; таймери рахуються від реального показу анімованого splash.
- **Alternatives**: чекати в `PreferencesProvider` — він не знає про вхід і дані; рендерити накладку вище провайдерів — тоді треба дублювати їхній стан готовності.

## R7. Пульсація порожніх станів

- **Decision**: спільні компоненти в `src/components/pulse.tsx`:
  - `PulseRings` — два абсолютно розміщені кола на весь розмір ілюстрації (`inset: 0`, `borderRadius` = половина), колір — ключ теми (`blueSoft2` / `powerOnSoft` / `line`). Кожне: `scale .55 → 1.35`, `opacity .9 → 0`, 2800 мс, `Easing.out(Easing.ease)`, `withRepeat(-1)`; друге — `withDelay(1400, …)`. Кільця стоять першими (під колами ілюстрації), виходять за її межі до 135 % — батьківський контейнер не обрізає (`overflow: visible`).
  - `PulseCore` — обгортка центральної плитки: `scale 1 → 1.06 → 1` за 2800 мс (`withRepeat(withTiming(1.06, 1400, inOut), -1, true)`).
  - Обидва через `usePulseActive()`: `useIsFocused()` з `expo-router` && `!useReducedMotion()`. Неактивний — `cancelAnimation` і скидання до спокою; при «Зменшити рух» кільця не рендеряться, плитка в масштабі 1 (FR-017, FR-018).
  - Анімуються лише `transform` і `opacity` на UI-потоці — не впливає на розмітку й прокрутку (FR-016, SC-006).
- **Застосування**:
  - `src/views/objects/empty-state-view.tsx` (05a, 08e, 12e, 09e — усі через `EmptyStateView`): кільця `blueSoft2` у контейнері 188, `PulseCore` на плитці; бейдж «плюс» поза `PulseCore`.
  - `src/views/outages/outage-message.tsx`: новий проп `pulse?: boolean`; кільця `powerOnSoft` для `tone='power'`, `line` для `tone='muted'`. У `src/app/(tabs)/(outages)/index.tsx` `pulse` вмикається для «Оберіть свою чергу» (20) і «Постачальник … не доданий» (20c); стани помилки завантаження графіка — без пульсації (їх немає в переліку канвасу).
  - `src/views/account-data/account-data-offline.tsx` (05o на «Обʼєктах», «Світлі», у «Профілі»): кільця `line`, `PulseCore` на колі з іконкою, і в повноекранному, і в компактному варіанті.
- **Rationale**: один компонент — однакові тривалості й поведінка скрізь (FR-019), новий порожній стан отримує пульсацію одним рядком; `useIsFocused` зупиняє анімацію на екранах під верхнім у стеку.
- **Alternatives**: CSS-анімації RN (`animationName`) — ще експериментальні в 0.88 і не дають `useReducedMotion`-контролю так просто; анімація через `Animated` RN — у проєкті вже Reanimated.

## R8. Нативна збірка й OTA

- **Decision**: іконки й системний splash — нативні ресурси: після змін у `app.json`/assets потрібні `npx expo prebuild` (каталоги `ios/` і `android/` у проєкті під git — регенеруються, не редагуються вручну) і нова збірка (`npx expo run:ios|android` або `eas build`). Анімований splash і пульсація — JS, доставляються OTA. Документація радить перевіряти splash на release/preview-збірці, не в dev-збірці.
- **Нових залежностей немає**: `expo-splash-screen`, `expo-linear-gradient`, `expo-status-bar`, `react-native-reanimated` уже встановлені.
