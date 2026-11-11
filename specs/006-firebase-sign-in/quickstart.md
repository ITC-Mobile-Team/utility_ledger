# Quickstart: ручна перевірка входу, виходу й видалення акаунта

Перевіряє користувач на своїх пристроях або симуляторі/емуляторі. Агент запускає лише lint і typecheck.

## 1. Налаштування Firebase і провайдерів (один раз)

1. Firebase → Authentication → Sign-in method: увімкнути **Google** і **Apple**.
2. **Android, Google**: Project settings → Android-застосунок `com.bogdanpoh.utilityledger` → додати SHA-1 і SHA-256 debug-ключа (`cd android && ./gradlew signingReport` після prebuild, або `keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android`) і release/EAS-ключа (`npx eas-cli@latest credentials`). Завантажити новий `google-services.json` у корінь проєкту — у ньому має зʼявитися `oauth_client` з `client_type: 1`.
3. **iOS, Apple**: Apple Developer → App ID `com.bogdanpoh.utility-ledger` → увімкнути Sign in with Apple.
4. **Android, Apple**: Apple Developer → Services ID, повʼязаний з App ID; return URL `https://utility-ledger-4b1aa.firebaseapp.com/__/auth/handler`; ключ Sign in with Apple. У Firebase → Apple: Services ID, Team ID `3S8AVD2TKW`, key ID, приватний ключ.

## 2. Збірка

```bash
npx expo prebuild --clean
```

```bash
npx expo run:ios --device
```

```bash
npx expo run:android
```

Або `npx eas-cli@latest build --profile development`. Sign in with Apple на iOS-симуляторі працює лише з увійденим Apple ID у Settings; надійніше — реальний пристрій.

## 3. Сценарії (очікуваний результат)

| # | Дія | Очікування | Spec |
|---|---|---|---|
| 1 | iOS: «Продовжити з Apple», підтвердити | онбординг або вкладки; у профілі імʼя/email; користувач у Firebase Console | US1, FR-001 |
| 2 | iOS: «Продовжити з Apple», «Скасувати» | лишаємося на «Вхід і реєстрація», без помилки | FR-005 |
| 3 | Android: «Продовжити з Apple» | сторінка Apple у браузері → повернення з виконаним входом; закрити браузер → без помилки | FR-003 |
| 4 | iOS і Android: «Продовжити з Google», обрати акаунт / закрити | вхід / лишаємося без помилки | US2 |
| 5 | Увійти, повністю закрити й запустити (і в авіарежимі) | вкладки без екрана входу | FR-008, FR-009 |
| 6 | «Вийти» → підтвердити; «Продовжити з Google» | екран входу; Google знову показує вибір акаунта; дані на місці, онбордингу немає | FR-010 |
| 7 | «Видалити акаунт» | текст «Акаунт і всі ваші дані буде видалено назавжди. Цю дію не можна скасувати.» | FR-017 |
| 8 | Apple-акаунт: «Видалити акаунт» → підтвердити → вікно Apple → підтвердити | екран входу; акаунта немає в консолі; iOS: застосунок зник у Settings → Apple ID → Sign in with Apple | FR-016, FR-018 |
| 9 | Google-акаунт, свіжий вхід: «Видалити акаунт» | без повторного вікна; екран входу; акаунта немає | FR-019 |
| 10 | Видалення → закрити вікно повторного підтвердження | лишаємося в профілі, увійшли | FR-020 |
| 11 | Видалення в авіарежимі | Alert «Не вдалося видалити акаунт», акаунт лишається | FR-021 |
| 12 | Після видалення увійти знову | новий акаунт у консолі; дані на пристрої лишились, онбордингу немає | FR-022 |
| 13 | Оновитися з версії з імітацією | екран входу; після входу дані й онбординг на місці | FR-013 |

## 4. Перевірки агентом

```bash
npx expo lint
```

```bash
npx tsc --noEmit
```
