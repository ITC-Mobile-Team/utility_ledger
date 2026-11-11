# Contract: репозиторії даних акаунта й провайдери

Екрани не змінюються: вони й далі читають `useLedgerState()`, `useLedger()`, `useOutageSettings()`, `useOutageRepository()`, `useProfile()`, `useProfileRepository()`. Змінюються життєвий цикл репозиторіїв і нові хуки стану завантаження.

## Спільне для трьох репозиторіїв

`load(): Promise<void>` замінюється на привʼязку до акаунта:

```ts
// null — вийшли: слухачі відписано, знімок порожній (кеш на диску лишається).
// uid — підписатися на users/{uid}/…; проміс завершується після першого
// знімка з локального кешу (миттєво, і без інтернету)
setUser(uid: string | null): Promise<void>;
```

- Знімок `getSnapshot()` незмінний; `subscribe` сповіщає після кожного знімка Firestore і кожної оптимістичної зміни.
- Мутації застосовуються до знімка одразу й повертаються, не чекаючи сервера (research R4). Помилка запису не прокидається на екран (у dev — `[firestore] <код>` у лог).
- Мутація без поточного користувача відхиляється `Error('Користувач не ввійшов')`.
- `clear()` прибирається: дані акаунта видаляє `deleteAccountData` (нижче), вихід кеш не чистить.

## `LedgerRepository` (`src/services/ledger/types.ts`)

Сигнатури мутацій без змін (`addObject` повертає `LedgerObject` з локально згенерованим `id` одразу). `getSnapshot()` — `LedgerState` без сиріт (data-model). Реалізація — `src/services/ledger/firestore-ledger-repository.ts`; локальна (`local-ledger-repository.ts`) лишається для web і тестів, з `setUser` замість `load`.

## `OutageSettingsRepository` (`src/services/outages/settings-repository.ts`)

`getSnapshot(): OutageSettings` — обʼєднання `settings/outages` акаунта (`city`, `queues`) і `notifications` з `KeyValueStorage` пристрою. `save(settings)` пише `city`/`queues` у Firestore, а `notifications` — локально; тому екрани «Світла» й профілю не змінюються. Кеш графіків (`loadCachedSchedule`, `cacheSchedule`) — як зараз.

## `ProfileRepository` (`src/services/profile/types.ts`)

`syncFromAuth`, `setName` — ті самі правила (FR-012); документ `users/{uid}`. Перенесення імені з часів імітації читає старий ключ `userProfile` (research R7).

## Новий: стан даних акаунта

`src/services/account-data/` + `src/providers/account-data-provider.tsx` (усередині `AuthProvider`, обгортає `LedgerProvider`/`OutageProvider`/`ProfileProvider`).

```ts
type AccountDataStatus = 'loading' | 'offline' | 'ready';

// На кореневих екранах табів: скелетон / «Немає інтернету» / дані
function useAccountDataStatus(): { status: AccountDataStatus; retry: () => void };

// Для «Видалити акаунт»: серверна перевірка звʼязку, видалення всіх
// документів users/{uid}/** і самого users/{uid}, прапорця accountDataSynced.
// Відхиляється, якщо немає звʼязку або не вдалося; тоді нічого не видалено
// (або видалено частково — повторний виклик довидаляє)
function deleteAccountData(uid: string): Promise<void>;
```

Поведінка провайдера при зміні `user` з `useAuth()`:

1. `null` → `setUser(null)` у трьох репозиторіях.
2. `uid` → `setUser(uid)` у трьох репозиторіях (до першого знімка з кешу провайдер рендерить `null`, як зараз).
3. Якщо немає `accountDataSynced:{uid}` → `status = 'loading'`, серверне читання; успіх → перенесення даних попередньої версії (R7), прапорець, `ready`; `unavailable` → `offline`; `retry()` повторює крок 3.
4. Інакше → `ready` одразу.

## `AuthService.deleteAccount` (`src/services/auth/types.ts`)

```ts
// deleteData викликається після повторного підтвердження Apple (якщо
// потрібне) і до видалення акаунта; якщо він відхилився — акаунт не
// видаляється, відхиляється AuthError('failed')
deleteAccount(deleteData: () => Promise<void>): Promise<void>;
```

`useAuth().deleteAccount()` для екрана не змінює сигнатуру: `AuthProvider` сам передає `() => deleteAccountData(user.id)`.

## `AuthService.signOut`

Без змін; незбережені записи не блокують вихід (FR-017), черга акаунта лишається в SDK.
