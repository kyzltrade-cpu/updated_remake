import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  View, Text, StyleSheet, Pressable, Alert, Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Brightness from 'expo-brightness';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn, FadeInUp,
  useSharedValue, useAnimatedStyle, withTiming, withSequence, Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const OVAL_W = SCREEN_W * 0.68;
const OVAL_H = OVAL_W * 1.32;
const RING_INSET_W = SCREEN_W * 0.22;
const RING_INSET_H = SCREEN_H * 0.18;

// EV < 1.5 ≈ darker than a dim indoor scene
const LOW_LIGHT_EV_THRESHOLD = 1.5;

function OvalGuide() {
  const pulse = useSharedValue(0.6);

  useEffect(() => {
    const interval = setInterval(() => {
      pulse.value = withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      );
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <View style={[styles.ovalContainer, { width: OVAL_W, height: OVAL_H }]}>
      <Animated.View
        style={[
          styles.ovalGlow,
          { width: OVAL_W + 24, height: OVAL_H + 24, borderRadius: (OVAL_W + 24) / 2 },
          glowStyle,
        ]}
      />
      <View style={[styles.ovalBorder, { width: OVAL_W, height: OVAL_H, borderRadius: OVAL_W / 2 }]} />
    </View>
  );
}

function RingFlash({ visible }: { visible: boolean }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withSequence(
        withTiming(1, { duration: 60 }),
        withTiming(0, { duration: 280 }),
      );
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, animStyle]}>
      {/* Top edge — white fades inward */}
      <LinearGradient
        colors={['rgba(255,255,255,0.96)', 'rgba(255,255,255,0)']}
        style={[styles.ringEdge, { top: 0, left: 0, right: 0, height: RING_INSET_H }]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      {/* Bottom edge */}
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.96)']}
        style={[styles.ringEdge, { bottom: 0, left: 0, right: 0, height: RING_INSET_H }]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      {/* Left edge */}
      <LinearGradient
        colors={['rgba(255,255,255,0.96)', 'rgba(255,255,255,0)']}
        style={[styles.ringEdge, { top: 0, bottom: 0, left: 0, width: RING_INSET_W }]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
      />
      {/* Right edge */}
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.96)']}
        style={[styles.ringEdge, { top: 0, bottom: 0, right: 0, width: RING_INSET_W }]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
      />
    </Animated.View>
  );
}

export default function FirstScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [flashing, setFlashing] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  const handleCapture = async () => {
    if (capturing || !cameraRef.current) return;
    setCapturing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Boost screen brightness to max for the ring flash
    let prevBrightness = 0.5;
    try {
      prevBrightness = await Brightness.getBrightnessAsync();
      await Brightness.setBrightnessAsync(1.0);
    } catch { /* brightness API unavailable on this device */ }

    setFlashing(true);
    setTimeout(async () => {
      setFlashing(false);
      try { await Brightness.setBrightnessAsync(prevBrightness); } catch {}
    }, 300);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        exif: true,
      });

      if (!photo?.uri) throw new Error('no uri');

      // Check EXIF brightness value — EV in APEX units
      const rawEv = photo.exif?.BrightnessValue;
      const ev = typeof rawEv === 'number'
        ? rawEv
        : typeof rawEv === 'string'
        ? parseFloat(rawEv)
        : null;

      const isDark = ev !== null && ev < LOW_LIGHT_EV_THRESHOLD;

      if (isDark) {
        Alert.alert(
          'Too dark for a good read',
          'Move closer to a window or turn on more lights, then try again.',
          [
            {
              text: 'Retake',
              style: 'cancel',
              onPress: () => setCapturing(false),
            },
            {
              text: 'Continue anyway',
              onPress: async () => {
                await AsyncStorage.setItem('@remake_pending_dna_uri', photo.uri);
                router.push('/(onboarding)/create-account');
              },
            },
          ],
        );
      } else {
        await AsyncStorage.setItem('@remake_pending_dna_uri', photo.uri);
        router.push('/(onboarding)/create-account');
      }
    } catch {
      Alert.alert('Camera error', 'Could not take photo. Please try again.');
      setCapturing(false);
    }
  };

  if (!permission) return <View style={styles.root} />;

  if (!permission.granted) {
    return (
      <View style={[styles.root, styles.permissionContainer]}>
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionSub}>
          We need your camera to analyse your face shape and skin tone for your Beauty DNA.
        </Text>
        <Pressable style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Allow Camera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="front"
        mode="picture"
      />

      {/* Dark vignette overlay */}
      <View style={styles.vignette} pointerEvents="none" />

      {/* Oval guide */}
      <View style={styles.ovalWrapper} pointerEvents="none">
        <OvalGuide />
      </View>

      {/* Ring flash */}
      <RingFlash visible={flashing} />

      {/* Top header */}
      <Animated.View
        entering={FadeInUp.duration(600)}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <Text style={styles.eyebrow}>BEAUTY DNA</Text>
        <Text style={styles.title}>Your face,{'\n'}decoded.</Text>
        <Text style={styles.hint}>Centre your face in the oval and hold still</Text>
      </Animated.View>

      {/* Bottom shutter */}
      <Animated.View
        entering={FadeIn.delay(400).duration(500)}
        style={[styles.controls, { paddingBottom: insets.bottom + 40 }]}
      >
        <Text style={styles.shutterLabel}>
          {capturing ? 'Capturing...' : 'Tap to scan'}
        </Text>
        <Pressable
          onPress={handleCapture}
          disabled={capturing}
          style={({ pressed }) => [
            styles.shutter,
            pressed && styles.shutterPressed,
            capturing && styles.shutterDisabled,
          ]}
        >
          <View style={styles.shutterRing}>
            <View style={styles.shutterInner} />
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0A' },

  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  ovalWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60,
  },
  ovalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ovalGlow: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(200,168,130,0.3)',
    shadowColor: '#C8A882',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  ovalBorder: {
    borderWidth: 1.5,
    borderColor: 'rgba(200,168,130,0.85)',
  },

  ringEdge: { position: 'absolute' },

  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    gap: 6,
    zIndex: 10,
  },
  eyebrow: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
    color: '#C8A882',
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: tokens.fonts.serif,
    fontSize: 30,
    color: '#FFF9F7',
    lineHeight: 38,
  },
  hint: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    color: 'rgba(255,249,247,0.55)',
    marginTop: 4,
  },

  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 16,
    zIndex: 10,
  },
  shutterLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    color: 'rgba(255,249,247,0.5)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  shutter: { justifyContent: 'center', alignItems: 'center' },
  shutterPressed: { transform: [{ scale: 0.93 }] },
  shutterDisabled: { opacity: 0.5 },
  shutterRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#C8A882',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF9F7',
  },

  permissionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  permissionTitle: {
    fontFamily: tokens.fonts.serif,
    fontSize: 26,
    color: '#FFF9F7',
    textAlign: 'center',
  },
  permissionSub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    color: 'rgba(255,249,247,0.65)',
    textAlign: 'center',
    lineHeight: 23,
  },
  permissionBtn: {
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 30,
    backgroundColor: tokens.colors.pinkDeep,
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
  },
  permissionBtnText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
