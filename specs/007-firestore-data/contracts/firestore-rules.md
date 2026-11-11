# Contract: правила безпеки Firestore

Файл `firestore.rules` у корені репозиторію; `firebase.json` посилається на нього (`"firestore": {"rules": "firestore.rules"}`), щоб правила можна було опублікувати `firebase deploy --only firestore:rules` або вставити в консолі (Firestore Database → Rules).

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

У `rules_version = '2'` шаблон `{document=**}` збігається й з нулем сегментів, тож правило покриває і сам документ профілю `users/{uid}`.

Гарантії (FR-003, SC-007):

- без входу — будь-який запит відхиляється;
- акаунт A не читає й не пише нічого під `users/B/…`;
- усе поза `users/` закрито (production mode за замовчуванням).

Перевірка — у [quickstart.md](../quickstart.md) (Rules Playground у консолі).
