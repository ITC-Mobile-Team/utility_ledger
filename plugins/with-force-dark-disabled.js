// Вимикає для Android-застосунку системне перетворення «force dark».
//
// Коли система в темній темі, Android (особливо MIUI) сам перефарбовує світлі
// поверхні: після вибору «Світла» застосунок на мить світлий, а потім знову
// темніє. Застосунок малює власну темну палітру, тож перетворенню тут нічого
// робити.
//
// Тему шукаємо лише за назвою: батьківська тут `Theme.AppCompat.DayNight`, а не
// `Light`, яку припускає хелпер `getAppThemeLightNoActionBarGroup()`, і передана
// інша `parent` переписала б її.
const { AndroidConfig, withAndroidStyles } = require('expo/config-plugins');

module.exports = function withForceDarkDisabled(config) {
  return withAndroidStyles(config, (stylesConfig) => {
    stylesConfig.modResults = AndroidConfig.Styles.assignStylesValue(
      stylesConfig.modResults,
      {
        add: true,
        parent: AndroidConfig.Styles.getAppThemeGroup(),
        name: 'android:forceDarkAllowed',
        value: 'false',
      },
    );

    return stylesConfig;
  });
};
