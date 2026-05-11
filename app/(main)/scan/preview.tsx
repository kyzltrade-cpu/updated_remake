import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { tokens } from '@/components/theme';
import * as Haptics from 'expo-haptics';
import { useSettings } from '@/contexts/settings-context';

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

        {/* Save — circle with ↓ */}
        <Pressable style={({ pressed }) => [styles.circleBtn, pressed && styles.circleBtnPressed]}>
          <Text style={styles.circleBtnIcon}>↓</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  preview: { flex: 1, marginTop: 60, marginHorizontal: 14, marginBottom: 14, borderRadius: 20, overflow: 'hidden', backgroundColor: '#111' },
  photo: { width: '100%', height: '100%' },
  placeholder: { flex: 1, textAlign: 'center', textAlignVertical: 'center', lineHeight: 200, color: 'rgba(232,160,170,0.15)', fontSize: 13, letterSpacing: 0.5 },
  bottomBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingBottom: 50, gap: 44 },
  circleBtn: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  circleBtnPressed: { transform: [{ scale: 0.90 }], backgroundColor: 'rgba(255,255,255,0.08)' },
  circleBtnIcon: { fontSize: 15, color: 'rgba(255,255,255,0.6)' },
  analyzeBtn: { paddingHorizontal: 40, paddingVertical: 15, backgroundColor: tokens.colors.white, borderRadius: 50 },
  analyzeBtnPressed: { backgroundColor: tokens.colors.cream, transform: [{ scale: 0.97 }] },
  analyzeText: { fontFamily: tokens.fonts.regular, fontSize: 12, fontWeight: '600', letterSpacing: 0.1, textTransform: 'uppercase', color: tokens.colors.gold },
});