import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
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

type ScanMode = 'face' | 'product';

const CAPSULE_WIDTH = 172;
const PILL_WIDTH = 82;

function SettingsSparkle({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.pfpBtn, pressed && styles.pfpBtnPressed]}>
      <View style={styles.pfpGlow}>
        <View style={styles.pfpGlowInner} />
      </View>
      <View style={styles.pfpBtnRing}>
        <MaterialIcons name="person" size={22} color={tokens.colors.gold} />
      </View>
    </Pressable>
  );
}

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
  frame: {
    width: 240,
    height: 140,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: tokens.colors.pinkDeep,
    borderWidth: 0,
  },
  tl: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 4 },
  tr: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 4 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 4 },
  br: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 4 },
  scanLine: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 1.5,
    backgroundColor: 'rgba(232,160,170,0.6)',
    borderRadius: 1,
  },
});

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState(false);
  const [mode, setMode] = useState<ScanMode>('face');
  const [scanned, setScanned] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const { settings } = useSettings();

  const pillX = useSharedValue(0);
  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
  }));

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

  const handleBarcode = ({ data, type }: { data: string; type: string }) => {
    if (scanned || mode !== 'product') return;
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // TODO: route to product analysis screen when built
    router.push({ pathname: '/(main)/scan/loading', params: { barcode: data, barcodeType: type } });
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.permissionText}>Camera access is needed to scan.</Text>
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
        facing={mode === 'face' ? 'front' : 'back'}
        mode="picture"
        onBarcodeScanned={mode === 'product' ? handleBarcode : undefined}
        barcodeScannerSettings={
          mode === 'product'
            ? { barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'] }
            : undefined
        }
      />

      {/* Viewfinder overlay — face guide or barcode frame */}
      <View style={styles.viewfinder}>
        {mode === 'face' ? (
          <>
            <FaceCorners size={200} />
            <Text style={styles.hint}>Align your face</Text>
          </>
        ) : (
          <>
            <BarcodeCorners />
            <Text style={styles.hint}>Point at product barcode</Text>
          </>
        )}
      </View>

      {/* Top bar: settings left, REMAKE + toggle centre */}
      <Animated.View entering={FadeIn.delay(200)} style={[styles.topBar, { paddingTop: insets.top + 14 }]}>
        <SettingsSparkle onPress={() => router.push('/(main)/settings')} />

        {/* REMAKE wordmark + liquid glass mode toggle */}
        <View style={styles.topCentre}>
          <Text style={styles.wordmark}>REMAKE</Text>

          <BlurView tint="light" intensity={28} style={styles.capsule}>
            {/* Sliding pill */}
            <Animated.View style={[styles.pill, pillStyle]} />

            <Pressable style={styles.option} onPress={() => switchMode('face')}>
              <Text style={[styles.optionText, mode === 'face' && styles.optionTextActive]}>
                Face
              </Text>
            </Pressable>

            <Pressable style={styles.option} onPress={() => switchMode('product')}>
              <Text style={[styles.optionText, mode === 'product' && styles.optionTextActive]}>
                Product
              </Text>
            </Pressable>
          </BlurView>
        </View>

        {/* Right spacer matches pfpBtn width for centering */}
        <View style={styles.topSpacer} />
      </Animated.View>

      {/* Bottom controls — only shown in face mode */}
      {mode === 'face' && (
        <Animated.View entering={FadeIn.delay(300)} style={[styles.controls, { paddingBottom: insets.bottom + 50 }]}>
          <Pressable onPress={pickImage} style={({ pressed }) => [styles.galleryBtn, pressed && styles.galleryBtnPressed]}>
            <GalleryIcon />
          </Pressable>

          <Pressable onPress={takePhoto} style={({ pressed }) => [styles.shutter, pressed && styles.shutterPressed]}>
            <View style={styles.shutterRing}>
              <View style={styles.shutterInner} />
            </View>
          </Pressable>

          <Pressable onPress={toggleFlash} style={({ pressed }) => [styles.sideBtn, pressed && styles.sideBtnPressed]}>
            <FlashIcon active={flash} />
          </Pressable>
        </Animated.View>
      )}

      {/* Product mode bottom hint */}
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

      <EdgeFlashOverlay visible={flash && mode === 'face'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },

  viewfinder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  hint: {
    position: 'absolute',
    bottom: '30%',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    letterSpacing: 0.6,
    color: 'rgba(232,160,170,0.4)',
    textTransform: 'uppercase',
    fontWeight: '500',
  },

  // Top bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 22,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  topCentre: {
    alignItems: 'center',
    gap: 10,
  },
  wordmark: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.2,
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
  },
  topSpacer: {
    width: 56,
  },

  // Liquid glass capsule
  capsule: {
    width: CAPSULE_WIDTH,
    height: 36,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 3,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.35)',
    position: 'relative',
  },
  pill: {
    position: 'absolute',
    left: 3,
    width: PILL_WIDTH,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.88)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  option: {
    width: PILL_WIDTH,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.02,
  },
  optionTextActive: {
    color: tokens.colors.text,
  },

  // PFP button
  pfpBtn: { width: 56, height: 56, justifyContent: 'center', alignItems: 'center' },
  pfpBtnPressed: { transform: [{ scale: 0.93 }] },
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

  // Bottom controls (face mode)
  controls: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 36, zIndex: 10,
  },
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
  galleryBtn: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  galleryBtnPressed: { transform: [{ scale: 0.90 }] },
  sideBtn: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  sideBtnPressed: { transform: [{ scale: 0.90 }] },

  // Product mode bottom hint
  productHint: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  productHintText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.04,
  },

  // Permission screen
  permissionText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  permissionBtn: {
    backgroundColor: tokens.colors.gold,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 20,
  },
  permissionBtnText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
});
