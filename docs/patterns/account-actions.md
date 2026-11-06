# Профіль і дії з акаунтом

Еталон — таб «Профіль» (`src/app/(tabs)/profile/`): кореневий екран, «Ваше імʼя», документи.

## Дані профілю

- Імʼя, email і спосіб входу читаються лише через `useProfile()` з `src/providers/profile-provider.tsx`, змінюються через `useProfileRepository()` (`setName`). Екрани не звертаються до сховища напряму.
- `ProfileRepository` (`src/services/profile/types.ts`) — інтерфейс; зараз реалізація локальна (`local-profile-repository.ts`, ключ `userProfile`). Під Firebase підставляється інша реалізація в `src/services/profile/index.ts`, екрани не змінюються.
- Після входу `ProfileProvider` викликає `syncFromAuth`: новий користувач — профіль з даних провайдера; той самий — оновлюються email і спосіб входу, а імʼя лише якщо користувач його не змінював (`nameSource`).
- Ініціал аватара — `getInitial()` (перший символ за кодовими точками), email для показу — `formatProfileEmail()`.

## Вихід і видалення акаунта

- Підтвердження — `confirmDestructive()` з `src/views/profile`: iOS — action sheet знизу з деструктивною кнопкою і «Скасувати», Android — системний `Alert`. Кнопки системного діалогу не обгортаємо в `guardPress`; повторний запуск дії блокує прапорець на екрані.
- Стирання — лише `wipeLocalData()` з `src/services/account`. Порядок: маркер `pendingWipe` → вихід із сесії → скасування сповіщень «Світла» і `clear()` усіх репозиторіїв + прапорець онбордингу → зняти маркер. `AuthProvider` на старті викликає `finishPendingWipe()`, тож перерване стирання доводиться до кінця.
- Після `wipeLocalData()` екран викликає `resetOnboarding()`, щоб наступний вхід почався з онбордингу.
- Новий репозиторій з даними користувача MUST мати `clear()` і бути доданим у `createLocalDataWiper` (`src/services/account/index.ts`).
- Поки дані лише на пристрої, «Вийти» і «Видалити акаунт» дають той самий результат. З Firebase «Видалити» додатково видалятиме дані на сервері.

## Сповіщення поза налаштуваннями «Світла»

Перемикач попереджень у профілі — `useOutageNotificationToggle()` з `src/providers/outage-provider.tsx`: ті самі налаштування, той самий запит дозволу й `showNotificationPermissionAlert()`, перепланування за кешованим графіком.
