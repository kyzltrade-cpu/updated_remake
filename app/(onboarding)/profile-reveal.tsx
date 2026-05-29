import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { tokens } from '@/components/theme';
import { ob } from '@/components/onboarding-styles';
import { GlassButton } from '@/components/glass-button';
import { loadGloDraft } from '@/lib/glo-profile';

interface ProfileRow {
  label: string;
  value: string;
}

function buildRows(
  skinType: string,
  undertone: string,
  allergies: string[],
  goal: string,
): ProfileRow[] {
  const goalLabels: Record<string, string> = {
    shade:       'Perfect shade match',
    ingredients: 'Avoid bad ingredients',
    discover:    'Personalised picks',
    money:       'Stop wasting money',
  };

  return [
    { label: 'Skin Type',    value: skinType   || 'Not set' },
    { label: 'Undertone',    value: undertone  || 'Not sure' },
    {
      label: 'Sensitivities',
      value: allergies.length > 0
        ? allergies.slice(0, 2).join(' · ') + (allergies.length > 2 ? ` +${allergies.length - 2}` : '')
        : 'None flagged',
    },
    { label: 'Goal',         value: goalLabels[goal] || 'Personalised results' },
  ];
}

export default function ProfileRevealScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [rows, setRows] = useState<ProfileRow[]>([]);

  useEffect(() => {
    const load = async () => {
      const [draft, goal] = await Promise.all([
        loadGloDraft(),
        AsyncStorage.getItem('@remake_onboarding_goal'),
      ]);
      setRows(buildRows(
        draft.skin_type ?? '',
        draft.undertone_guess ?? '',
        draft.allergies ?? [],
        goal ?? '',
      ));
    };
    load();
  }, []);

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(onboarding)/notification-permission');
  };

  return (
    <View style={[ob.rootDark, styles.root, { paddingBottom: insets.bottom + 40 }]}>
      {/* Eyebrow */}
      <Animated.Text entering={FadeIn.delay(80).duration(600)} style={ob.eyebrowGold}>
        Your Scanner Is Ready ✦
      </Animated.Text>

      {/* Title */}
      <Animated.Text entering={FadeInUp.delay(180).duration(500)} style={ob.titleDark}>
        Personalised{'\n'}just for you.
      </Animated.Text>

      {/* Profile rows */}
      <View style={styles.rows}>
        {rows.map((row, i) => (
          <Animated.View
            key={row.label}
            entering={FadeInUp.delay(280 + i * 80).duration(400)}
            style={styles.row}
          >
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Text style={styles.rowValue}>{row.value}</Text>
          </Animated.View>
        ))}
      </View>

      {/* Blurred preview card */}
      <Animated.View entering={FadeInUp.delay(620).duration(400)} style={styles.preview}>
        <Text style={styles.previewEye}>🔒</Text>
        <View style={styles.previewLines}>
          <View style={[styles.shimmer, { width: '70%' }]} />
          <View style={[styles.shimmer, { width: '50%' }]} />
          <View style={[styles.shimmer, { width: '85%' }]} />
        </View>
      </Animated.View>

      <Animated.Text entering={FadeInUp.delay(680).duration(400)} style={styles.lockNote}>
        Unlock full ingredient breakdowns, shade match scores,{'\n'}and personalised product picks.
      </Animated.Text>

      <View style={ob.spacer} />

      <Animated.View entering={FadeInUp.delay(720).duration(400)} style={ob.bottom}>
        <GlassButton
          title="See My Full Results"
          onPress={handleContinue}
          variant="primary"
          style={styles.cta}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingTop: 72,
  },
  rows: {
    marginTop: 28,
    gap: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderLeftWidth: 3,
    borderLeftColor: tokens.colors.pinkDeep,
  },
  rowLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  rowValue: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    maxWidth: '60%',
    textAlign: 'right',
  },
  preview: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  previewEye: {
    fontSize: 22,
    opacity: 0.5,
  },
  previewLines: {
    flex: 1,
    gap: 8,
  },
  shimmer: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 4,
  },
  lockNote: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 12,
  },
  cta: {
    width: '100%',
  },
});
