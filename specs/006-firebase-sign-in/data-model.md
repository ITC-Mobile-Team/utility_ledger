# Data Model: Справжній вхід, вихід і видалення акаунта

## AuthUser (`src/services/auth/types.ts`)

Знімок поточного користувача Firebase для застосунку.

| Поле | Тип | Джерело | Правила |
|---|---|---|---|
| `id` | `string` | Firebase `uid` | Незмінний; новий `id` = новий профіль у `syncFromAuth` |
| `name` | `string \| null` | `displayName` користувача Firebase; при першому вході Apple — `fullName` з відповіді Apple (і зберігається в `displayName`) | Може бути `null` (Apple при повторному вході, приховане імʼя) |
| `email` | `string \| null` | `email` користувача Firebase | Для Apple з «Приховати email» — адреса-пересилання `@privaterelay.appleid.com` |
| `method` | `'apple' \| 'google'` | `providerData[0].providerId`: `apple.com` → `apple`, `google.com` → `google` | Обовʼязкове для нових сесій |

## Session (стан `AuthProvider`)

```text
undefined (визначається) ──onAuthStateChanged(user)──▶ signedIn(AuthUser)
undefined ──onAuthStateChanged(null)──▶ signedOut
signedOut ──signIn(method) ok──▶ signedIn
signedOut ──signIn cancelled──▶ signedOut (без екрана помилки)
signedOut ──signIn failed──▶ signedOut + /auth-error
signedIn ──signOut()──▶ signedOut
signedIn ──deleteAccount() ok──▶ signedOut (акаунт видалено)
signedIn ──deleteAccount() cancelled | failed──▶ signedIn (акаунт лишається)
signedIn ──сесію відкликано/акаунт видалено деінде──▶ signedOut
```

- Поки стан `undefined`, `AuthProvider` нічого не рендерить (як зараз; сплеш лишається) — FR-009.
- Старий ключ сховища `authUser` (імітація) видаляється при створенні сервісу і не впливає на стан — FR-013.

## AuthError (`src/services/auth/types.ts`)

| `kind` | Коли | Реакція UI |
|---|---|---|
| `cancelled` | Користувач закрив вікно Apple/Google/Custom Tab (вхід або повторне підтвердження) | Нічого не показувати, кнопки знову доступні |
| `failed` | Будь-яка інша помилка (мережа, конфігурація, `auth/user-mismatch`, сервер) | Вхід → `/auth-error`; видалення → системний `Alert` «Не вдалося видалити акаунт» з «Спробувати ще» / «Скасувати» |

## UserProfile (`src/services/profile/types.ts`) — зміна правила

- `syncFromAuth(user)` для того самого `userId`: якщо `nameSource === 'provider'` і `user.name === null`, імʼя **не** змінюється (FR-012). Решта правил без змін.
- `syncFromAuth(user)` для нового `userId`: якщо попередній профіль належав імітації (`userId` починається з `preview-id-`) і `nameSource === 'user'`, його `name` переноситься з `nameSource: 'user'` (FR-013).
- `clear()` при видаленні акаунта **не** викликається (FR-022); профіль з новим `userId` створиться при наступному вході.

## Що не змінюється

Обʼєкти, послуги, показники (`ledger`), налаштування «Світла», тема, стартова вкладка, прапорець онбордингу, заплановані сповіщення — переживають і вихід, і видалення акаунта.
