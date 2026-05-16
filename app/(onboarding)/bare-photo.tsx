import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Image, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import { FaceCorners } from '@/components/face-corners';
import { saveGloField } from '@/lib/glo-profile';

type Mode = 'choose' | 'camera' | 'preview';

export default function BarePhotoScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('choose');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const handlePickFromLibrary = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
      setMode('preview');
    }
  };

  const handleOpenCamera = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Camera access needed', 'Please enable camera access in Settings.');
        return;
      }
    }
    setMode('camera');
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, skipProcessing: true });
      if (photo?.uri) {
        setPhotoUri(photo.uri);
        setMode('preview');
      }
    } catch {
      Alert.alert('Camera error', 'Could not capture photo. Try again.');
    }
  };

  const handleConfirm = async () => {
    if (!photoUri) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await saveGloField({ bare_photo_uri: photoUri });
    router.push({ pathname: '/(onboarding)/processing', params: { uri: photoUri } });
  };

  const handleRetake = () => {
    Haptics.selectionAsync();
    setPhotoUri(null);
    setMode('choose');
  };

  if (mode === 'camera') {
    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="front" mode="picture" />
        <View style={styles.viewfinder}>
          <FaceCorners size={200} />
          <Text style={styles.hint}>Bare face · no makeup</Text>
        </View>
        <Animated.View entering={FadeIn.delay(200)} style={styles.cameraControls}>
          <Pressable onPress={() => setMode('choose')} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable onPress={handleTakePhoto} style={styles.shutter}>
            <View style={styles.shutterRing}>
              <View style={styles.shutterInner} />
            </View>
          </Pressable>
          <View style={{ width: 60 }} />
        </Animated.View>
      </View>
    );
  }

  if (mode === 'preview' && photoUri) {
    return (
      <View style={styles.previewContainer}>
        <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
        <View style={styles.previewOverlay}>
          <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.previewTop}>
            <Text style={styles.previewTitle}>Looks good?</Text>
            <Text style={styles.previewSub}>Make sure your face is fully visible and well-lit</Text>
          </Animated.View>
          <Animated.View entering={FadeInUp.delay(350).duration(600)} style={styles.previewBottom}>
            <GlassButton
              title="Looks perfect"
              onPress={handleConfirm}
              variant="primary"
              style={styles.cta}
            />
            <Pressable onPress={handleRetake} style={styles.retakeBtn}>
              <Text style={styles.retakeText}>Retake</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.delay(100).duration(700)} style={styles.header}>
        <Text style={styles.tag}>Bare face</Text>
        <Text style={styles.title}>Upload your{'\n'}bare-face photo.</Text>
        <Text style={styles.sub}>No makeup, no filter. This is the real you.</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300).duration(700)} style={styles.buttons}>
        <Pressable
          onPress={handlePickFromLibrary}
          style={({ pressed }) => [styles.choiceCard, pressed && styles.choiceCardPressed]}
        >
          <Text style={styles.choiceIcon}>🖼</Text>
          <Text style={styles.choiceLabel}>Choose from Library</Text>
          <Text style={styles.choiceDesc}>Pick an existing bare-face photo</Text>
        </Pressable>

        <Pressable
          onPress={handleOpenCamera}
          style={({ pressed }) => [styles.choiceCard, styles.choiceCardPrimary, pressed && styles.choiceCardPressed]}
        >
          <Text style={styles.choiceIcon}>📷</Text>
          <Text style={[styles.choiceLabel, styles.choiceLabelPrimary]}>Take a Photo</Text>
          <Text style={[styles.choiceDesc, styles.choiceDescPrimary]}>Use the camera now</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.darkBg,
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 50,
  },
  header: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  tag: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    letterSpacing: 0.16,
    textTransform: 'uppercase',
    color: tokens.colors.grayLight,
    fontWeight: '500',
    marginBottom: 20,
  },
  title: {
    fontFamily: tokens.fonts.serif,
    fontSize: 32,
    fontWeight: '400',
    color: tokens.colors.white,
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 14,
  },
  sub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '300',
    color: tokens.colors.grayLight,
    textAlign: 'center',
  },
  buttons: {
    gap: 14,
  },
  choiceCard: {
    backgroundColor: tokens.colors.darkBgLight,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(232,160,170,0.15)',
  },
  choiceCardPrimary: {
    backgroundColor: tokens.colors.pinkDeep,
    borderColor: tokens.colors.pinkDeep,
  },
  choiceCardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  choiceIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  choiceLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '500',
    color: tokens.colors.white,
  },
  choiceLabelPrimary: {
    color: tokens.colors.white,
  },
  choiceDesc: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '300',
    color: tokens.colors.grayLight,
  },
  choiceDescPrimary: {
    color: 'rgba(255,255,255,0.75)',
  },

  // Camera mode
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  viewfinder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  hint: {
    position: 'absolute',
    bottom: '28%',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    letterSpacing: 0.6,
    color: 'rgba(232,160,170,0.5)',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    zIndex: 10,
  },
  cancelBtn: {
    width: 60,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  shutter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterRing: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 3,
    borderColor: '#C49599',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },

  // Preview mode
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  preview: {
    flex: 1,
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    paddingBottom: 50,
    paddingTop: 24,
    backgroundColor: 'rgba(26,23,21,0.85)',
    gap: 20,
  },
  previewTop: {
    alignItems: 'center',
  },
  previewTitle: {
    fontFamily: tokens.fonts.serif,
    fontSize: 22,
    fontWeight: '400',
    color: tokens.colors.white,
    marginBottom: 6,
  },
  previewSub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '300',
    color: tokens.colors.grayLight,
    textAlign: 'center',
  },
  previewBottom: {
    alignItems: 'center',
    gap: 12,
  },
  cta: {
    width: '100%',
  },
  retakeBtn: {
    paddingVertical: 8,
  },
  retakeText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    color: tokens.colors.grayLight,
    textDecorationLine: 'underline',
  },
});
