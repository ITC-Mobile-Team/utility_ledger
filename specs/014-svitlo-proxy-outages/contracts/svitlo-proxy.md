# Contract: svitlo-proxy (зовнішнє джерело)

`GET https://svitlo-proxy.svitlo-proxy.workers.dev/` — без параметрів, автентифікації й заголовків. Відповідь `200 application/json` (gzip).

```text
{
  date_today: "YYYY-MM-DD",
  date_tomorrow: "YYYY-MM-DD",
  regions: Array<{
    cpu: string,            // ідентифікатор регіону, напр. "kyiv", "lvivska-oblast"
    name_ua: string,
    schedule: null | {
      [queue: string]: {    // "1.1" | "1" | "60.1"
        [date: "YYYY-MM-DD"]: {
          [slot: "HH:MM"]: 0 | 1 | 2 | 3   // 48 ключів від "00:00" до "23:30"
        }
      }
    }
  }>
}
```

## Що вважаємо помилкою

| Ситуація | Поведінка |
|---|---|
| мережа недоступна, статус ≠ 200, невалідний JSON, немає `regions` | `fetchSchedule` кидає помилку → кеш + «показано збережений» або «Спробувати ще раз» |
| регіону з `cpu` немає у відповіді або `schedule: null` | помилка (регіон зник із джерела) |
| регіон є, але всі дні нульові | **не** помилка: `days: []`, на обох днях «Графік … не опубліковано» |

Розбір — чиста функція `parseSvitloRegion(payload, config, receivedAt) => OutageSchedule` (див. [data-model.md](../data-model.md)), без мережі й глобального стану.
