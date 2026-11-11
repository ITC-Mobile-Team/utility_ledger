# Дані користувача (Firestore)

Еталон — `src/services/ledger/firestore-ledger-repository.ts`, `src/providers/account-data-provider.tsx`. Специфікація — `specs/007-firestore-data/`.

## Де що лежить

| Дані | Де | Шлях |
|---|---|---|
| Профіль (імʼя, email, спосіб входу) | Firestore | `users/{uid}` |
| Обʼєкти, послуги | Firestore | `users/{uid}/objects/{id}`, `users/{uid}/services/{id}` |
| Місяці обʼєкта | Firestore | `users/{uid}/months/{objectId}_{YYYY-MM}` |
| Показники, дні, суми | Firestore | `users/{uid}/readings|dayCounts|amounts/{serviceId}_{YYYY-MM}` |
| Місто й черги «Світла» | Firestore | `users/{uid}/settings/outages` |
| Сповіщення «Світла», кеш графіків | пристрій (`KeyValueStorage`) | `outageSettings` (лише `notifications`), `outageSchedule:{providerId}` |
| Тема, стартова вкладка, онбординг | пристрій | див. [preferences.md](preferences.md) |
| «Пристрій уже отримав дані акаунта» | пристрій | `accountDataSynced:{uid}` |

Шляхи й хелпери — `src/services/firestore/index.ts` (`userDoc`, `userCollection`, `outageSettingsDoc`, `entryId`). Природний ключ «сутність + місяць» робить повторний запис за той самий місяць заміною. Правила безпеки — `firestore.rules` у корені (кожен акаунт бачить лише `users/{свій uid}/**`), публікуються в консолі Firebase або `firebase deploy --only firestore:rules`.

Web поза обсягом: `index.web.ts` у `src/services/ledger`, `profile`, `outages`, `account-data` підставляють локальні реалізації без Firestore.

## Репозиторії

- Інтерфейси ті самі (`LedgerRepository`, `ProfileRepository`, `OutageSettingsRepository`), екрани не знають про Firestore. Замість `load()` — `setUser(uid | null)`: `null` відписує слухачі й дає порожній знімок, `uid` підписує `onSnapshot` на дані акаунта; проміс завершується після першого знімка з локальної копії (миттєво, і без інтернету). Викликає його лише `AccountDataProvider`.
- Мутації **не чекають сервера**: проміс запису Firestore завершується лише після підтвердження сервера, і без інтернету висів би. Мутація застосовується оптимістично до масиву своєї колекції (з нього збирається знімок), перезбирає знімок і йде в Firestore через `applyWrites` з `src/services/firestore/batch.ts` (помилка — лише `[firestore] <код>` у dev-лозі). Тому `await ledger.addObject()` на екрані повертається одразу, і новий обʼєкт уже в знімку.
- Нові ідентифікатори — `doc(userCollection(uid, …)).id` (локально, без мережі).
- Каскади (видалення обʼєкта, послуги, місяця, скидання, перенесення місяця) — список операцій з поточного знімка, батчами ≤ 500. Перенесення місяця — видалення `…_{from}` і запис `…_{to}`.
- Знімок відкидає сиріт (послуги без обʼєкта, показники без послуги тощо), що могли лишитися після одночасних змін на двох пристроях. Конфлікти — «пізніший запис перемагає».
- `undefined` Firestore не приймає: дані перед записом проходять `withoutUndefined`.

## Офлайн і локальна копія

Постійний кеш і черга записів нативного SDK — це локальна копія даних акаунта. Черга ведеться окремо для кожного користувача: після виходу незбережені зміни чекають на наступний вхід того самого акаунта, інший акаунт їх не бачить і не відправляє. Тому ніде не викликаються `disableNetwork`, `clearPersistence`, `terminate`, не вимикається `persistence`. Вихід не стирає копію: повторний вхід показує дані одразу. Прихована копія акаунта, видаленого на іншому пристрої, лишається в кеші цього пристрою (недоступна, бо акаунта вже немає).

## Перше завантаження

`AccountDataProvider` (усередині `AuthProvider`, обгортає `Ledger/Outage/ProfileProvider`) після `setUser`:

- є `accountDataSynced:{uid}` → `status: 'ready'` одразу;
- немає → `'loading'`, серверне читання всіх даних (`fetchFromServer`), перенесення даних попередньої версії, прапорець, `'ready'`; без звʼязку (`firestore/unavailable`) або з іншою помилкою (напр. `permission-denied`, коли правила не опубліковані — код у dev-лозі) → `'offline'`, `retry()` повторює.

`useAccountDataStatus()` читають кореневі екрани табів через `AccountDataGate` (`src/views/account-data/`): `loading` → скелетон, `offline` → «Немає інтернету — дані акаунта ще не завантажено» з «Спробувати ще», `ready` → вміст. Порожні стани й пропозиція налаштувати «Світло» до `ready` не показуються. Скелетони — на `SkeletonBone` + `useSkeletonShine` з `src/components/skeleton.tsx` (артборди 05s, 20d, 16s, 05o). У профілі скелетон/офлайн-картка стоїть лише замість картки імені: «Вийти» й «Видалити акаунт» доступні й без інтернету. Аналітика поки заглушка без даних — без скелетона.

`ProfileProvider` викликає `syncFromAuth` лише при `ready`: до серверного читання порожня копія нового пристрою виглядає як «профілю немає», і новий профіль затер би хмарний. Сповіщення «Світла» переплановуються, коли місто чи черги змінюються не кнопкою (інший акаунт, вихід, інший пристрій) — теж лише при `ready`.

## Дані попередньої версії

`migrateLegacyData` (`src/services/account-data/migrate-legacy.ts`) після першого серверного читання: якщо акаунт порожній (немає обʼєктів і налаштувань «Світла»), переносить `ledgerState` і місто/черги з `outageSettings` з тими самими id; у будь-якому разі видаляє ці ключі (на пристрої лишаються тільки сповіщення). Імʼя, змінене до хмари (зокрема за часів імітації входу), переносить `syncFromAuth` профілю з ключа `userProfile` і видаляє його.

## Видалення акаунта

`deleteAccountData(uid)`: серверне читання (без звʼязку — відмова, нічого не видалено), видалення всіх документів `users/{uid}/**` і самого `users/{uid}` батчами з очікуванням сервера (таймаут 20 с), прапорець знімається. `AuthService.deleteAccount(deleteData)` викликає його після перепідтвердження Apple і до відкликання доступу та `deleteUser` (див. [account-actions.md](account-actions.md)).

## Нова колекція

1. Назва в `UserCollection` і `USER_COLLECTIONS` (`src/services/firestore/index.ts`) — тоді `fetchFromServer` і `deleteAccountData` її охоплять.
2. Слухач і мутації в репозиторії за зразком вище; поле в типі знімка.
3. Правила не міняти — `users/{uid}/{document=**}` уже покриває.
4. Якщо дані були на пристрої — перенесення в `migrate-legacy.ts`.
