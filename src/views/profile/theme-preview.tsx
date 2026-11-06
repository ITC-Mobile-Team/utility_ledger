import {
  colors,
  gradientLocations,
  gradients,
  type AppColor,
} from '@/constants/colors';
import type { ThemePreference } from '@/services/preferences';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

type Scheme = 'light' | 'dark';

export const THEME_PREVIEW_HEIGHT = 112;

function MiniRow({ scheme }: { scheme: Scheme }) {
  const palette = colors[scheme];
  return (
    <View style={[styles.row, { backgroundColor: palette.surface }]}>
      <View style={[styles.dot, { backgroundColor: palette.blue }]} />
      <View
        style={[styles.bar, styles.flex, { backgroundColor: palette.faint }]}
      />
      <View
        style={[styles.bar, styles.short, { backgroundColor: palette.faint }]}
      />
    </View>
  );
}

// Мініатюра екрана в палітрі однієї теми: фіолетова шапка, два рядки й
// плаваюча капсула таб-бару. Кольори беремо з палітр напряму, а не з
// useThemeColor, бо в темному застосунку світла мініатюра лишається світлою
function MiniApp({ scheme }: { scheme: Scheme }) {
  const palette = colors[scheme];
  const tabDots: AppColor[] = ['blue', 'faint', 'faint', 'faint'];
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.bg }]}>
      <LinearGradient
        colors={gradients[scheme].heroPurple}
        locations={gradientLocations}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.title} />
        <View style={styles.subtitle} />
      </LinearGradient>
      <View style={styles.rows}>
        <MiniRow scheme={scheme} />
        <MiniRow scheme={scheme} />
      </View>
      <View
        style={[
          styles.tabBar,
          { backgroundColor: palette.surface, borderColor: palette.line },
        ]}
      >
        {tabDots.map((color, index) => (
          <View
            key={index}
            style={[styles.tabDot, { backgroundColor: palette[color] }]}
          />
        ))}
      </View>
    </View>
  );
}

type ThemePreviewProps = {
  preference: ThemePreference;
};

// Для «Як у системі» ліва половина світла, права темна: так видно, що
// застосунок іде за системою
export function ThemePreview({ preference }: ThemePreviewProps) {
  return (
    <View style={styles.frame} accessibilityElementsHidden>
      <MiniApp scheme={preference === 'dark' ? 'dark' : 'light'} />
      {preference === 'system' && (
        <View style={styles.darkHalf}>
          {/* 200% від половини — повна ширина картки, закріплена праворуч */}
          <View style={styles.darkFull}>
            <MiniApp scheme='dark' />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: THEME_PREVIEW_HEIGHT,
    borderRadius: 14,
    borderCurve: 'continuous',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128,128,128,0.4)',
  },
  darkHalf: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '50%',
    overflow: 'hidden',
  },
  darkFull: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '200%',
  },
  hero: {
    height: 50,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderCurve: 'continuous',
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 7,
  },
  title: {
    width: 74,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  subtitle: {
    width: 118,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  rows: {
    marginTop: 10,
    marginHorizontal: 16,
    gap: 6,
  },
  row: {
    height: 24,
    borderRadius: 9,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 9,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  bar: {
    height: 5,
    borderRadius: 3,
  },
  flex: {
    flex: 1,
  },
  short: {
    width: 22,
  },
  tabBar: {
    position: 'absolute',
    left: 36,
    right: 36,
    bottom: 9,
    height: 18,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
  },
  tabDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
