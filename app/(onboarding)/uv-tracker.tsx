import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingHeader } from '@/components/onboarding-header';
import { tokens } from '@/components/theme';
import { type UVData, type HourlyUV, fetchUVIndex } from '@/lib/uv';

const { width: SW } = Dimensions.get('window');

const UV_HOURS: HourlyUV[] = [
  { hour: '6am',  uvi: 0, safe: true  },
  { hour: '8am',  uvi: 1, safe: true  },
  { hour: '10am', uvi: 3, safe: true  },
  { hour: '12pm', uvi: 7, safe: false },
  { hour: '2pm',  uvi: 9, safe: false },
  { hour: '4pm',  uvi: 5, safe: false },
  { hour: '6pm',  uvi: 2, safe: true  },
];

const MAX_UVI = 10;

const BAR_AREA_H = 64;
const LABEL_H    = 16;

function UvChart({ forecast }: { forecast?: HourlyUV[] }) {
  const data = forecast || UV_HOURS;
  return (
    <View style={styles.uvChart}>
      {data.map((h) => {
        const barH = Math.max(4, (h.uvi / MAX_UVI) * BAR_AREA_H);
        return (
          <View key={h.hour} style={styles.uvBar}>
            {/* Bar area — fills fixed height, bar grows from bottom */}
            <View style={styles.uvBarArea}>
              <View
                style={[
                  styles.uvBarFill,
                  { height: barH },
                  h.safe ? styles.uvBarSafe : styles.uvBarDanger,
                ]}
              />
            </View>
            {/* Label in normal flow below bar area — never overlaps */}
            <Text style={styles.uvBarLabel}>{h.hour}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function UvTrackerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [chosen, setChosen] = useState<'yes' | 'no' | null>(null);
  const [uv, setUV] = useState<UVData | null>(null);
  const handledRef = useRef(false);

  // Reset every time the screen comes into focus (including back-navigation)
  useFocusEffect(useCallback(() => {
    handledRef.current = false;
    setChosen(null);
  }, []));

  useEffect(() => {
    let active = true;
    async function loadUV() {
      try {
        const data = await fetchUVIndex();
        if (active) {
          setUV(data);
        }
      } catch (err) {
        console.warn('Failed to fetch onboarding UV data:', err);
      }
    }
    loadUV();
    return () => { active = false; };
  }, []);

  const advance = () => router.push('/(onboarding)/motivation');

  const handleChoice = (choice: 'yes' | 'no') => {
    if (handledRef.current) return;
    handledRef.current = true;
    setChosen(choice);
    Haptics.selectionAsync();
    AsyncStorage.setItem('@remake_uv_tracker', choice);
    advance();
  };

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 32 }]}>
      <OnboardingHeader step={16} total={18} onBack={() => router.back()} />

      <View style={styles.body}>
        <Animated.Text entering={FadeInUp.delay(80).duration(500)} style={styles.eyebrow}>
          OPTIONAL FEATURE
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(160).duration(500)} style={styles.title}>
          {'Add a UV &\ntanning window\ntracker?'}
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(220).duration(500)} style={styles.sub}>
          REMAKE tells you the safest window to tan each day, personalised to your skin tone and live UV index.
        </Animated.Text>

        {/* Preview card */}
        <Animated.View entering={FadeIn.delay(300).duration(600)} style={styles.previewCard}>
          {/* Header + pill combined — pill sits directly under title */}
          <View style={styles.cardHeaderBlock}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardEyebrow}>{uv ? 'TODAY · YOUR LOCATION' : 'TODAY · LONDON'}</Text>
                <Text style={styles.cardTitle}>Best tanning window</Text>
              </View>
              <View style={[styles.uvIndexBadge, uv && { borderColor: uv.color + '40', backgroundColor: uv.color + '14' }]}>
                <Text style={[styles.uvIndexNum, uv && { color: uv.color }]}>{uv ? uv.uvIndex : '3'}</Text>
                <Text style={[styles.uvIndexLabel, uv && { color: uv.color }]}>UV</Text>
              </View>
            </View>
            <View style={styles.windowRow}>
              <LinearGradient
                colors={[tokens.colors.pinkDeep, tokens.colors.gold]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.windowPill}
              >
                <Text style={styles.windowTime}>{uv ? uv.tanningWindow : '10:00 – 11:30 am'}</Text>
              </LinearGradient>
              <Text style={styles.windowNote}>{uv ? uv.tanningWindowNote : 'Low risk · 30 min max'}</Text>
            </View>
          </View>

          {/* UV chart */}
          <UvChart forecast={uv?.hourlyForecast} />

          {/* Safe / avoid legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDotSafe]} />
              <Text style={styles.legendText}>Safe window</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDotDanger]} />
              <Text style={styles.legendText}>Avoid</Text>
            </View>
          </View>

          {/* Skin tone note */}
          <View style={styles.skinNote}>
            <View style={styles.skinDot} />
            <Text style={styles.skinNoteText}>
              Calibrated to your undertone and SPF preferences
            </Text>
          </View>
        </Animated.View>
      </View>

      <View style={{ flex: 1 }} />

      <View style={styles.buttons}>
        <Pressable
          onPress={() => handleChoice('no')}
          hitSlop={8}
          style={({ pressed }) => [
            styles.btn, styles.btnNo,
            chosen === 'no' && styles.btnNoSelected,
            pressed && { opacity: 0.75 },
          ]}
        >
          <Text style={[styles.btnText, chosen === 'no' ? styles.btnNoTextSelected : styles.btnNoText]}>
            No thanks
          </Text>
        </Pressable>

        <Pressable
          onPress={() => handleChoice('yes')}
          hitSlop={8}
          style={({ pressed }) => [
            styles.btn, styles.btnYes,
            chosen === 'yes' && styles.btnYesSelected,
            pressed && { opacity: 0.82 },
          ]}
        >
          <Text style={[styles.btnText, styles.btnYesText]}>Yes, add it</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.cream },
  body: { paddingHorizontal: 28, paddingTop: 20, overflow: 'hidden' },
  eyebrow: {
    fontFamily: tokens.fonts.regular,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    color: tokens.colors.pinkDeep,
    marginBottom: 12,
  },
  title: {
    fontFamily: tokens.fonts.serif,
    fontSize: 32,
    fontWeight: '400',
    color: tokens.colors.text,
    lineHeight: 42,
    marginBottom: 10,
  },
  sub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '300',
    color: tokens.colors.gray,
    lineHeight: 21,
    marginBottom: 22,
  },

  // Preview card
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
    padding: 18,
    gap: 10,
  },
  cardHeaderBlock: { gap: 4 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardEyebrow: {
    fontFamily: tokens.fonts.regular,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    color: tokens.colors.grayLight,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  cardTitle: {
    fontFamily: tokens.fonts.regular,
    fontSize: 16,
    fontWeight: '700',
    color: tokens.colors.text,
  },
  uvIndexBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
  },
  uvIndexNum: {
    fontFamily: tokens.fonts.serif,
    fontSize: 20,
    fontWeight: '400',
    color: tokens.colors.gold,
    lineHeight: 24,
  },
  uvIndexLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    color: tokens.colors.gold,
  },

  // Window pill
  windowRow: {
    gap: 6,
  },
  windowPill: {
    borderRadius: 50,
    paddingVertical: 9,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
  },
  windowTime: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  windowNote: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    fontWeight: '400',
    color: tokens.colors.gray,
    marginLeft: 4,
  },

  // UV bar chart
  uvChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: BAR_AREA_H + LABEL_H + 4,
  },
  uvBar: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
  },
  uvBarArea: {
    height: BAR_AREA_H,
    width: 14,
    justifyContent: 'flex-end',
  },
  uvBarFill: {
    width: 14,
    borderRadius: 4,
  },
  uvBarSafe: {
    backgroundColor: tokens.colors.pinkDeep,
    opacity: 0.7,
  },
  uvBarDanger: {
    backgroundColor: '#FFB347',
  },
  uvBarLabel: {
    height: LABEL_H,
    marginTop: 4,
    fontFamily: tokens.fonts.regular,
    fontSize: 8,
    fontWeight: '500',
    color: tokens.colors.grayLight,
    textAlign: 'center',
  },

  // Legend
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 12,
    marginTop: -4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendDotSafe: { backgroundColor: tokens.colors.pinkDeep, opacity: 0.7 },
  legendDotDanger: { backgroundColor: '#FFB347' },
  legendText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    fontWeight: '500',
    color: tokens.colors.text,
  },

  // Skin note
  skinNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: tokens.colors.cream,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  skinDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: tokens.colors.pinkDeep,
    flexShrink: 0,
  },
  skinNoteText: {
    flex: 1,
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '400',
    color: tokens.colors.gray,
    lineHeight: 17,
  },

  // Buttons
  buttons: {
    flexDirection: 'row',
    paddingHorizontal: 28,
    gap: 12,
  },
  btn: {
    flex: 1,
    borderRadius: 50,
    paddingVertical: 17,
    alignItems: 'center',
  },
  btnNo: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  btnNoSelected: {
    backgroundColor: tokens.colors.text,
    borderColor: tokens.colors.text,
  },
  btnYes: {
    backgroundColor: tokens.colors.pinkDeep,
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 7,
  },
  btnYesSelected: {
    shadowOpacity: 0.5,
  },
  btnText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '700',
  },
  btnNoText: { color: tokens.colors.text },
  btnNoTextSelected: { color: '#FFFFFF' },
  btnYesText: { color: '#FFFFFF' },
});
