import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { loadGloDraft } from '@/lib/glo-profile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokens } from '@/components/theme';

interface ProfileData {
  skin_type?: string;
  undertone?: string;
  goals?: string[];
  archetype?: string;
}

function formatSkinType(v?: string) {
  if (!v) return '—';
  return v.charAt(0).toUpperCase() + v.slice(1);
}

function formatUndertone(v?: string) {
  if (!v) return '—';
  return v.replace('_', ' ').replace(/^\w/, c => c.toUpperCase());
}

export default function ProfileRevealScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<ProfileData>({});
  const [goal, setGoal] = useState('');

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    loadGloDraft().then(d => {
      if (d) setProfile(d as ProfileData);
    });
    AsyncStorage.getItem('@remake_frequency').then(v => {
      if (v) setGoal(v.replace('_', ' '));
    });
  }, []);

  const rows = [
    { label: 'Skin type',   value: formatSkinType(profile.skin_type) },
    { label: 'Undertone',   value: formatUndertone(profile.undertone) },
    { label: 'Goal',        value: profile.goals?.[0] ? profile.goals[0].replace('_', ' ').replace(/^\w/, c => c.toUpperCase()) : '—' },
    { label: 'Style',       value: profile.archetype ? profile.archetype.charAt(0).toUpperCase() + profile.archetype.slice(1) : '—' },
  ];

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 32 }]}>
      <View style={[styles.top, { paddingTop: insets.top + 40 }]}>
        <Animated.View entering={ZoomIn.delay(100).duration(500)} style={styles.checkWrap}>
          <Text style={styles.checkIcon}>✓</Text>
        </Animated.View>

        <Animated.Text entering={FadeInUp.delay(240).duration(500)} style={styles.congrats}>
          Congratulations,
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(300).duration(500)} style={styles.title}>
          your beauty profile{'\n'}is ready!
        </Animated.Text>

        <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.card}>
          <Text style={styles.cardLabel}>Daily recommendation</Text>
          <Text style={styles.cardSub}>You can edit this anytime</Text>
          <View style={styles.rows}>
            {rows.map((r, i) => (
              <View key={r.label} style={[styles.row, i > 0 && styles.rowBorder]}>
                <Text style={styles.rowLabel}>{r.label}</Text>
                <Text style={styles.rowValue}>{r.value}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>

      <View style={{ flex: 1 }} />

      <Animated.View entering={FadeInUp.delay(600).duration(500)} style={styles.bottom}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/(onboarding)/notification-permission');
          }}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>Let's get started!</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.cream, paddingHorizontal: 28 },
  top: { alignItems: 'center' },
  checkWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: tokens.colors.pinkDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  checkIcon: { color: '#FFFFFF', fontSize: 28, fontWeight: '700' },
  congrats: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.pinkDeep,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: {
    fontFamily: tokens.fonts.serif,
    fontSize: 32,
    fontWeight: '400',
    color: tokens.colors.text,
    lineHeight: 42,
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.07)',
    padding: 20,
    alignSelf: 'stretch',
  },
  cardLabel: { fontFamily: tokens.fonts.regular, fontSize: 11, fontWeight: '700', color: tokens.colors.text, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 },
  cardSub: { fontFamily: tokens.fonts.regular, fontSize: 12, color: tokens.colors.gray, marginBottom: 16 },
  rows: { gap: 0 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
  rowLabel: { fontFamily: tokens.fonts.regular, fontSize: 14, fontWeight: '400', color: tokens.colors.gray },
  rowValue: { fontFamily: tokens.fonts.regular, fontSize: 14, fontWeight: '700', color: tokens.colors.text },
  bottom: {},
  cta: {
    backgroundColor: tokens.colors.pinkDeep,
    borderRadius: 50,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 7,
  },
  ctaText: { fontFamily: tokens.fonts.regular, fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
