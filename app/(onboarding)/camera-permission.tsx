import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Linking, Modal } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useCameraPermissions } from 'expo-camera';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import * as Haptics from 'expo-haptics';

export default function CameraPermissionScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [showDeniedModal, setShowDeniedModal] = useState(false);

  useEffect(() => {
    if (permission?.granted) {
      router.replace('/(onboarding)/lighting');
    }
  }, [permission]);

  const handleRequest = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await requestPermission();
    if (!result.granted) {
      setShowDeniedModal(true);
    }
  };

  const handleOpenSettings = () => {
    Linking.openSettings();
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.delay(100).duration(700)} style={styles.iconWrap}>
        <Text style={styles.icon}>📷</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(260).duration(700)} style={styles.header}>
        <Text style={styles.title}>Camera access required</Text>
        <Text style={styles.sub}>
          REMAKE analyses your makeup live through your camera. This is the core of how it works — we can't score what we can't see.
        </Text>
      </Animated.View>

      <View style={styles.spacer} />

      <Animated.View entering={FadeInUp.delay(440).duration(700)} style={styles.bottom}>
        <GlassButton
          title="Allow Camera Access"
          onPress={handleRequest}
          variant="primary"
          style={styles.cta}
        />
        <Text style={styles.note}>Your camera is never recorded or stored.</Text>
      </Animated.View>

      <Modal visible={showDeniedModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Camera access denied</Text>
            <Text style={styles.modalBody}>
              REMAKE needs camera access to work. Please enable it in your device Settings to continue.
            </Text>
            <Pressable style={styles.modalBtn} onPress={handleOpenSettings}>
              <Text style={styles.modalBtnText}>Open Settings</Text>
            </Pressable>
            <Pressable style={styles.modalSecondary} onPress={() => setShowDeniedModal(false)}>
              <Text style={styles.modalSecondaryText}>Try again</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.beige,
    paddingHorizontal: 28,
    paddingTop: 100,
    paddingBottom: 50,
  },
  iconWrap: { alignItems: 'center', marginBottom: 40 },
  icon: { fontSize: 64 },
  header: { alignItems: 'center', gap: 16 },
  title: {
    fontFamily: tokens.fonts.serif,
    fontSize: 30,
    fontWeight: '400',
    color: tokens.colors.text,
    textAlign: 'center',
    lineHeight: 40,
  },
  sub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '300',
    color: tokens.colors.gray,
    textAlign: 'center',
    lineHeight: 23,
    maxWidth: 300,
  },
  spacer: { flex: 1 },
  bottom: { gap: 14, alignItems: 'center' },
  cta: { width: '100%' },
  note: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    color: tokens.colors.grayLight,
    textAlign: 'center',
  },

  // Denied modal
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
    gap: 16,
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
    fontWeight: '500',
    color: tokens.colors.white,
  },
  modalSecondary: { alignItems: 'center', paddingVertical: 8 },
  modalSecondaryText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    color: tokens.colors.gray,
  },
});
