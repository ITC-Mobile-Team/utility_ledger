# Профіль і дії з акаунтом

Еталон — таб «Профіль» (`src/app/(tabs)/profile/`): кореневий екран, «Ваше імʼя», документи.

## Вхід і сесія

- Сесія — Firebase Auth (React Native Firebase): `src/services/auth/firebase-auth-service.ts` реалізує `AuthService` (`src/services/auth/types.ts`), екрани знають лише `useAuth()` з `src/providers/auth-provider.tsx`. Firebase сам відновлює сесію з нативного сховища (і без інтернету); поки стан невідомий, `AuthProvider` нічого не рендерить.
- Провайдери — `src/services/auth/providers/`: `apple.ios.ts` (системне вікно Apple через `expo-apple-authentication`, nonce: SHA-256 в Apple, сирий у Firebase), `apple.android.ts` (сторінка Apple у Custom Tab через `signInWithPopup`), `apple.ts` (інші платформи — `failed`), `google.ts` (`@react-native-google-signin/google-signin`, `webClientId` — вебклієнт типу 3 з `google-services.json`). На web сервіс — заглушка `firebase-auth-service.web.ts` (завжди «не увійшов»).
- `signIn` і `deleteAccount` відхиляються лише `AuthError` (`kind: 'cancelled' | 'failed'`, перетворення — `toAuthError()` у `src/services/auth/errors.ts`). `cancelled` — користувач закрив вікно провайдера: екран нічого не показує, кнопки знову доступні. `failed` на вході — екран `/auth-error`; у dev-збірці код невдачі пишеться в лог як `[auth] <код>`.
- Конфіги Firebase — `GoogleService-Info.plist` і `google-services.json` у корені проєкту, підключені через `googleServicesFile` в `app.json`. iOS-збірка: SPM + `useFrameworks: "dynamic"`, а `plugins/with-google-signin-spm-link.js` лінкує в застосунок спільні SPM-продукти GoogleSignIn і Firebase, які precompiled modules Expo інакше губить; при `Undefined symbol` з `libRNGoogleSignin.a` після оновлення пакетів — додати продукт у цей плагін. Android-збірка: Kotlin 2.4.0 (`expo-build-properties` `android.kotlinVersion`, бо Firebase Auth 25 скомпільований Kotlin 2.4) і памʼять Gradle з `plugins/with-gradle-memory.js`; локальний APK — `./gradlew assembleRelease` в `android/`. Новий SHA-1 (EAS, Play App Signing) додається у Firebase, після чого `google-services.json` завантажується знову.

## Дані профілю

- Імʼя, email і спосіб входу читаються лише через `useProfile()` з `src/providers/profile-provider.tsx`, змінюються через `useProfileRepository()` (`setName`). Екрани не звертаються до сховища напряму.
- `ProfileRepository` (`src/services/profile/types.ts`) — інтерфейс; реалізація локальна (`local-profile-repository.ts`, ключ `userProfile`). Хмарна реалізація підставляється в `src/services/profile/index.ts`, екрани не змінюються.
- Після входу `ProfileProvider` викликає `syncFromAuth`: новий користувач — профіль з даних провайдера (імʼя, змінене за часів імітації входу, `userId` з `preview-id-`, переноситься); той самий — оновлюються email і спосіб входу, а імʼя лише якщо користувач його не змінював (`nameSource`) і провайдер його повернув (Apple дає імʼя лише при першому вході, тому сервіс зберігає його в `displayName` акаунта).
- Ініціал аватара — `getInitial()` (перший символ за кодовими точками), email для показу — `formatProfileEmail()`.

## Вихід і видалення акаунта

- Підтвердження — `confirmDestructive()` з `src/views/profile`: iOS — системний action sheet з деструктивною кнопкою і «Скасувати», Android — системний `Alert`. На iOS 26+ система показує його по центру екрана, а не знизу, як на артбордах 16b/16c; це свідоме рішення — лишаємо нативний вигляд. Кнопки системного діалогу не обгортаємо в `guardPress`; повторний запуск виходу чи видалення блокує прапорець на екрані.
- «Вийти» (`useAuth().signOut()`) завершує сесію Google (наступний вхід покаже вибір акаунта) і Firebase; `Stack.Protected` у `src/app/_layout.tsx` сам відкриває `(auth)`. Підтвердження «Вийти з акаунта?» без пояснення.
- «Видалити акаунт» (`useAuth().deleteAccount()`) назавжди видаляє акаунт Firebase. Apple завжди просить свіже підтвердження; на iOS після нього відкликається доступ застосунку до Apple ID (`revokeToken`), на Android React Native Firebase цього не вміє — відкликання немає. Google — видалення одразу, повторний вибір акаунта лише на `auth/requires-recent-login` (інший акаунт — невдача), після видалення — `revokeAccess`.
- Текст підтвердження фінальний: «Видалити акаунт?» / «Акаунт і всі ваші дані буде видалено назавжди. Цю дію не можна скасувати.» Закрите вікно провайдера нічого не показує; невдача — системний `Alert` «Не вдалося видалити акаунт» / «Перевірте інтернет і спробуйте ще раз.» з «Скасувати» і «Спробувати ще»; акаунт і сесія тоді лишаються.
- Ні вихід, ні видалення не стирають даних на пристрої: обʼєкти, показники, налаштування пристрою, прапорець онбордингу, профіль і сповіщення «Світла» лишаються. Модуля стирання немає. Після виходу вхід в інший акаунт на тому самому пристрої покаже ті самі дані — розділення даних між акаунтами зʼявиться з хмарним зберіганням.
- Коли дані зберігатимуться в хмарі, видалення акаунта має видаляти й їх; репозиторії з даними користувача тримають `clear()` для цього.

## Сповіщення поза налаштуваннями «Світла»

Перемикач попереджень у профілі — `useOutageNotificationToggle()` з `src/providers/outage-provider.tsx`: ті самі налаштування, той самий запит дозволу й `showNotificationPermissionAlert()`, перепланування за кешованим графіком.

## Налаштування пристрою при виході

Тема й стартова вкладка (див. [preferences.md](preferences.md)) переживають і «Вийти», і «Видалити акаунт»: це налаштування пристрою, вихід їх не скидає.

## Статус «Світла» під перемикачем

Якщо «Світло» не налаштоване, у картці «Сповіщення» під перемикачем видно статус і кнопку «Налаштувати» (`OutageSetupNotice`). Умова — `getOutageSetupStatus()` з `src/services/outages`, та сама, за якою вкладка «Світло» вирішує, показувати графік чи ні: `noCity`, `noProvider`, `noQueues` → текст через `getOutageSetupMessage()`, `ready` → нічого. Статус не залежить від того, увімкнений перемикач чи ні.
