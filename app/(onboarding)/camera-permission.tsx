import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Linking, Modal } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { tokens } from '@/components/theme';
import { ob } from '@/components/onboarding-styles';
import { GlassButton } from '@/components/glass-button';
import { OnboardingHeader } from '@/components/onboarding-header';

const BULLETS = [
  '· Analysed on-device — not uploaded',
  '· Never accessed in the background',
  '· Delete your data anytime from Settings',
];

export default function CameraPermissionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [showDenied, setShowDenied] = useState(false);

  useEffect(() => {
    if (permission?.granted) {
      router.replace('/(onboarding)/lighting');
    }
  }, [permission]);

  const handleRequest = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await requestPermission();
    if (!result.granted) setShowDenied(true);
  };

  return (
    <View style={[ob.root, { paddingBottom: insets.bottom + 40 }]}>
      <OnboardingHeader step={0} total={0} />

      <View style={styles.content}>
        <Animated.View entering={FadeIn.delay(100).duration(600)} style={ob.permIcon}>
          <View style={styles.cameraBody}>
            <View style={styles.cameraLens} />
            <View style={styles.cameraFlash} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(220).duration(500)} style={ob.permHeader}>
          <Text style={ob.permTitle}>One photo.{'\n'}That's all we need.</Text>
          <Text style={ob.permBody}>
            REMAKE reads your makeup and face through your camera.
            Your photo is never stored or shared.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(340).duration(500)} style={ob.permBullets}>
          {BULLETS.map(b => (
            <Text key={b} style={ob.permBullet}>{b}</Text>
          ))}
        </Animated.View>
      </View>

      <View style={ob.spacer} />

      <Animated.View entering={FadeInUp.delay(460).duration(500)} style={styles.bottom}>
        <GlassButton
          title="Allow Camera Access"
          onPress={handleRequest}
          variant="primary"
          style={styles.cta}
        />
        <Text style={ob.footnote}>Your camera is never accessed in the background.</Text>
      </Animated.View>

      <Modal visible={showDenied} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Camera access denied</Text>
            <Text style={styles.modalBody}>
              REMAKE needs camera access to work. Please enable it in Settings to continue.
            </Text>
            <Pressable style={styles.modalBtn} onPress={() => Linking.openSettings()}>
              <Text style={styles.modalBtnText}>Open Settings</Text>
            </Pressable>
            <Pressable style={styles.modalSecondary} onPress={() => setShowDenied(false)}>
              <Text style={styles.modalSecondaryText}>Try again</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: 'center', paddingTop: 12 },
  cameraBody: {
    width: 48,
    height: 36,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: tokens.colors.pinkDeep,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cameraLens: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2.5,
    borderColor: tokens.colors.pinkDeep,
  },
  cameraFlash: {
    position: 'absolute',
    top: -6,
    left: 8,
    width: 10,
    height: 6,
    borderRadius: 3,
    backgroundColor: tokens.colors.white,
    borderWidth: 2,
    borderColor: tokens.colors.pinkDeep,
  },
  bottom: { gap: 10, alignItems: 'center' },
  cta: { width: '100%' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 50,
  },
  modal: {
    backgroundColor: tokens.colors.white,
    borderRadius: 24,
    padding: 28,
    gap: 14,
  },
  modalTitle: {
    fontFamily: tokens.fonts.serif,
    fontSize: 22,
    fontWeight: '400',
    color: tokens.colors.text,
  },
  modalBody: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '300',
    color: tokens.colors.gray,
    lineHeight: 21,
  },
  modalBtn: {
    backgroundColor: tokens.colors.text,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalBtnText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.white,
    letterSpacing: 0.5,
  },
  modalSecondary: { alignItems: 'center', paddingVertical: 8 },
  modalSecondaryText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    color: tokens.colors.gray,
  },
});
