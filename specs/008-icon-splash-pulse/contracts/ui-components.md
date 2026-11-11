# Contract: компоненти splash і пульсації

Інтерфейси нових і змінених компонентів. Тіла — на етапі реалізації.

## `src/components/pulse.tsx` (експорт через `src/components/index.ts`)

```ts
type PulseRingsProps = {
  // Ключ кольору теми (`ThemedView backgroundColor`)
  color: 'blueSoft2' | 'powerOnSoft' | 'line';
  // Діаметр кілець = розмір ілюстрації (кільця на весь контейнер, inset 0)
  size: number;
};
export function PulseRings(props: PulseRingsProps): ReactNode;

// Обгортка центральної плитки: масштаб 1 → 1.06 → 1 за 2,8 с
export function PulseCore(props: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>): ReactNode;

// true — екран у фокусі й у системі не ввімкнено «Зменшити рух»
export function usePulseActive(): boolean;
```

Гарантії:
- `PulseRings` ставиться першим дочірнім елементом контейнера ілюстрації (під колами), `pointerEvents="none"`, `aria-hidden` (`accessibilityElementsHidden`, `importantForAccessibility="no-hide-descendants"`).
- Неактивний (`usePulseActive() === false`): `PulseRings` рендерить `null`, `PulseCore` — масштаб 1; анімації скасовані (`cancelAnimation`).
- Анімуються лише `transform`/`opacity`; розмітка сусідів не змінюється.
- Shared values — лише через `get()`/`set()` (`docs/patterns/reanimated.md`).

## Зміни наявних компонентів

| Компонент | Зміна |
|---|---|
| `EmptyStateView` (`src/views/objects/empty-state-view.tsx`) | Контейнер 188: `PulseRings color='blueSoft2' size={188}` під колами; плитка 88 загорнута в `PulseCore`; бейдж «плюс» без анімації. API пропсів не змінюється. |
| `OutageMessage` (`src/views/outages/outage-message.tsx`) | Новий проп `pulse?: boolean` (за замовчуванням `false`). При `true`: `PulseRings` кольору `powerOnSoft` (`tone='power'`) або `line` (`tone='muted'`), плитка в `PulseCore`. |
| `OutagesScreen` (`src/app/(tabs)/(outages)/index.tsx`) | `pulse` для «Оберіть свою чергу» і «Постачальник … не доданий»; стани помилок — без. |
| `AccountDataOffline` (`src/views/account-data/account-data-offline.tsx`) | `PulseRings color='line'` розміру кола (120), коло з іконкою в `PulseCore`; і в `compact`. |

## `src/views/splash/` (експорт через `src/views/index.tsx`)

```ts
// Накладка анімованого splash. Рендерити один раз у корені, поверх навігатора,
// усередині AppProviders (потрібні useAuth і useAccountDataStatus).
export function AppSplash(): ReactNode;

// Чи можна згасати: мінімум 1000 мс від показу і (не увійшов ||
// status !== 'loading' || минуло 3000 мс). shownAt — момент, коли накладку
// показано й системний splash сховано; null — ще не показано (не згасати)
export function useSplashGate(shownAt: number | null): boolean;
```

Гарантії:
- Викликає `SplashScreen.hide()`, коли накладка розмічена (`onLayout`) **і** знак показано (`expo-image` `onDisplay`, запасний таймер 500 мс) — інакше на мить видно фон без знака; `PreferencesProvider` більше не ховає системний splash (лишається лише глобальний `preventAutoHideAsync()`).
- Перший кадр: фон `#14213A`, знак 132×132 по центру екрана — піксель у піксель із системним splash.
- Після згасання (300 мс) рендерить `null` і ставить модульний `splashFinished = true`; наступні монтування в тому ж процесі одразу `null`.
- Поки видимий — `StatusBar style="light"`, накладка перехоплює дотики; під час згасання `pointerEvents="none"`.
- testID: `splash` (контейнер), `splash.progress` (індикатор) — за схемою `docs/patterns/test-ids.md`.

## Розміщення в `src/app/_layout.tsx`

```tsx
<PreferencesProvider>
  <AppProviders>
    <RootNavigator />
    <AppSplash />
  </AppProviders>
</PreferencesProvider>
```
