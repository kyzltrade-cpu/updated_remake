import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import { FaceCorners } from '@/components/face-corners';
import { GalleryIcon } from '@/components/ui/gallery-icon';
import { FlashIcon } from '@/components/ui/flash-icon';
import { EdgeFlashOverlay } from '@/components/edge-flash';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSettings } from '@/contexts/settings-context';

// Person silhouette — warm, personal, shows it's "your" space
function SettingsSparkle({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.pfpBtn, pressed && styles.pfpBtnPressed]}>
      {/* Ring light glow */}
      <View style={styles.pfpGlow}>
        <View style={styles.pfpGlowInner} />
      </View>
      {/* White glass circle with goldSoft border */}
      <View style={styles.pfpBtnRing}>
        <MaterialIcons name="person" size={22} color={tokens.colors.gold} />
      </View>
    </Pressable>
  );
}

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const { settings } = useSettings();

  useEffect(() => {
    if (permission === null) requestPermission();
  }, []);

  const takePhoto = async () => {
    if (settings.hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, skipProcessing: true });
      if (photo?.uri) {
        router.push({ pathname: '/(main)/scan/preview', params: { uri: photo.uri } });
      }
    } catch {
      Alert.alert('Camera error', 'Could not capture photo');
    }
  };

  const pickImage = async () => {
    if (settings.hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      router.push({ pathname: '/(main)/scan/preview', params: { uri: result.assets[0].uri } });
    }
  };

  const toggleFlash = () => {
    if (settings.hapticsEnabled) Haptics.selectionAsync();
    setFlash(f => !f);
  };

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.permissionText}>Camera access is needed to scan your makeup.</Text>
        <Pressable style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Access</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
        mode="picture"
      />

      {/* Face guide */}
      <View style={styles.viewfinder}>
        <FaceCorners size={200} />
        <Text style={styles.hint}>Align your face</Text>
      </View>

      {/* PFP button — top left */}
      <Animated.View entering={FadeIn.delay(200)} style={[styles.topBar, { paddingTop: insets.top + 14 }]}>
        <SettingsSparkle onPress={() => router.push('/(main)/settings')} />
      </Animated.View>

      {/* Bottom controls — HTML brand matching */}
      <Animated.View entering={FadeIn.delay(300)} style={[styles.controls, { paddingBottom: insets.bottom + 50 }]}>
        {/* Gallery / photo picker — left (HTML: rounded rect with inner rect) */}
        <Pressable onPress={pickImage} style={({ pressed }) => [styles.galleryBtn, pressed && styles.galleryBtnPressed]}>
          <GalleryIcon />
        </Pressable>

        {/* Shutter — center (HTML: border ring + white inner circle) */}
        <Pressable onPress={takePhoto} style={({ pressed }) => [styles.shutter, pressed && styles.shutterPressed]}>
          <View style={styles.shutterRing}>
            <View style={styles.shutterInner} />
          </View>
        </Pressable>

        {/* Flash — right (stroke lightning bolt, gold when active) */}
        <Pressable onPress={toggleFlash} style={({ pressed }) => [styles.sideBtn, pressed && styles.sideBtnPressed]}>
          <FlashIcon active={flash} />
        </Pressable>
      </Animated.View>

      <EdgeFlashOverlay visible={flash} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },

  // Face guide
  viewfinder: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 5 },
  hint: {
    position: 'absolute', bottom: '30%', left: 0, right: 0, textAlign: 'center',
    fontFamily: tokens.fonts.regular, fontSize: 11, letterSpacing: 0.6,
    color: 'rgba(232,160,170,0.35)', textTransform: 'uppercase', fontWeight: '500',
  },

  // Top bar
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingHorizontal: 22, paddingBottom: 16, alignItems: 'flex-start' },

  // PFP button
  pfpBtn: { width: 56, height: 56, justifyContent: 'center', alignItems: 'center' },
  pfpBtnPressed: { transform: [{ scale: 0.93 }] },
  // Ring light glow — soft radial white behind the avatar
  pfpGlow: {
    position: 'absolute',
    width: 56, height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  pfpGlowInner: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  // White glass circle with goldSoft border — same as GlassButton
  pfpBtnRing: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1.5,
    borderColor: tokens.colors.goldSoft,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },

  // Bottom controls
  controls: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 36, zIndex: 10,
  },

  // Shutter
  shutter: { justifyContent: 'center', alignItems: 'center' },
  shutterPressed: { transform: [{ scale: 0.94 }] },
  shutterRing: {
    width: 74, height: 74, borderRadius: 37,
    borderWidth: 3, borderColor: '#C49599',
    justifyContent: 'center', alignItems: 'center',
  },
  shutterInner: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#fff',
  },

  // Gallery — Pressable wrapper (SVG icon rendered inside)
  galleryBtn: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  galleryBtnPressed: { transform: [{ scale: 0.90 }] },

  // Flash — sideBtn wrapper for SVG icon
  sideBtn: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  sideBtnPressed: { transform: [{ scale: 0.90 }] },

  // Permission screen
  permissionText: { fontFamily: tokens.fonts.regular, fontSize: 15, color: '#fff', textAlign: 'center', paddingHorizontal: 40 },
  permissionBtn: { backgroundColor: tokens.colors.gold, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, marginTop: 20 },
  permissionBtnText: { fontFamily: tokens.fonts.regular, fontSize: 14, fontWeight: '500', color: '#fff' },
});