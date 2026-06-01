import { useRouter } from 'expo-router';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View, Text, StyleSheet, Pressable, Alert, Image,
  Modal,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Animated, {
  FadeIn, FadeInDown, FadeInUp, FadeOut,
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import { FaceCorners } from '@/components/face-corners';
import { EdgeFlashOverlay } from '@/components/edge-flash';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSettings } from '@/contexts/settings-context';
import { type UVData } from '@/lib/uv';

type ScanMode = 'face' | 'product';

const CAPSULE_WIDTH = 172;
const PILL_WIDTH = 82;
const LOW_LIGHT_EV_THRESHOLD = -0.5;

const MOCK_UV: UVData = {
  uvIndex: 6,
  category: 'High',
  color: '#E88C39',
  spfRecommendation: 'Apply SPF 50',
  tanningAdvice: 'Brief sessions only — 15 min max',
};

// Hourly UV data for the bar chart (mock — replace with real API data when available)
const UV_HOURS = [
  { hour: '6am',  uvi: 0, safe: true  },
  { hour: '8am',  uvi: 1, safe: true  },
  { hour: '10am', uvi: 3, safe: true  },
  { hour: '12pm', uvi: 7, safe: false },
  { hour: '2pm',  uvi: 9, safe: false },
  { hour: '4pm',  uvi: 5, safe: false },
  { hour: '6pm',  uvi: 2, safe: true  },
];
const MAX_BAR_H = 52;
const MAX_UVI   = 10;

// ── UV Popup ──────────────────────────────────────────────────────────────────

function UVPopup({ onClose, insetTop }: { onClose: () => void; insetTop: number }) {
  const [uv, setUV] = useState<UVData | null>(null);

  useEffect(() => { setUV(MOCK_UV); }, []);

  return (
    <Modal transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.bubbleBackdrop} onPress={onClose}>
        <Animated.View
          entering={FadeInDown.duration(220)}
          style={[styles.uvPanel, { top: insetTop + 62 }]}
        >
          {uv !== null && (
            <View>
              {/* ── Header ── */}
              <View style={styles.uvCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.uvCardEyebrow}>TODAY · YOUR LOCATION</Text>
                  <Text style={styles.uvCardTitle}>Best tanning window</Text>
                </View>
                <View style={[styles.uvIndexBadge, { borderColor: uv.color + '40', backgroundColor: uv.color + '14' }]}>
                  <Text style={[styles.uvIndexNum, { color: uv.color }]}>{uv.uvIndex}</Text>
                  <Text style={[styles.uvIndexLbl, { color: uv.color }]}>UV</Text>
                </View>
              </View>

              {/* ── Time window pill ── */}
              <View style={styles.uvWindowRow}>
                <LinearGradient
                  colors={[tokens.colors.pinkDeep, tokens.colors.gold]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.uvWindowPill}
                >
                  <Text style={styles.uvWindowTime}>10:00 – 11:30 am</Text>
                </LinearGradient>
                <Text style={styles.uvWindowNote}>Low risk · 30 min max</Text>
              </View>

              {/* ── Hourly bar chart ── */}
              <View style={styles.uvBarChart}>
                {UV_HOURS.map(h => {
                  const barH = Math.max(4, (h.uvi / MAX_UVI) * MAX_BAR_H);
                  return (
                    <View key={h.hour} style={styles.uvBarItem}>
                      {/* Bar area — fills available height, bar sits at bottom */}
                      <View style={styles.uvBarArea}>
                        <View style={[
                          styles.uvBar,
                          {
                            height: barH,
                            backgroundColor: h.safe ? tokens.colors.pinkDeep : '#FFB347',
                            opacity: h.safe ? 0.72 : 1,
                          },
                        ]} />
                      </View>
                      {/* Label always below the bar area */}
                      <Text style={styles.uvBarLabel}>{h.hour}</Text>
                    </View>
                  );
                })}
              </View>

              {/* ── Legend ── */}
              <View style={styles.uvLegendRow}>
                <View style={styles.uvLegendItem}>
                  <View style={[styles.uvLegendDot, { backgroundColor: tokens.colors.pinkDeep, opacity: 0.72 }]} />
                  <Text style={styles.uvLegendText}>Safe window</Text>
                </View>
                <View style={styles.uvLegendItem}>
                  <View style={[styles.uvLegendDot, { backgroundColor: '#FFB347' }]} />
                  <Text style={styles.uvLegendText}>Avoid</Text>
                </View>
              </View>

              {/* ── Skin note ── */}
              <View style={styles.uvSkinNote}>
                <View style={styles.uvSkinDot} />
                <Text style={styles.uvSkinText}>
                  Calibrated to your skin tone &amp; SPF preferences
                </Text>
              </View>

            </View>
          )}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// ── Barcode frame overlay ─────────────────────────────────────────────────────

function BarcodeCorners() {
  return (
    <View style={barcodeStyles.frame}>
      <View style={[barcodeStyles.corner, barcodeStyles.tl]} />
      <View style={[barcodeStyles.corner, barcodeStyles.tr]} />
      <View style={[barcodeStyles.corner, barcodeStyles.bl]} />
      <View style={[barcodeStyles.corner, barcodeStyles.br]} />
    </View>
  );
}

const barcodeStyles = StyleSheet.create({
  frame: { width: 240, height: 140, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  corner: { position: 'absolute', width: 22, height: 22, borderColor: tokens.colors.pinkDeep, borderWidth: 0 },
  tl: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 4 },
  tr: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 4 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 4 },
  br: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 4 },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState(false);
  const [mode, setMode] = useState<ScanMode>('face');
  const [scanned, setScanned] = useState(false);
  const [showLowLight, setShowLowLight] = useState(false);
  const [showUV, setShowUV] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const lastBarcodeRef = useRef<string | null>(null);
  const { settings, profilePhoto } = useSettings();

  const pillX = useSharedValue(0);
  const pillStyle = useAnimatedStyle(() => ({ transform: [{ translateX: pillX.value }] }));

  const [comparing, setComparing] = useState(false);
  const [compareFirst, setCompareFirst] = useState<{ barcode?: string; uri?: string } | null>(null);

  useEffect(() => {
    if (permission === null) requestPermission();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Reset scan state when returning to the camera screen
      setScanned(false);
      // Clear the last barcode after 3 seconds so they can scan the same item again if they want
      const timer = setTimeout(() => {
        lastBarcodeRef.current = null;
      }, 3000);
      return () => clearTimeout(timer);
    }, [])
  );

  const switchMode = (next: ScanMode) => {
    if (next === mode) return;
    Haptics.selectionAsync();
    setScanned(false);
    if (next === 'face') { setComparing(false); setCompareFirst(null); }
    setMode(next);
    pillX.value = withTiming(next === 'face' ? 0 : PILL_WIDTH + 4, {
      duration: 260,
      easing: Easing.out(Easing.quad),
    });
  };

  const startCompare = () => {
    if (settings.hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setComparing(true);
    setCompareFirst(null);
    setScanned(false);
  };

  const cancelCompare = () => {
    if (settings.hapticsEnabled) Haptics.selectionAsync();
    setComparing(false);
    setCompareFirst(null);
    setScanned(false);
  };

  const takePhoto = async () => {
    if (settings.hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, exif: true });
      if (!photo?.uri) return;
      const rawEv = photo.exif?.BrightnessValue;
      const ev = typeof rawEv === 'number' ? rawEv
        : typeof rawEv === 'string' ? parseFloat(rawEv)
        : null;
      if (!flash && ev !== null && ev < LOW_LIGHT_EV_THRESHOLD) {
        setShowLowLight(true);
        setTimeout(() => setShowLowLight(false), 3500);
      }
      if (mode === 'product') {
        if (comparing) {
          if (!compareFirst) {
            setCompareFirst({ uri: photo.uri });
            if (settings.hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else {
            router.push({ pathname: '/(main)/product-scan/compare', params: { uri1: compareFirst.uri, uri2: photo.uri } });
          }
        } else {
          router.push({ pathname: '/(main)/product-scan/results', params: { uri: photo.uri } });
        }
      } else {
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
      const picked = result.assets[0].uri;
      if (mode === 'product') {
        if (comparing) {
          if (!compareFirst) {
            setCompareFirst({ uri: picked });
            if (settings.hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else {
            router.push({ pathname: '/(main)/product-scan/compare', params: { uri1: compareFirst.uri, uri2: picked } });
          }
        } else {
          router.push({ pathname: '/(main)/product-scan/results', params: { uri: picked } });
        }
      } else {
        router.push({ pathname: '/(main)/scan/preview', params: { uri: picked } });
      }
    }
  };

  const toggleFlash = () => {
    if (settings.hapticsEnabled) Haptics.selectionAsync();
    setFlash(f => !f);
  };

  const openUV = useCallback(() => {
    if (settings.hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowUV(true);
  }, [settings.hapticsEnabled]);

  const handleBarcode = ({ data, type }: { data: string; type: string }) => {
    if (scanned || mode !== 'product' || data === lastBarcodeRef.current) return;
    lastBarcodeRef.current = data;
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (comparing) {
      if (!compareFirst) {
        setCompareFirst({ barcode: data });
        setTimeout(() => setScanned(false), 2500);
      } else {
        router.push({ pathname: '/(main)/product-scan/compare', params: { barcode1: compareFirst.barcode, barcode2: data } });
      }
    } else {
      router.push({ pathname: '/(main)/product-scan/results', params: { barcode: data, barcodeType: type } });
    }
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
          ReMake needs your camera to analyze your makeup and give you personalized feedback.
        </Text>
        <Pressable style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Allow Access</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Full-bleed camera */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={mode === 'face' ? 'front' : 'back'}
        flash={mode === 'product' && flash ? 'on' : 'off'}
        mode="picture"
        onBarcodeScanned={mode === 'product' ? handleBarcode : undefined}
        barcodeScannerSettings={
          mode === 'product'
            ? { barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'] }
            : undefined
        }
      />

      {/* Viewfinder overlay */}
      <View style={styles.viewfinder} pointerEvents="none">
        {mode === 'face' ? (
          <>
            <FaceCorners size={210} color="rgba(238,62,100,0.60)" />
            <Text style={styles.hint}>Align your face</Text>
          </>
        ) : (
          <>
            <BarcodeCorners />
            <Text style={styles.hint}>Point at product barcode</Text>
          </>
        )}
      </View>

      {/* Top gradient — profile · REMAKE + toggle · UV */}
      <LinearGradient
        colors={['rgba(0,0,0,0.72)', 'rgba(0,0,0,0.28)', 'transparent']}
        locations={[0, 0.5, 1]}
        style={[styles.topGradient, { paddingTop: insets.top + 12 }]}
        pointerEvents="box-none"
      >
        <Animated.View entering={FadeIn.delay(150)} style={styles.topBar}>
          {/* Profile */}
          <Pressable
            onPress={() => router.push('/(main)/profile')}
            style={({ pressed }) => [styles.topBtn, pressed && { opacity: 0.65 }]}
          >
            {profilePhoto
              ? <Image source={{ uri: profilePhoto }} style={styles.profileImg} />
              : (
                <View style={styles.profilePlaceholder}>
                  <MaterialIcons name="person-outline" size={19} color="rgba(255,255,255,0.78)" />
                </View>
              )}
          </Pressable>

          {/* REMAKE wordmark */}
          <Text style={styles.wordmark}>REMAKE</Text>

          {/* UV sun button */}
          <Pressable
            onPress={openUV}
            style={({ pressed }) => [styles.topBtn, pressed && { opacity: 0.65 }]}
          >
            <View style={styles.sunBtnInner}>
              <MaterialIcons name="wb-sunny" size={19} color="rgba(255,215,50,0.88)" />
            </View>
          </Pressable>
        </Animated.View>

        {/* Mode toggle — centered below top bar */}
        <Animated.View entering={FadeIn.delay(220)} style={styles.toggleRow}>
          <BlurView tint="light" intensity={28} style={styles.capsule}>
            <Animated.View style={[styles.pill, pillStyle]} />
            <Pressable style={styles.option} onPress={() => switchMode('face')}>
              <Text style={[styles.optionText, mode === 'face' && styles.optionTextActive]}>Face</Text>
            </Pressable>
            <Pressable style={styles.option} onPress={() => switchMode('product')}>
              <Text style={[styles.optionText, mode === 'product' && styles.optionTextActive]}>Product</Text>
            </Pressable>
          </BlurView>
        </Animated.View>
      </LinearGradient>

      {/* Bottom gradient + controls — both modes */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.42)', 'rgba(0,0,0,0.82)']}
        locations={[0, 0.35, 1]}
        style={[styles.bottomGradient, { paddingBottom: insets.bottom + 28 }]}
        pointerEvents="box-none"
      >
        {mode === 'product' && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.compareRow}>
            <Pressable
              onPress={comparing ? cancelCompare : startCompare}
              style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
            >
              <BlurView tint="light" intensity={28} style={styles.compareBtn}>
                {comparing && <View style={styles.compareBtnPinkFill} />}
                <MaterialIcons name="compare-arrows" size={15} color="rgba(255,255,255,0.92)" />
                <Text style={styles.compareBtnText}>Compare Products</Text>
              </BlurView>
            </Pressable>
          </Animated.View>
        )}
        {mode === 'product' && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.scanHintRow}>
            <Text style={styles.productHintText}>
              {comparing
                ? compareFirst
                  ? '✓ Product 1 — now scan product 2'
                  : 'Step 1 of 2 — Scan first product'
                : scanned
                  ? 'Scanned — analysing product...'
                  : 'Hold steady over the barcode'
              }
            </Text>
          </Animated.View>
        )}
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
            style={({ pressed }) => [styles.shutterWrap, pressed && { transform: [{ scale: 0.94 }] }]}
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
          style={[styles.lowLightBanner, { top: insets.top + 112 }]}
          pointerEvents="none"
        >
          <Text style={styles.lowLightIcon}>✦</Text>
          <Text style={styles.lowLightText}>Move to brighter light</Text>
        </Animated.View>
      )}

      <EdgeFlashOverlay visible={flash && mode === 'face'} />

      {showUV && <UVPopup onClose={() => setShowUV(false)} insetTop={insets.top} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // ── Top ──────────────────────────────────────────────────
  topGradient: {
    position: 'absolute', top: 0, left: 0, right: 0,
    zIndex: 10, paddingHorizontal: 20, paddingBottom: 20,
  },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
  },
  topBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  profileImg: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.30)',
  },
  profilePlaceholder: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  sunBtnInner: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,215,50,0.10)',
    borderWidth: 1, borderColor: 'rgba(255,215,50,0.28)',
    justifyContent: 'center', alignItems: 'center',
  },
  wordmark: {
    flex: 1, textAlign: 'center',
    fontFamily: tokens.fonts.serif,
    fontSize: 17, fontWeight: '400',
    color: 'rgba(255,255,255,0.82)',
    letterSpacing: 0.12,
  },

  // Liquid glass capsule
  capsule: {
    width: CAPSULE_WIDTH, height: 36, borderRadius: 18,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 3, overflow: 'hidden',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.35)',
    position: 'relative',
  },
  pill: {
    position: 'absolute', left: 3,
    width: PILL_WIDTH, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.88)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12, shadowRadius: 4,
  },
  option: { width: PILL_WIDTH, height: 30, justifyContent: 'center', alignItems: 'center' },
  optionText: {
    fontFamily: tokens.fonts.regular, fontSize: 13,
    fontWeight: '500', color: 'rgba(255,255,255,0.6)', letterSpacing: 0.02,
  },
  optionTextActive: { color: tokens.colors.text },

  // ── Face guide ───────────────────────────────────────────
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

  // ── Bottom ───────────────────────────────────────────────
  bottomGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    zIndex: 10, paddingTop: 80, alignItems: 'center',
  },
  controls: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 28,
  },
  toggleRow: { marginTop: 12, alignSelf: 'stretch', alignItems: 'center' },
  scanHintRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 },
  compareRow: { alignItems: 'center', marginBottom: 10 },
  compareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 24, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  compareBtnPinkFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: tokens.colors.pinkDeep,
    opacity: 0.72,
  },
  compareBtnText: {
    fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '500',
    color: 'rgba(255,255,255,0.92)',
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

  // ── Product mode hint ─────────────────────────────────────
  productHintText: {
    fontFamily: tokens.fonts.regular, fontSize: 13,
    fontWeight: '300', color: 'rgba(255,255,255,0.5)', letterSpacing: 0.04,
  },

  // ── Low-light ────────────────────────────────────────────
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

  // ── UV Panel ──────────────────────────────────────────────
  bubbleBackdrop: { flex: 1 },
  uvPanel: {
    position: 'absolute', left: 12, right: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14, shadowRadius: 20, elevation: 16,
    padding: 16,
    overflow: 'hidden',
  },
  // Header
  uvCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 12,
  },
  uvCardEyebrow: {
    fontFamily: tokens.fonts.regular, fontSize: 9, fontWeight: '700',
    letterSpacing: 2, textTransform: 'uppercase',
    color: tokens.colors.grayLight, marginBottom: 3,
  },
  uvCardTitle: {
    fontFamily: tokens.fonts.regular, fontSize: 15, fontWeight: '700',
    color: tokens.colors.text,
  },
  uvIndexBadge: {
    alignItems: 'center', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1,
  },
  uvIndexNum: {
    fontFamily: tokens.fonts.serif, fontSize: 18, fontWeight: '400', lineHeight: 22,
  },
  uvIndexLbl: {
    fontFamily: tokens.fonts.regular, fontSize: 9, fontWeight: '700', letterSpacing: 1,
  },
  // Time window
  uvWindowRow: { gap: 5, marginBottom: 14 },
  uvWindowPill: {
    borderRadius: 50, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'flex-start',
  },
  uvWindowTime: {
    fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '700',
    color: '#FFFFFF', letterSpacing: 0.2,
  },
  uvWindowNote: {
    fontFamily: tokens.fonts.regular, fontSize: 11, fontWeight: '400',
    color: tokens.colors.gray, marginLeft: 2,
  },
  // Bar chart — bar area + label stacked vertically, no overlap
  uvBarChart: {
    flexDirection: 'row',
    height: MAX_BAR_H + 18, // bar area height + label height
    marginBottom: 10,
  },
  uvBarItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
  },
  uvBarArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end', // bar sits at the bottom of its area
  },
  uvBar: { width: 14, borderRadius: 4 },
  uvBarLabel: {
    height: 14,
    fontFamily: tokens.fonts.regular, fontSize: 8, fontWeight: '500',
    color: tokens.colors.grayLight, textAlign: 'center',
    marginTop: 3,
  },
  // Legend
  uvLegendRow: {
    flexDirection: 'row', gap: 14,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)',
    marginBottom: 10,
  },
  uvLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  uvLegendDot: { width: 8, height: 8, borderRadius: 4 },
  uvLegendText: {
    fontFamily: tokens.fonts.regular, fontSize: 11, fontWeight: '500',
    color: tokens.colors.text,
  },
  // Skin note
  uvSkinNote: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: tokens.colors.cream, borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 10,
  },
  uvSkinDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: tokens.colors.pinkDeep, flexShrink: 0,
  },
  uvSkinText: {
    flex: 1, fontFamily: tokens.fonts.regular, fontSize: 11,
    fontWeight: '400', color: tokens.colors.gray, lineHeight: 15,
  },

  // ── Permission screen ─────────────────────────────────────
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
