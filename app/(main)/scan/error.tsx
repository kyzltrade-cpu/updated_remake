import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import * as Haptics from 'expo-haptics';

export default function ScanErrorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Elegant error vibration
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(main)/scan');
  };

  return (
    <View style={[s.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
      
      {/* Editorial Microcopy Top Bar */}
      <View style={s.topBar}>
        <Text style={s.brandLabel}>REMAKE BEAUTY SYSTEM</Text>
      </View>

      <View style={s.content}>
        
        {/* Aggressive yet Luxury Warning Card */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={s.warningCard}>
          <Text style={s.warningIcon}>▲</Text>
          <Text style={s.warningTitle}>ANALYSIS ERROR</Text>
          <Text style={s.warningSubtitle}>SCAN INTERRUPTED</Text>
          
          <View style={s.divider} />
          
          <Text style={s.warningDesc}>
            Your facial photo could not be parsed by our diagnostic models. This typically occurs due to high network latency, poor camera lighting, or temporary server congestion.
          </Text>
          
          <Text style={s.suggestionText}>
            BESTIE ADVICE: Make sure you're in a well-lit room, look directly into the camera guide, and keep your phone stable.
          </Text>
        </Animated.View>

        {/* Elegant Action Button */}
        <Animated.View entering={FadeIn.delay(300).duration(300)} style={s.buttonContainer}>
          <Pressable 
            onPress={handleRetry} 
            style={({ pressed }) => [s.retryButton, pressed && s.retryButtonPressed]}
          >
            <Text style={s.retryButtonText}>TRY AGAIN</Text>
          </Pressable>
          
          <Pressable 
            onPress={() => router.replace('/(main)/settings')} 
            style={s.supportButton}
          >
            <Text style={s.supportButtonText}>CONTACT SUPPORT</Text>
          </Pressable>
        </Animated.View>

      </View>

      {/* Editorial Footnote */}
      <View style={s.footer}>
        <Text style={s.footerText}>SYSTEM RE-ROUTE G-400</Text>
      </View>

    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.ivory,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  topBar: {
    alignItems: 'center',
    marginTop: 10,
  },
  brandLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.pinkRich,
    letterSpacing: 2.5,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 40,
  },
  warningCard: {
    backgroundColor: '#FFF0F0',
    borderWidth: 1.5,
    borderColor: tokens.colors.pinkDeep,
    borderRadius: 20,
    padding: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: tokens.colors.pinkRich,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  warningIcon: {
    fontSize: 32,
    color: tokens.colors.pinkDeep,
    marginBottom: 16,
  },
  warningTitle: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    fontWeight: '800',
    color: tokens.colors.pinkDeep,
    letterSpacing: 3,
    marginBottom: 4,
  },
  warningSubtitle: {
    fontFamily: tokens.fonts.serif,
    fontSize: 28,
    fontWeight: 'normal',
    color: tokens.colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: tokens.colors.border,
    marginBottom: 20,
  },
  warningDesc: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    color: tokens.colors.text,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  suggestionText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.pinkRich,
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
    paddingHorizontal: 10,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 32,
    gap: 12,
  },
  retryButton: {
    backgroundColor: tokens.colors.pinkDeep,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: tokens.colors.pinkRich,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  retryButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  retryButtonText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 2,
  },
  supportButton: {
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  supportButtonText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.gray,
    letterSpacing: 1.5,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 9,
    fontWeight: '700',
    color: tokens.colors.grayLight,
    letterSpacing: 2,
  },
});
