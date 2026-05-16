import { useRouter } from 'expo-router';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, Alert, Image,
  Modal, Linking, ActivityIndicator,
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
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import { FaceCorners } from '@/components/face-corners';
import { EdgeFlashOverlay } from '@/components/edge-flash';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSettings } from '@/contexts/settings-context';
import { fetchUVIndex, type UVData } from '@/lib/uv';

type ScanMode = 'face' | 'product';

const CAPSULE_WIDTH = 172;
const PILL_WIDTH = 82;
const LOW_LIGHT_EV_THRESHOLD = 1.5;

const MOCK_UV: UVData = {
  uvIndex: 6,
  category: 'High',
  color: '#E88C39',
  spfRecommendation: 'Apply SPF 50',
  tanningAdvice: 'Brief sessions only — 15 min max',
};

// ── UV Popup ──────────────────────────────────────────────────────────────────

function UVPopup({ onClose, insetTop }: { onClose: () => void; insetTop: number }) {
  const [uv, setUV] = useState<UVData | null>(null);
  const [loading, setLoading] = useState(true);
  const [noPermission, setNoPermission] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        setNoPermission(true);
        setLoading(false);
        return;
      }
      setUV(MOCK_UV);
      setLoading(false);
    })();
  }, []);

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.popupBackdrop} onPress={onClose}>
        <Animated.View
          entering={FadeInUp.duration(220)}
          style={[styles.popupCard, { marginTop: insetTop + 64 }]}
        >
          <View style={styles.popupHeader}>
            <Text style={styles.popupTitle}>☀️  UV Index</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <MaterialIcons name="close" size={18} color={tokens.colors.grayLight} />
            </Pressable>
          </View>
          <View style={styles.popupDivider} />

          {loading && (
            <View style={styles.popupLoading}>
              <ActivityIndicator color={tokens.colors.pinkDeep} />
              <Text style={styles.popupLoadingText}>Checking UV levels…</Text>
            </View>
          )}
          {!loading && noPermission && (
            <View style={styles.popupBody}>
              <Text style={styles.popupNoPermText}>Location access is needed to check UV levels.</Text>
              <Pressable style={styles.popupSettingsBtn} onPress={() => Linking.openSettings()}>
                <Text style={styles.popupSettingsBtnText}>Open Settings</Text>
              </Pressable>
            </View>
          )}
          {!loading && !noPermission && uv === null && (
            <View style={styles.popupBody}>
              <Text style={styles.popupNoPermText}>Couldn't load UV data. Check your connection.</Text>
            </View>
          )}
          {!loading && !noPermission && uv !== null && (
            <View style={styles.popupBody}>
              <View style={styles.uvNumRow}>
                <View style={[styles.uvBadge, { backgroundColor: uv.color + '22' }]}>
                  <Text style={[styles.uvNum, { color: uv.color }]}>{uv.uvIndex}</Text>
                </View>
                <View>
                  <Text style={[styles.uvCategory, { color: uv.color }]}>{uv.category}</Text>
                  <Text style={styles.uvCategorySub}>UV Index right now</Text>
                </View>
              </View>
              <View style={styles.popupDivider} />
              <View style={styles.adviceRow}>
                <Text style={styles.adviceIcon}>🧴</Text>
                <View style={styles.adviceText}>
                  <Text style={styles.adviceLabel}>Sunscreen</Text>
                  <Text style={styles.adviceValue}>{uv.spfRecommendation}</Text>
                </View>
              </View>
              <View style={styles.adviceRow}>
                <Text style={styles.adviceIcon}>🌊</Text>
                <View style={styles.adviceText}>
                  <Text style={styles.adviceLabel}>Tanning</Text>
                  <Text style={styles.adviceValue}>{uv.tanningAdvice}</Text>
                </View>
              </View>
              <View style={styles.popupDivider} />
              <Text style={styles.uvSource}>📍 Based on your current location</Text>
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
      <View style={barcodeStyles.scanLine} />
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
  scanLine: {
    position: 'absolute', left: 12, right: 12, height: 1.5,
    backgroundColor: 'rgba(232,57,154,0.6)', borderRadius: 1,
  },
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
  const { settings, profilePhoto } = useSettings();

  const pillX = useSharedValue(0);
  const pillStyle = useAnimatedStyle(() => ({ transform: [{ translateX: pillX.value }] }));

  useEffect(() => {
    if (permission === null) requestPermission();
  }, []);

  const switchMode = (next: ScanMode) => {
    if (next === mode) return;
    Haptics.selectionAsync();
    setScanned(false);
    setMode(next);
    pillX.value = withTiming(next === 'face' ? 0 : PILL_WIDTH + 4, {
      duration: 260,
      easing: Easing.out(Easing.quad),
    });
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
      if (ev !== null && ev < LOW_LIGHT_EV_THRESHOLD) {
        setShowLowLight(true);
        setTimeout(() => setShowLowLight(false), 3500);
      }
      router.push({ pathname: '/(main)/scan/preview', params: { uri: photo.uri } });
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

  const openUV = useCallback(() => {
    if (settings.hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowUV(true);
  }, [settings.hapticsEnabled]);

  const handleBarcode = ({ data, type }: { data: string; type: string }) => {
    if (scanned || mode !== 'product') return;
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push({ pathname: '/(main)/scan/loading', params: { barcode: data, barcodeType: type } });
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
            onPress={() => router.push('/(main)/settings')}
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

          {/* REMAKE wordmark + liquid glass mode toggle */}
          <View style={styles.topCentre}>
            <Text style={styles.wordmark}>REMAKE</Text>
            <BlurView tint="light" intensity={28} style={styles.capsule}>
              <Animated.View style={[styles.pill, pillStyle]} />
              <Pressable style={styles.option} onPress={() => switchMode('face')}>
                <Text style={[styles.optionText, mode === 'face' && styles.optionTextActive]}>Face</Text>
              </Pressable>
              <Pressable style={styles.option} onPress={() => switchMode('product')}>
                <Text style={[styles.optionText, mode === 'product' && styles.optionTextActive]}>Product</Text>
              </Pressable>
            </BlurView>
          </View>

          {/* UV sun button */}
          <Pressable
            onPress={openUV}
            style={({ pressed }) => [styles.topBtn, pressed && { opacity: 0.65 }]}
          >
            <View style={styles.sunBtnInner}>
              <MaterialIcons name="wb-sunny" size={19} color="rgba(255,220,100,0.92)" />
            </View>
          </Pressable>
        </Animated.View>
      </LinearGradient>

      {/* Bottom gradient + controls — face mode only */}
      {mode === 'face' && (
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.42)', 'rgba(0,0,0,0.82)']}
          locations={[0, 0.35, 1]}
          style={[styles.bottomGradient, { paddingBottom: insets.bottom + 44 }]}
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
      )}

      {/* Product mode hint */}
      {mode === 'product' && (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[styles.productHint, { paddingBottom: insets.bottom + 36 }]}
        >
          <Text style={styles.productHintText}>
            {scanned ? 'Scanned — analysing product...' : 'Hold steady over the barcode'}
          </Text>
        </Animated.View>
      )}

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
    zIndex: 10, paddingHorizontal: 20, paddingBottom: 60,
  },
  topBar: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
  },
  topBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
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
    backgroundColor: 'rgba(255,220,100,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,220,100,0.28)',
    justifyContent: 'center', alignItems: 'center',
  },
  topCentre: { alignItems: 'center', gap: 10 },
  wordmark: {
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
    zIndex: 10, paddingTop: 52, alignItems: 'center',
  },
  controls: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 40,
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
  productHint: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    alignItems: 'center', zIndex: 10,
  },
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

  // ── UV Popup ─────────────────────────────────────────────
  popupBackdrop: { flex: 1, paddingHorizontal: 20, alignItems: 'flex-end' },
  popupCard: {
    width: 260, backgroundColor: tokens.colors.white,
    borderRadius: 20, borderWidth: 1, borderColor: tokens.colors.border,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18, shadowRadius: 20, elevation: 16,
  },
  popupHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 14,
  },
  popupTitle: {
    fontFamily: tokens.fonts.regular, fontSize: 14,
    fontWeight: '600', color: tokens.colors.text, letterSpacing: 0.1,
  },
  popupDivider: { height: 1, backgroundColor: tokens.colors.border },
  popupBody: { paddingHorizontal: 18, paddingVertical: 16, gap: 14 },
  popupLoading: { paddingVertical: 24, alignItems: 'center', gap: 10 },
  popupLoadingText: {
    fontFamily: tokens.fonts.regular, fontSize: 13, color: tokens.colors.grayLight,
  },
  popupNoPermText: {
    fontFamily: tokens.fonts.regular, fontSize: 13, color: tokens.colors.gray, lineHeight: 19,
  },
  popupSettingsBtn: {
    backgroundColor: tokens.colors.pinkDeep, borderRadius: 12,
    paddingVertical: 10, alignItems: 'center',
  },
  popupSettingsBtnText: {
    fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '600', color: '#fff',
  },
  uvNumRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  uvBadge: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  uvNum: { fontFamily: tokens.fonts.serif, fontSize: 28, fontWeight: '400' },
  uvCategory: { fontFamily: tokens.fonts.regular, fontSize: 15, fontWeight: '600' },
  uvCategorySub: {
    fontFamily: tokens.fonts.regular, fontSize: 11, color: tokens.colors.grayLight, marginTop: 2,
  },
  adviceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  adviceIcon: { fontSize: 18, marginTop: 1 },
  adviceText: { flex: 1, gap: 2 },
  adviceLabel: {
    fontFamily: tokens.fonts.regular, fontSize: 10,
    fontWeight: '600', letterSpacing: 0.4,
    color: tokens.colors.grayLight, textTransform: 'uppercase',
  },
  adviceValue: {
    fontFamily: tokens.fonts.regular, fontSize: 13, color: tokens.colors.text, lineHeight: 18,
  },
  uvSource: { fontFamily: tokens.fonts.regular, fontSize: 11, color: tokens.colors.grayLight },

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
