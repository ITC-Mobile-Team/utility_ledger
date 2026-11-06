import { NavigationView, VStack } from '@/components';
import { usePreferences } from '@/providers/preferences-provider';
import { THEME_PREFERENCES } from '@/services/preferences';
import { ThemeOptionCard } from '@/views/profile';

// Вибір теми застосунку. Дотик застосовує тему одразу й лишає на екрані:
// результат видно відразу, «Назад» повертає в профіль
// (docs/patterns/pickers.md, «Налаштування з миттєвим застосуванням»)
export default function ThemeScreen() {
  const { theme, setTheme } = usePreferences();

  return (
    <NavigationView
      title='Тема'
      subtitle='Оформлення застосунку'
      barType='purple'
      cornerRadius={28}
      testID='theme.screen'
      contentInsets={{ top: 24, horizontal: 20, bottom: 32 }}
    >
      <VStack spacing={14} accessibilityRole='radiogroup'>
        {THEME_PREFERENCES.map((value) => (
          <ThemeOptionCard
            key={value}
            value={value}
            selected={theme === value}
            onSelect={setTheme}
          />
        ))}
      </VStack>
    </NavigationView>
  );
}
