import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  View, Text, StyleSheet, Pressable, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import { FaceCorners } from '@/components/face-corners';
import { EdgeFlashOverlay } from '@/components/edge-flash';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';

const LOW_LIGHT_EV_THRESHOLD = -0.5;

export default function FirstScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [showLowLight, setShowLowLight] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  const proceed = async (uri: string) => {
    await AsyncStorage.setItem('@remake_pending_dna_uri', uri);
    router.push('/(onboarding)/dna-loading');
  };

  const takePhoto = async () => {
    if (capturing || !cameraRef.current) return;
    setCapturing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, exif: true });
      if (!photo?.uri) throw new Error('no uri');

      const rawEv = photo.exif?.BrightnessValue;
      const ev = typeof rawEv === 'number' ? rawEv
        : typeof rawEv === 'string' ? parseFloat(rawEv)
        : null;
      const isDark = !flash && ev !== null && ev < LOW_LIGHT_EV_THRESHOLD;

      if (isDark) {
        setShowLowLight(true);
        setTimeout(() => setShowLowLight(false), 3500);
        Alert.alert(
          'Too dark for a good read',
          'Move closer to a window or turn on more lights, then try again.',
          [
            { text: 'Retake', style: 'cancel', onPress: () => setCapturing(false) },
            { text: 'Continue anyway', onPress: () => proceed(photo.uri) },
          ],
        );
      } else {
        await proceed(photo.uri);
      }
    } catch {
      Alert.alert('Camera error', 'Could not take photo. Please try again.');
      setCapturing(false);
    }
  };

  const pickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      await proceed(result.assets[0].uri);
    }
  };

  const toggleFlash = () => {
    Haptics.selectionAsync();
    setFlash(f => !f);
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionScreen}>
        <View style={styles.permissionIconWrap}>
          <MaterialIcons name="camera-alt" size={30} color={tokens.colors.pinkDeep} />
        </View>
        <Text style={styles.permissionTitle}>Allow Camera Access</Text>
        <Text style={styles.permissionText}>
          ReMake needs your camera to analyse your face shape and skin tone for your Beauty DNA.
        </Text>
        <Pressable style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Allow Access</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="front"
        flash={flash ? 'on' : 'off'}
        mode="picture"
      />

      {/* Face guide */}
      <View style={styles.viewfinder} pointerEvents="none">
        <FaceCorners size={210} color="rgba(238,62,100,0.60)" />
        <Text style={styles.hint}>BARE FACE · NO MAKEUP</Text>
      </View>

      {/* Top gradient — wordmark */}
      <LinearGradient
        colors={['rgba(0,0,0,0.72)', 'rgba(0,0,0,0.28)', 'transparent']}
        locations={[0, 0.5, 1]}
        style={[styles.topGradient, { paddingTop: insets.top + 12 }]}
        pointerEvents="none"
      >
        <Animated.View entering={FadeIn.delay(150)} style={styles.topBar}>
          <Text style={styles.wordmark}>REMAKE</Text>
        </Animated.View>
      </LinearGradient>

      {/* Bottom gradient + controls */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.42)', 'rgba(0,0,0,0.82)']}
        locations={[0, 0.35, 1]}
        style={[styles.bottomGradient, { paddingBottom: insets.bottom + 28 }]}
        pointerEvents="box-none"
      >
        <Animated.View entering={FadeIn.delay(250)} style={styles.controls}>
          <Pressable
            onPress={pickImage}
            style={({ pressed }) => [styles.sideBtn, pressed && { opacity: 0.65, transform: [{ scale: 0.92 }] }]}
          >
            <View style={styles.sideBtnInner}>
              <MaterialIcons name="photo-library" size={21} color="rgba(255,255,255,0.88)" />
            </View>
          </Pressable>

          <Pressable
            onPress={takePhoto}
            disabled={capturing}
            style={({ pressed }) => [styles.shutterWrap, pressed && { transform: [{ scale: 0.94 }] }, capturing && { opacity: 0.5 }]}
          >
            <View style={styles.shutterRing}>
              <View style={styles.shutterInner} />
            </View>
          </Pressable>

          <Pressable
            onPress={toggleFlash}
            style={({ pressed }) => [styles.sideBtn, pressed && { opacity: 0.65, transform: [{ scale: 0.92 }] }]}
          >
            <View style={[styles.sideBtnInner, flash && styles.sideBtnFlashOn]}>
              <MaterialIcons
                name={flash ? 'flash-on' : 'flash-off'}
                size={21}
                color={flash ? '#FFD700' : 'rgba(255,255,255,0.88)'}
              />
            </View>
          </Pressable>
        </Animated.View>
      </LinearGradient>

      {/* Low-light warning */}
      {showLowLight && (
        <Animated.View
          entering={FadeInDown.springify().damping(18)}
          exiting={FadeOut.duration(200)}
          style={[styles.lowLightBanner, { top: insets.top + 80 }]}
          pointerEvents="none"
        >
          <Text style={styles.lowLightIcon}>✦</Text>
          <Text style={styles.lowLightText}>Move to brighter light</Text>
        </Animated.View>
      )}

      <EdgeFlashOverlay visible={flash} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  viewfinder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    zIndex: 5, paddingBottom: 40,
  },
  hint: {
    marginTop: 18,
    fontFamily: tokens.fonts.regular,
    fontSize: 11, letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.30)',
  },

  topGradient: {
    position: 'absolute', top: 0, left: 0, right: 0,
    zIndex: 10, paddingHorizontal: 20, paddingBottom: 20,
  },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  wordmark: {
    fontFamily: tokens.fonts.serif,
    fontSize: 17, fontWeight: '400',
    color: 'rgba(255,255,255,0.82)',
    letterSpacing: 0.12,
  },

  bottomGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    zIndex: 10, paddingTop: 80, alignItems: 'center',
  },
  controls: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 28,
  },
  sideBtn: { width: 52, height: 52, justifyContent: 'center', alignItems: 'center' },
  sideBtnInner: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  sideBtnFlashOn: {
    backgroundColor: 'rgba(255,210,0,0.14)',
    borderColor: 'rgba(255,210,0,0.4)',
  },
  shutterWrap: { justifyContent: 'center', alignItems: 'center' },
  shutterRing: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.82)',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 14, elevation: 10,
  },
  shutterInner: {
    width: 63, height: 63, borderRadius: 32, backgroundColor: '#fff',
  },

  lowLightBanner: {
    position: 'absolute', alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(12,3,8,0.84)',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, zIndex: 20,
    borderWidth: 1, borderColor: 'rgba(232,57,154,0.35)',
  },
  lowLightIcon: { fontSize: 9, color: tokens.colors.pinkDeep },
  lowLightText: {
    fontFamily: tokens.fonts.regular, fontSize: 11, fontWeight: '500',
    color: 'rgba(255,210,235,0.92)', letterSpacing: 0.3,
  },

  permissionScreen: {
    flex: 1, backgroundColor: tokens.colors.beige,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 40, gap: 14,
  },
  permissionIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(232,57,154,0.08)',
    borderWidth: 1, borderColor: tokens.colors.border,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  permissionTitle: {
    fontFamily: tokens.fonts.serif, fontSize: 24, color: tokens.colors.text, textAlign: 'center',
  },
  permissionText: {
    fontFamily: tokens.fonts.regular, fontSize: 14,
    color: tokens.colors.gray, textAlign: 'center', lineHeight: 22,
  },
  permissionBtn: {
    marginTop: 10, backgroundColor: tokens.colors.pinkDeep,
    paddingHorizontal: 32, paddingVertical: 14, borderRadius: 24,
  },
  permissionBtnText: {
    fontFamily: tokens.fonts.regular, fontSize: 14, fontWeight: '600', color: '#fff',
  },
});
