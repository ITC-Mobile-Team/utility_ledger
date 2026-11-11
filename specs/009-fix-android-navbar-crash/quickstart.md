# Quickstart: перевірка виправлення краху на Android

## Передумови

- Development build уже встановлено на Android-емулятор (`adb devices` показує `emulator-5554`) і в iOS Simulator.
- Metro запущено: `npx expo start --dev-client`.
- `adb reverse tcp:8081 tcp:8081`.

## Android (US1, US2, SC-001, SC-002)

1. Очистити лог крахів: `adb logcat -c -b crash`.
2. Відкрити застосунок у development build:
   `adb shell am start -a android.intent.action.VIEW -d "exp+utilityledger://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081" com.bogdanpoh.utilityledger`
3. Очікування: після splash видно перший екран (список об'єктів або вхід), без екрана «There was a problem loading the project».
4. Пройти всі вкладки й екрани з рядом великих кнопок (об'єкт, місяць тощо): прогорнути ряд убік, натиснути кнопку, повернутися назад, згорнути й розгорнути застосунок, повернути екран.
5. 10 холодних запусків (`adb shell am force-stop com.bogdanpoh.utilityledger`, потім крок 2).
6. `adb logcat -d -b crash` — порожньо, жодного `ScrollViewMarker` у `adb logcat -d | grep RNScreens`.

## Android release (SC-004)

- `npx expo run:android --variant release` і відкрити екран з рядом кнопок — без краху.

## iOS (US3, SC-003)

1. На місяці з десятьма сервісами відкрити екран з клавіатурою і прокруткою, повернутися назад.
2. Очікування: градієнт навбару тягнеться до кнопок, світлої смуги над рядом немає.
3. `ui-check` `navbar.flow` проходить.

## Реальний пристрій

- Встановити або оновити збірку на пристрої користувача, відкрити застосунок — без краху (фінальна ручна перевірка).
