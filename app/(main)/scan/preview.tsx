import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Image, Alert } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { tokens } from '@/components/theme';
import * as Haptics from 'expo-haptics';
import { useSettings } from '@/contexts/settings-context';
import * as Sharing from 'expo-sharing';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function PreviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ uri?: string }>();
  const uri = params.uri ?? '';
  const { settings } = useSettings();

  const handleAnalyze = () => {
    if (settings.hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace({ pathname: '/(main)/scan/loading', params: { uri } });
  };

  const handleDiscard = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleShare = async () => {
    if (settings.hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable && uri) {
      try {
        await Sharing.shareAsync(uri);
      } catch (error) {
        console.warn('[Preview] Sharing failed:', error);
      }
    } else {
      Alert.alert('Sharing Unavailable', 'Native sharing is not supported on this device.');
    }
  };



  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.duration(300)} style={styles.preview}>
        {uri ? (
          <Image
            source={{ uri }}
            style={[styles.photo, settings.mirrorPhotos && { transform: [{ scaleX: -1 }] }]}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.placeholder}>Photo Preview</Text>
        )}
      </Animated.View>

      {/* Lighting sensitivity notification */}
      <View style={styles.lightingTipContainer}>
        <Text style={styles.lightingTipHeader}>⚡︎ LIGHTING SENSITIVITY: HIGH</Text>
        <Text style={styles.lightingTipText}>
          Ensure soft, front-facing light. Strong side-shadows, overhead bulbs, or backlights will alter your cosmetic score calibration.
        </Text>
      </View>

      {/* Bottom bar — HTML brand matching */}
      <View style={styles.bottomBar}>
        {/* Discard — circle with × */}
        <Pressable onPress={handleDiscard} style={({ pressed }) => [styles.circleBtn, pressed && styles.circleBtnPressed]}>
          <Text style={styles.circleBtnIcon}>✕</Text>
        </Pressable>

        {/* Analyze — pill button */}
        <Pressable onPress={handleAnalyze} style={({ pressed }) => [styles.analyzeBtn, pressed && styles.analyzeBtnPressed]}>
          <Text style={styles.analyzeText}>Analyze</Text>
        </Pressable>

        {/* Share — circle with share icon */}
        <Pressable onPress={handleShare} style={({ pressed }) => [styles.circleBtn, pressed && styles.circleBtnPressed]}>
          <MaterialIcons name="share" size={18} color="rgba(255,255,255,0.6)" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  preview: { flex: 1, marginTop: 60, marginHorizontal: 14, marginBottom: 12, borderRadius: 20, overflow: 'hidden', backgroundColor: '#111' },
  photo: { width: '100%', height: '100%' },
  placeholder: { flex: 1, textAlign: 'center', textAlignVertical: 'center', lineHeight: 200, color: 'rgba(232,160,170,0.15)', fontSize: 13, letterSpacing: 0.5 },
  lightingTipContainer: {
    marginHorizontal: 28,
    marginBottom: 24,
    alignItems: 'center',
  },
  lightingTipHeader: {
    fontFamily: tokens.fonts.regular,
    fontSize: 9,
    fontWeight: '700',
    color: tokens.colors.pinkRich,
    letterSpacing: 2.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  lightingTipText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.45)',
    textAlign: 'center',
    lineHeight: 16,
    letterSpacing: 0.1,
  },
  bottomBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingBottom: 32, gap: 44 },
  circleBtn: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  circleBtnPressed: { transform: [{ scale: 0.90 }], backgroundColor: 'rgba(255,255,255,0.08)' },
  circleBtnIcon: { fontSize: 15, color: 'rgba(255,255,255,0.6)' },
  analyzeBtn: {
    height: 48,
    paddingHorizontal: 36,
    backgroundColor: tokens.colors.pinkDeep,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  analyzeBtnPressed: {
    backgroundColor: tokens.colors.pinkRich,
    transform: [{ scale: 0.96 }],
  },
  analyzeText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#FFF',
  },
});