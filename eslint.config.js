// https://docs.expo.dev/guides/using-eslint/
const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    // Кнопки лише через Pressable з @/components: він не дає тапнути двічі
    // поспіль (docs/patterns/buttons.md)
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/components/pressable.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: [
                'Pressable',
                'TouchableOpacity',
                'TouchableHighlight',
                'TouchableWithoutFeedback',
                'Button',
              ],
              message:
                'Використовуй Pressable з @/components — він блокує повторні тапи.',
            },
            {
              name: 'react-native-gesture-handler',
              importNames: [
                'Pressable',
                'TouchableOpacity',
                'TouchableHighlight',
                'TouchableWithoutFeedback',
                'RectButton',
                'BorderlessButton',
                'BaseButton',
              ],
              message:
                'Використовуй GesturePressable з @/components — він блокує повторні тапи.',
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    'dist/*',
    'ios/*',
    'android/*',
    'example/*',
    'Claude outputs/*',
    '.expo/*',
  ]),
]);
