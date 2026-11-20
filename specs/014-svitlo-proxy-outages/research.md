# Research: Графіки відключень для інших міст (svitlo-proxy)

Перевірено живими запитами 19–20.11.2026.

## R1. Формат svitlo-proxy

**Decision**: один `GET https://svitlo-proxy.svitlo-proxy.workers.dev/` без параметрів і ключів. Відповідь (~5 КБ gzip, ~320 КБ JSON):

```text
{ date_today: "2026-11-20", date_tomorrow: "2026-11-21",
  regions: [ { cpu: "kyiv", name_ua: "Київ", schedule: { "<черга>": { "<YYYY-MM-DD>": { "00:00": 1, "00:30": 2, … 48 ключів } } } | null } ] }
```

Коди слотів: `1` — світло є, `2` — вимкнено, `0` — даних немає, `3` — трапився лише в Миколаївській області (8 слотів). У всіх регіонах «завтра», поки графік не оголошено, — усі 48 слотів кожної черги `0`; Волинська, Львівська, Рівненська, Тернопільська, Івано-Франківська зараз мають `0` на обидва дні. Частково нульових днів (і `0`, і інші коди) не трапилось.

**Rationale**: `0` по всьому дню = «графік не опубліковано» (підтверджено: завтрашні дні всіх регіонів, поки обленерго не оголосило графік). `3` трактуємо як `maybe` (рішення в spec, Assumptions). Частковий `0` усередині дня — теж `maybe`, щоб не обіцяти світло.

**Alternatives considered**: Yasno API (лише Київ/Дніпро), GitHub-репозиторії Baskerville42 / yaroslav2901 (частина регіонів, нерівне оновлення), власний парсинг сайтів обленерго (Incapsula/Cloudflare, графіки картинками й текстом новин) — відкинуто в порівнянні 19.11.

## R2. Звірка з офіційними джерелами

- Київ: черги 1.1, 2.1, 30.1 на 19.11 — слот у слот з Yasno (`app.yasno.ua/…/regions/25/dsos/902/planned-outages`).
- Полтава: проміжки вимкнень збігаються з POE, але слоти POE `gpv-s3` (перемикання) у svitlo-proxy стали `2`. Тому Полтава й Кременчук лишаються на POE (FR-002).
- Правильність решти регіонів перевіряє користувач (quickstart.md, крок 4).

## R3. Час оновлення й заголовки

У відповіді немає часу оновлення графіка, `ETag`, `Last-Modified` чи `Cache-Control`; є `access-control-allow-origin: *`. **Decision**: «Перевірено о HH:MM» з `fetchedAt` у поясі постачальника (уточнення 4). `fetchedAt` — час, коли застосунок справді отримав відповідь з мережі, а не час читання з памʼяті.

## R4. Один запит на всі міста

**Decision**: модуль `svitlo-proxy.ts` тримає в памʼяті останню відповідь з часом отримання і проміс запиту в польоті. `fetchSchedule` будь-якого міста:
1. якщо є запит у польоті — чекає його;
2. якщо відповідь у памʼяті молодша за `SCHEDULE_TTL_MS` (2 хв) і виклик не з pull-to-refresh — розбирає її;
3. інакше — новий запит.

Pull-to-refresh мусить іти в мережу (патерн `outage-providers.md`). Сигнатура `fetchSchedule(signal)` не знає про refresh, тож: TTL перевіряє вже `useOutageSchedule` за кешем `providerId`; для нового міста кеш порожній → `fetchSchedule` → памʼять (SC-005). Для pull-to-refresh додається необовʼязковий параметр `options?: { force?: boolean }` у `OutageProvider.fetchSchedule` — POE його ігнорує.

**Alternatives**: окремий запит на кожне місто (простіше, але зайвий трафік при перемиканні міст); спільний ключ кешу в AsyncStorage на всю відповідь (ламає контракт `loadCachedSchedule(providerId)` і модель «кеш на постачальника»).

`AbortSignal`: спільний запит не скасовується сигналом одного виклику — кожен виклик лише перестає чекати (`signal` → reject), а запит доходить і кладеться в памʼять.

## R5. Привʼязка міст до регіонів і обленерго

| Місто | `cpu` регіону | Назва постачальника | Сайт для пошуку черги | Черги |
|---|---|---|---|---|
| Київ | `kyiv` | ДТЕК Київські електромережі | https://www.dtek-kem.com.ua/ua/shutdowns | 1.1…60.1 |
| Біла Церква | `kiivska-oblast` | ДТЕК Київські регіональні електромережі | https://www.dtek-krem.com.ua/ua/shutdowns | 1.1…6.2 |
| Дніпро | `dnipropetrovska-oblast` | ДТЕК Дніпровські електромережі | https://www.dtek-dnem.com.ua/ua/shutdowns | 1.1…6.2 |
| Одеса | `odeska-oblast` | ДТЕК Одеські електромережі | https://www.dtek-oem.com.ua/ua/shutdowns | 1.1…6.2 |
| Харків | `harkivska-oblast` | Харківобленерго | https://oblenergo.kharkiv.ua/ | 1.1…6.2 |
| Львів | `lvivska-oblast` | Львівобленерго | https://poweron.loe.lviv.ua/ | 1.1…6.2 |
| Запоріжжя | `zaporizka-oblast` | Запоріжжяобленерго | https://www.zoe.com.ua/outage/ | 1.1…6.2 |
| Вінниця | `vinnitska-oblast` | Вінницяобленерго | https://www.voe.com.ua/ | 1.1…6.2 |
| Чернігів | `chernigivska-oblast` | Чернігівобленерго | https://chernihivoblenergo.com.ua/blackouts | 1.1…6.2 |
| Черкаси | `cherkaska-oblast` | Черкасиобленерго | https://www.cherkasyoblenergo.com/static/perelik-gpv | 1.1…6.2 |
| Суми | `sumska-oblast` | Сумиобленерго | https://www.soe.com.ua/ | 1.1…6.2 |
| Житомир | `jitomirska-oblast` | Житомиробленерго | https://www.ztoe.com.ua/unhooking-search.php | 1.1…6.2 |
| Хмельницький | `hmelnitska-oblast` | Хмельницькобленерго | https://hoe.com.ua/page/pogodinni-vidkljuchennja | 1.1…6.2 |
| Рівне | `rivnenska-oblast` | Рівнеобленерго | https://www.roe.vsei.ua/disconnections | 1.1…6.2 |
| Луцьк | `volinska-oblast` | Волиньобленерго | https://energy.volyn.ua/spozhyvacham/perervy-u-elektropostachanni/hrafik-vidkliuchen/ | 1.1…6.2 |
| Тернопіль | `ternopilska-oblast` | Тернопільобленерго | https://www.toe.com.ua/ (з curl не відповів — звірити в браузері) | 1.1…6.2 |
| Івано-Франківськ | `ivano-frankivska-oblast` | Прикарпаттяобленерго | https://oe.if.ua/uk | 1.1…6.2 |
| Ужгород | `zakarpatska-oblast` | Закарпаттяобленерго | https://zakarpat.energy/customers/break-in-electricity-supply/schedule/ | 1.1…6.2 |
| Чернівці | `chernivetska-oblast` | Чернівціобленерго | https://oblenergo.cv.ua/shutdowns/ | 1…12 |
| Кропивницький | `kirovogradska-oblast` | Кіровоградобленерго | https://kiroe.com.ua/electricity-blackout/schedule | 1.1…6.2 |
| Миколаїв | `mikolaivska-oblast` | Миколаївобленерго | https://off.energy.mk.ua/ | 1.1…6.2 |

Херсон (`hersonska-oblast`) — `schedule: null`, у реєстр не додається. Донецька й Луганська області, Крим — міст у списку немає.

**Decision щодо черг**: статичний список у конфігурації кожного регіону (екран налаштувань бере `provider.queues` синхронно, до будь-якого запиту). Якщо у відповіді черга, якої немає в конфігурації, — ігнорується; якщо черги з конфігурації немає у відповіді — для неї «графік не опубліковано».

## R6. Підпис про джерело

**Decision**: необовʼязкове поле `OutageProvider.dataSource?: { name: string; url: string }`; екран налаштувань показує підпис, коли поле є (уточнення 3). POE поля не має.

## R7. Тести

У проєкті немає тестового раннера (jest не встановлено), і фіча його не додає. Чисту функцію `parseSvitloRegion` перевіряємо разовим скриптом на збереженій відповіді під час реалізації (як `parsePoltavaSchedule`), а екрани — сценарієм `ui-check` (`outages.flow`) і ручною звіркою з сайтами обленерго.

## R8. Нативні зміни

Нових залежностей і нативних модулів немає (`fetch` уже використовується POE) — доставляється OTA, development build не потрібна.
