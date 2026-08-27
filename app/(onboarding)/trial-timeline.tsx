import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { tokens } from '@/components/theme';

const { width: W } = Dimensions.get('window');

interface TimelineItemProps {
  day: string;
  title: string;
  desc: string;
  icon: string;
  isLast?: boolean;
}

function TimelineItem({ day, title, desc, icon, isLast = false }: TimelineItemProps) {
  return (
    <View style={styles.itemRow}>
      {/* Icon & Connector column */}
      <View style={styles.leftCol}>
        <Animated.View entering={ZoomIn.delay(150).duration(400)} style={styles.iconCircle}>
          <Text style={styles.iconText}>{icon}</Text>
        </Animated.View>
        {!isLast && <View style={styles.lineConnector} />}
      </View>

      {/* Content column */}
      <View style={styles.rightCol}>
        <View style={styles.labelRow}>
          <Text style={styles.dayLabel}>{day}</Text>
        </View>
        <Text style={styles.itemTitle}>{title}</Text>
        <Text style={styles.itemDesc}>{desc}</Text>
      </View>
    </View>
  );
}

export default function TrialTimelineScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      // Prompt for notifications to power the Day 2 trial reminder
      await Notifications.requestPermissionsAsync();
    } catch (e) {
      console.warn('[TrialTimeline] Notification request failed:', e);
    } finally {
      router.replace('/(onboarding)/paywall');
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      <LinearGradient
        colors={[tokens.colors.darkBg, tokens.colors.darkBgLight, tokens.colors.darkBg]}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient soft background glow */}
      <View style={styles.glow} pointerEvents="none" />

      <View style={styles.body}>
        {/* Header Eyebrow */}
        <Animated.Text entering={FadeInUp.delay(100).duration(550)} style={styles.eyebrow}>
          NO-RISK INGREDIENT SAFETY
        </Animated.Text>

        {/* Heading */}
        <Animated.Text entering={FadeInUp.delay(200).duration(550)} style={styles.title}>
          {'How your 3-day\nfree trial works'}
        </Animated.Text>

        <Animated.Text entering={FadeInUp.delay(300).duration(550)} style={styles.sub}>
          We hate sneaky subscriptions. Here is exactly what happens when you start your trial.
        </Animated.Text>

        {/* Timeline container */}
        <Animated.View entering={FadeInUp.delay(450).duration(600)} style={styles.timelineBox}>
          <TimelineItem
            day="TODAY (DAY 0)"
            title="Seal Your Beauty DNA"
            desc="Unlock barcode scanning, comedogenic checks, and safety watchdog alerts for 100+ toxins."
            icon="🧬"
          />
          <TimelineItem
            day="DAY 2"
            title="Trial Reminder Sent"
            desc="We send you a push alert 24h before trial ends. Cancel with 1 tap if ReMake isn't for you."
            icon="⏰"
          />
          <TimelineItem
            day="DAY 3"
            title="Subscription Begins"
            desc="Billing begins for your Annual plan at $49.99/yr. Keep it only if you want flawless skin."
            icon="💎"
            isLast={true}
          />
        </Animated.View>
      </View>

      <View style={{ flex: 1 }} />

      {/* Bottom CTA action */}
      <Animated.View entering={FadeInUp.delay(650).duration(500)} style={styles.bottom}>
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
        >
          <Text style={styles.ctaText}>Activate Trial & Reminder ✦</Text>
        </Pressable>

        <Text style={styles.legalText}>
          Easy cancellation anytime in your Apple ID settings.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.darkBg },
  glow: {
    position: 'absolute',
    top: -120,
    alignSelf: 'center',
    width: W * 1.3,
    height: W * 1.3,
    borderRadius: W * 0.65,
    backgroundColor: 'rgba(232,57,154,0.05)',
  },
  body: { paddingHorizontal: 28, paddingTop: 30 },
  
  eyebrow: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    color: tokens.colors.pinkDeep,
    marginBottom: 12,
  },
  title: {
    fontFamily: tokens.fonts.serif,
    fontSize: 34,
    fontWeight: '400',
    color: tokens.colors.white,
    lineHeight: 44,
    marginBottom: 12,
  },
  sub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '300',
    color: tokens.colors.gray,
    lineHeight: 22,
    marginBottom: 36,
  },

  // Timeline UI Elements
  timelineBox: {
    paddingLeft: 4,
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 16,
  },
  leftCol: {
    alignItems: 'center',
    width: 36,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  iconText: {
    fontSize: 16,
  },
  lineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginVertical: 4,
    zIndex: 1,
  },
  rightCol: {
    flex: 1,
    paddingBottom: 28,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: tokens.colors.pinkDeep,
  },
  itemTitle: {
    fontFamily: tokens.fonts.regular,
    fontSize: 16,
    fontWeight: '600',
    color: tokens.colors.white,
    marginBottom: 6,
  },
  itemDesc: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '300',
    color: tokens.colors.gray,
    lineHeight: 19,
  },

  // CTA Panel
  bottom: {
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 12,
  },
  cta: {
    backgroundColor: tokens.colors.pinkDeep,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 16,
    fontWeight: '700',
    color: tokens.colors.white,
    letterSpacing: 0.5,
  },
  legalText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    color: tokens.colors.gray,
    textAlign: 'center',
  },
});
