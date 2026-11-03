import { useFocusEffect } from 'expo-router';
import { createContext, use, useCallback } from 'react';

type TabBarContextValue = {
  setTabBarHidden: (hidden: boolean) => void;
};

export const TabBarContext = createContext<TabBarContextValue>({
  setTabBarHidden: () => {},
});

// Ховає нативний таб-бар, поки екран у фокусі (форми з кнопкою знизу)
export function useHideTabBar() {
  const { setTabBarHidden } = use(TabBarContext);
  useFocusEffect(
    useCallback(() => {
      setTabBarHidden(true);
      return () => setTabBarHidden(false);
    }, [setTabBarHidden]),
  );
}
