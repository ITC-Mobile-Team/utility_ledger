# testID для UI-перевірок

UI-сценарії (`.claude/skills/ui-check`) знаходять елементи за `testID` — на iOS він стає accessibility identifier. Без нього сценарій тримається за тексти, які ламаються від правки копірайту чи перекладу.

## Правила

- Ставимо `testID` на те, з чим взаємодіє або що перевіряє сценарій: кнопки й рядки, поля вводу, кнопки дій у порожньому стані та корінь екрана (`NavigationView` передає `testID` своєму скролу — `екран.screen`).
- Схема: `екран.компонент.елемент` у camelCase — `objects.nav.add`, `objectForm.name`, `outageSettings.queue.1.1`.
- Елементи списків з даними користувача — за індексом (`objects.card.0`, `month.meter.0`, `services.row.0`): сценарій не знає згенерованих id. Елементи з природним ключем — за ним: місяць `object.month.2026-11`, черга `outages.queue.1.1`.
- `testID` ставимо на сам `Pressable`, а не на `Text` усередині: `Pressable` — один accessible-елемент, і дочірні тексти в дереві окремо не видно.
- Прихований `TextInput` (opacity 0, як у барабані показника й великій сумі) iOS у дерево не включає. `testID` ставимо на видимий блок, який ставить фокус (`MeterReadingInput`, `AmountInput` роблять це самі).
- Кнопкам, які не `ActionButton`/`TextButton`, додаємо `accessibilityRole="button"` — тоді вони і для VoiceOver кнопки, і в дереві `role=button`.
- Нативні таби (`role=tab`) шукаємо за `label`, testID на них не ставимо.
- `testID` не перекладаємо і не формуємо з тексту — лише з назви екрана й даних.

## Як передати testID у спільні компоненти

| Компонент | Як |
|---|---|
| `ActionButton`, `TextButton`, `TransparentActionButton`, `ThemedTextInput`, `Pressable` | проп `testID` |
| Кнопки навбару | поле `testID` у `NavigationBarButtonItem` (`екран.nav.<id>`); кнопки входять у великий блок навбару: коли він згорнутий більше ніж наполовину (`p ≥ 0.5`), блок прибраний з дерева доступності, тож у згорнутому навбарі testID кнопок немає, а в розгорнутому кожен трапляється один раз |
| `NavigationBarIconButton`, `NavigationBarChip`, `ListRow`, `ObjectCard` | проп `testID` |
| `Segment`, `RadioGroup` | проп-префікс `testID` → варіанти `${testID}.${value}` |
| `SwipeAction` | поле `testID` (`…row.0.delete`) |
| `EmptyStateView` | `actionTestID` для кнопки дії |
| `MeterReadingInput`, `AmountInput` | проп `testID` на видимому блоці |
| Кнопка «Назад» у навбарі | завжди `navigationBar.back` |

## Префікси екранів

`welcome`, `signIn`, `onboarding`, `objects`, `objectForm`, `objectAdded`, `object`, `month`, `reading`, `amount`, `services`, `serviceForm`, `monthPicker`, `cityPicker`, `outages`, `outageSettings`, `profile`, `theme`, `editName`, `privacy`, `terms`, `undoToast`, `navigationBar`.

## Профіль і тема

- `profile.card` — інформаційна картка, **не інтерактивна** (дотик нічого не відкриває); `profile.name` — рядок «Імʼя», єдиний перехід у «Ваше імʼя».
- `profile.outageStatus` і `profile.outageSetup` — статус «Світла» та кнопка «Налаштувати» у «Сповіщеннях» (є лише поки «Світло» не налаштоване); `profile.notify` — перемикач.
- `profile.startTab` і `profile.theme` — рядки розділу «Застосунок». На iOS `profile.startTab` — `accessibilityIdentifier` нативного меню (`@expo/ui` не підтримує `testID`), пункти меню без id: шукай `role=button&label=Світло`.
- `objects.skeleton`, `outages.skeleton`, `profile.skeleton` — скелетони першого завантаження даних акаунта (не інтерактивні); `accountData.offline` і `accountData.offline.retry` — стан «Немає інтернету» і кнопка «Спробувати ще» (див. [user-data.md](user-data.md)).
- `theme.screen` і `theme.option.system|light|dark` — екран «Тема» та його картки (`role=radio`, стан у `value`: `radio button, checked`).
