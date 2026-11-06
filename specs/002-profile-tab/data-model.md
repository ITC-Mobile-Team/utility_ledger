# Data Model: Таб «Профіль»

## UserProfile (новий, ключ `userProfile`)

| Поле | Тип | Правила |
|---|---|---|
| `userId` | `string` | `AuthUser.id`; якщо після входу не збігається — профіль створюється заново |
| `name` | `string \| null` | редагується на «Ваше імʼя»; зберігається обрізаним (`trim`), 1–40 символів; `null` — провайдер не дав імені → UI «Без імені», ініціал «?» |
| `nameSource` | `'provider' \| 'user'` | `'user'` після першого збереження — тоді `syncFromAuth` імʼя більше не чіпає |
| `email` | `string \| null` | від провайдера, оновлюється при `syncFromAuth`; `null` → «Email не вказано»; адреса на `privaterelay.appleid.com` → «Прихована пошта Apple · <маска>» |
| `method` | `SignInMethod \| null` | `'apple' \| 'google'`; `null` для старих сесій → рядок «Спосіб входу» без іконки й підпису провайдера |

**Маска email**: перша літера локальної частини + `••••` + `@домен` (як у макеті `b••••@gmail.com`).

**Похідні значення** (не зберігаються): `initial` (R7), `displayName` (`name ?? 'Без імені'`), `providerName` («Apple» / «Google»), `providerSub` («Apple ID · вхід без пароля» / «Google-акаунт · вхід без пароля»).

### Стани й переходи

```text
(немає) ──signIn + syncFromAuth──▶ provider-name ──setName──▶ user-name
   ▲                                     │                       │
   └──────────── clear() (Вийти / Видалити акаунт) ◀─────────────┘
```

- `syncFromAuth(user)` для того самого `userId`: оновлює `email`, `method`; `name` оновлюється лише при `nameSource = 'provider'`.
- `setName(value)`: валідація (не порожнє після `trim`, ≤ 40), `nameSource = 'user'`; при помилці запису знімок не змінюється, помилка пробрасується екрану.

## AuthUser (змінено, ключ `authUser`)

| Поле | Зміна |
|---|---|
| `method?: SignInMethod` | нове, записується в `signIn(method)`; у старих даних відсутнє |

## OutageNotificationSettings (без змін, у `outageSettings`)

Профіль читає й змінює лише `enabled`. `leadMinutes` і `queues` лишаються як є.

## Маркер стирання (новий, ключ `pendingWipe`)

`'true'`, поки `wipeLocalData()` не завершилось. На старті: є маркер → довершити стирання до рендеру захищених маршрутів.

## Що стирає `wipeLocalData()`

| Ключ / дані | Через |
|---|---|
| `authUser` | `authService.signOut()` |
| заплановані сповіщення `outage:*` | `cancelOutageNotifications()` |
| `ledgerState` | `ledgerRepository.clear()` |
| `outageSettings`, `outageSchedule:<id>` для кожного постачальника з реєстру | `outageSettingsRepository.clear()` |
| `userProfile` | `profileRepository.clear()` |
| `hasSeenOnboarding` | `resetOnboarding()` |
| `pendingWipe` | останнім кроком |
