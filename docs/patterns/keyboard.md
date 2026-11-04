# Клавіатура на екранах з полями

Еталон — `src/app/(tabs)/(objects)/object-form.tsx`. Так само зроблені `service-form.tsx`, `reading.tsx` і `amount.tsx`.

## Поведінка

- При відкритті екрана фокусу немає: `autoFocus` не ставимо.
- Клавіатура закривається лише по Enter («Готово») або тапу поза полями й кнопками. Свайп по скролу її не закриває.
- Тап по будь-якій частині поля (заголовок, відступи) ставить фокус в інпут.
- Перехід між полями не закриває клавіатуру.
- Над цифровими клавіатурами (`number-pad`, `decimal-pad`…) немає панелі з кнопкою «Done». `ThemedTextInput` для них не передає `returnKeyType`; клавіатура закривається тапом поза полями.
- Кнопка у футері при відкритій клавіатурі стоїть на 12pt над нею, а при закритій — як у дизайні (safe area знизу).
- Поле у фокусі автоматично прокручується над футером; контент можна догорнути до кінця.
- Це працює і на коротких екранах, де без клавіатури скрол вимкнений: `NavigationView` вмикає скрол уже при фокусі інпута (`useReanimatedFocusedInput`), ще до анімації клавіатури. Окремо на екранах нічого не робимо.
- Тап по полю-вибору, що відкриває шторку (наприклад, «Населений пункт»), спершу викликає `Keyboard.dismiss()`.

## Як зібрати екран

```tsx
const keyboardInsets = useFormFooterKeyboardInsets(hasHint); // до будь-яких early return

return (
  <KeyboardDismissView>
    <NavigationView title='…' {...keyboardInsets}>
      {/* ThemedTextInput … */}
    </NavigationView>

    <FormFooter hint={hasHint ? '…' : undefined}>
      <ActionButton title='Зберегти' … />
    </FormFooter>
  </KeyboardDismissView>
);
```

## Хто за що відповідає

| Частина | Файл | Що робить |
| --- | --- | --- |
| `KeyboardProvider` | `src/app/_layout.tsx` | Потрібен для `react-native-keyboard-controller` |
| `KeyboardDismissView` | `src/components/keyboard-dismiss-view.tsx` | Корінь екрана; тап поза полями закриває клавіатуру |
| `NavigationView` | `src/components/navigation-view.tsx` | `KeyboardAwareScrollView`, `keyboardShouldPersistTaps='handled'` за замовчуванням; скрол вмикається при фокусі інпута |
| `FormFooter` | `src/views/objects/form-footer.tsx` | `KeyboardStickyView` з відступом 12 над клавіатурою |
| `useFormFooterKeyboardInsets` | `src/views/objects/form-footer.tsx` | `bottomOffset` і `extraKeyboardSpace` для `NavigationView` під висоту футера |
| `ThemedTextInput` | `src/components/themed-text-input.tsx` | Тап по всьому полю фокусує інпут, `returnKeyType='done'` за замовчуванням |

## Не робити

- `keyboardDismissMode='interactive'` / `'on-drag'` на скролі форми.
- `returnKeyType` на `TextInput` з цифровою клавіатурою — iOS-реалізація RN тоді додає панель з «Done».
- `KeyboardAvoidingView` з `react-native` навколо форми — його роботу вже роблять `KeyboardAwareScrollView` і `KeyboardStickyView`.
- Окремий `KeyboardStickyView` навколо `FormFooter` — він уже всередині.

## Шторки (`BottomSheet`)

- Шторка має фіксовану висоту і не підстрибує над клавіатурою.
- Список у шторці доходить до низу; знизу йому додається `paddingBottom` — висота клавіатури (`useKeyboardHeight`) або safe area. Приклад: `src/views/objects/city-picker-sheet.tsx`.
- Список у шторці закриває клавіатуру при прокрутці (`keyboardDismissMode='on-drag'`).
- Шторка закривається тапом по фону, свайпом униз і кнопкою «Назад» — завжди з анімацією. Шторку зі скролом тягнуть лише за грабер (`dragByGrabberOnly`).
- Екран не розмонтовує шторку при закритті (не змінює їй `key` і не прибирає дані), а лише ставить `visible={false}` — інакше анімація закриття не встигне відпрацювати. Стан шторки скидають через `key`, що змінюється при відкритті.
