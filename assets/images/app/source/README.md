# Вихідні SVG іконки й splash

Джерело правди для PNG у `assets/images/app/`. Геометрія — з артбордів канвасу (`docs/design.md`):
«Іконка застосунку · 1024×1024» (`AppIcon.dc.html`) і «00 · Splash» (`Splash.dc.html`).

| SVG | PNG | Що це |
|---|---|---|
| `icon-full.svg` | `icon.png` | Повна іконка, як в артборді: градієнт `#2B3A52` → `#0B1424`, відблиск, довга тінь, білий будинок, блискавка кольором тла |
| `android-background.svg` | `android-icon-background.png` | Тло адаптивної іконки: градієнт, відблиск, тінь і «латка» градієнта під вирізом блискавки, у тому ж масштабі, що й передній план |
| `android-foreground.svg` | `android-icon-foreground.png` | Передній план: білий будинок, блискавка — прозорий виріз |
| `android-monochrome.svg` | `android-icon-monochrome.png` | Тематична іконка Android 13+: той самий силует |
| `splash-mark.svg` | `splash-icon.png` | Знак для splash: будинок артборда «00 · Splash» (полотно 132) у масштабі 1024/288, тобто 132 pt при `imageWidth: 288` |

Бандл iOS `assets/app.icon` (Icon Composer) має ті самі контури: `Assets/house.svg` — будинок у масштабі артборда, `Assets/shadow.svg` — тінь; градієнт тла задано в `icon.json`.

## Правила розмірів

- Обводки артборда (будинок 44, блискавка 14; у splash 10 і 3) перетворені на контури з заокругленими кутами, щоб виріз блискавки був однією фігурою (`fill-rule="evenodd"`).
- Адаптивна іконка: будинок разом з кутами вписаний у безпечне коло 66 dp із 108 dp (з запасом 4 %), тож жодна маска лаунчера його не обрізає.
- Splash: знак ≈ 42 % ширини полотна по центру — вміщується в коло 192 dp, яким Android 12+ обрізає іконку 288 dp.

## Як перегенерувати PNG

```bash
swiftc -O scripts/render-icons.swift -o /tmp/render-icons && /tmp/render-icons
```

Запускати з кореня проєкту (`swift scripts/render-icons.swift` в режимі інтерпретатора падає в AppKit, тому скрипт компілюється). Після зміни іконки чи знака — `npx expo prebuild --clean` і нова нативна збірка (див. `docs/patterns/splash.md`).

## Повноекранний splash iOS

`splash-full-ios.svg` → `splash-full-ios.png` (1206×2622, тобто 402×874 pt @3x): градієнт накладки `AppSplash` (`#2B3A52` → `#14213A` → `#0B1424`, зупинки 0 / .48 / 1, `x1 .32 y1 0 → x2 .68 y2 1` — ті самі `start/end`, що в `LinearGradient`) і знак із `splash-mark.svg` розміром 132 pt по центру. iOS показує його на весь екран із `cover` (`enableFullScreenImage_legacy`), тож системний splash має той самий градієнт, що й накладка. Android 12+ повноекранного зображення не підтримує — там знак `splash-icon.png` на `#14213A`.
