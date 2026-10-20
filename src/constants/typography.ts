import { StyleSheet } from 'react-native';

const family = 'Onest';

export const typography = StyleSheet.create({
  display: {
    fontFamily: family,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 42,
    letterSpacing: -0.64,
  },
  title: {
    fontFamily: family,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -0.56,
  },
  amount: {
    fontFamily: family,
    fontSize: 38,
    fontWeight: '700',
    lineHeight: 50,
  },
  headline: {
    fontFamily: family,
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: -0.22,
  },
  section: {
    fontFamily: family,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  rowTitle: {
    fontFamily: family,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 21,
  },
  body: { fontFamily: family, fontSize: 15, fontWeight: '400', lineHeight: 22 },
  overline: {
    fontFamily: family,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.96,
  },
  label: {
    fontFamily: family,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  caption: {
    fontFamily: family,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 17,
  },
  button: {
    fontFamily: family,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  },
});
