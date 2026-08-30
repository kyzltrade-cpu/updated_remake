import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import * as Haptics from 'expo-haptics';

export default function NoMakeupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Soft, tactile alert vibration
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/scan');
  };

  return (
    <View style={[s.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
      
      {/* Editorial Microcopy Top Bar */}
      <View style={s.topBar}>
        <Text style={s.brandLabel}>REMAKE BEAUTY SYSTEM</Text>
      </View>

      <View style={s.content}>
        
        {/* Luxury Notification Card */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={s.warningCard}>
          <Text style={s.warningIcon}>✨</Text>
          <Text style={s.warningTitle}>COSMETIC AUDIT LOG</Text>
          <Text style={s.warningSubtitle}>NO MAKEUP DETECTED</Text>
          
          <View style={s.divider} />
          
          <Text style={s.warningDesc}>
            Our skin-scanning models analyzed your selfie but did not detect cosmetic pigments, products, or coverage on any facial categories. 
          </Text>
          
          <Text style={s.warningDescSecondary}>
            Since ReMake is engineered exclusively for scoring, grading, and tracking cosmetic ingredients, audits must be completed with your makeup on. No data has been logged to your scan history.
          </Text>
          
          <Text style={s.suggestionText}>
            BESTIE ADVICE: Touch up your base, highlight your lips or eyes, and scan again to audit your ingredients!
          </Text>
        </Animated.View>

        {/* Elegant Action Button */}
        <Animated.View entering={FadeIn.delay(300).duration(300)} style={s.buttonContainer}>
          <Pressable 
            onPress={handleRetry} 
            style={({ pressed }) => [s.retryButton, pressed && s.retryButtonPressed]}
          >
            <Text style={s.retryButtonText}>SCAN WITH MAKEUP</Text>
          </Pressable>
          
          <Pressable 
            onPress={() => router.replace('/scan')} 
            style={s.supportButton}
          >
            <Text style={s.supportButtonText}>RETURN TO HOME</Text>
          </Pressable>
        </Animated.View>

      </View>

      {/* Editorial Footnote */}
      <View style={s.footer}>
        <Text style={s.footerText}>SYSTEM STATE AUDIT: BARE</Text>
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
    backgroundColor: '#FFFDFB', // Clean warm white background
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: 20,
    padding: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: tokens.colors.pinkRich,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  warningIcon: {
    fontSize: 32,
    marginBottom: 16,
  },
  warningTitle: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    fontWeight: '800',
    color: tokens.colors.pinkRich,
    letterSpacing: 3,
    marginBottom: 4,
  },
  warningSubtitle: {
    fontFamily: tokens.fonts.serif,
    fontSize: 24,
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
    marginBottom: 12,
  },
  warningDescSecondary: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    color: tokens.colors.gray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  suggestionText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.pinkDeep,
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
