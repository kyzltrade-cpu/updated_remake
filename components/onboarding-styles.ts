import { StyleSheet } from 'react-native';
import { tokens } from '@/components/theme';

/**
 * Shared styles for all onboarding screens.
 * Import as: import { ob } from '@/components/onboarding-styles'
 * Every onboarding screen uses these — never define equivalent styles inline.
 */
export const ob = StyleSheet.create({
  // ── Roots ────────────────────────────────────────────────────────────────
  root: {
    flex: 1,
    backgroundColor: tokens.colors.cream,
    paddingHorizontal: 28,
  },
  rootDark: {
    flex: 1,
    backgroundColor: tokens.colors.darkBg,
    paddingHorizontal: 28,
  },

  // ── Header block (title + subtitle) ───────────────────────────────────────
  header: {
    marginBottom: 28,
  },
  eyebrow: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: tokens.colors.pinkDeep,
    marginBottom: 12,
  },
  eyebrowGold: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: tokens.colors.gold,
    marginBottom: 12,
  },
  title: {
    fontFamily: tokens.fonts.serif,
    fontSize: 34,
    fontWeight: '400',
    color: tokens.colors.text,
    lineHeight: 44,
    marginBottom: 8,
  },
  titleDark: {
    fontFamily: tokens.fonts.serif,
    fontSize: 34,
    fontWeight: '400',
    color: '#FFFFFF',
    lineHeight: 44,
    marginBottom: 8,
  },
  titleItalicDark: {
    fontFamily: tokens.fonts.serif,
    fontSize: 34,
    fontStyle: 'italic',
    fontWeight: '400',
    color: '#FFFFFF',
    lineHeight: 44,
    marginBottom: 8,
  },
  sub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '300',
    color: tokens.colors.gray,
    lineHeight: 22,
  },
  subDark: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 22,
  },

  // ── Layout helpers ─────────────────────────────────────────────────────────
  spacer: {
    flex: 1,
    minHeight: 24,
  },
  options: {
    gap: 10,
  },

  // ── Bottom area (CTA + skip) ───────────────────────────────────────────────
  bottom: {
    gap: 12,
  },
  skipLink: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '400',
    color: tokens.colors.gray,
    textAlign: 'center',
  },
  footnote: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    fontWeight: '400',
    color: tokens.colors.grayLight,
    textAlign: 'center',
  },

  // ── Permission screen centred layout ──────────────────────────────────────
  permIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: tokens.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 32,
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 3,
  },
  permIconText: {
    fontSize: 36,
  },
  permHeader: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 10,
  },
  permTitle: {
    fontFamily: tokens.fonts.serif,
    fontSize: 28,
    fontWeight: '400',
    color: tokens.colors.text,
    textAlign: 'center',
    lineHeight: 38,
  },
  permBody: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '300',
    color: tokens.colors.gray,
    textAlign: 'center',
    lineHeight: 23,
    maxWidth: 300,
  },
  permBullets: {
    gap: 8,
    alignSelf: 'stretch',
  },
  permBullet: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '300',
    color: tokens.colors.gray,
    lineHeight: 20,
  },
});
