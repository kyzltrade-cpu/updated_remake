import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View, Text, StyleSheet, TextInput, Alert,
  KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signUp, signInDev, DEV_BYPASS } from '@/lib/auth';
import { isValidEmail, isValidPassword, sanitizeEmail } from '@/lib/validation';
import { clearGloDraft } from '@/lib/glo-profile';
import * as Haptics from 'expo-haptics';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { tokens } from '@/components/theme';

const DNA_CHIPS = [
  { glyph: '◯', label: 'Foundation Shade' },
  { glyph: '✦', label: 'Colour Season' },
  { glyph: '⬭', label: 'Face Shape' },
  { glyph: '—', label: 'Brow Blueprint' },
  { glyph: '✦', label: 'Lash Profile' },
  { glyph: '◉', label: 'Energy Type' },
  { glyph: '♡', label: 'Lip Profile' },
  { glyph: '◉', label: 'Blush Profile' },
  { glyph: '✦', label: 'Beauty Archetype' },
  { glyph: '♡', label: 'Beauty Wrapped' },
];

export default function CreateAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validate = (): boolean => {
    let valid = true;
    const cleanEmail = sanitizeEmail(email);
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      setEmailError('Enter a valid email address');
      valid = false;
    } else setEmailError('');
    if (!isValidPassword(password)) {
      setPasswordError('At least 8 characters with a letter and number');
      valid = false;
    } else setPasswordError('');
    return valid;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      if (DEV_BYPASS) {
        await signInDev();
        await clearGloDraft();
        router.replace('/(onboarding)/dna-loading');
        return;
      }
      const { error } = await signUp(sanitizeEmail(email), password);
      if (error) {
        Alert.alert('Sign up failed', error.message);
      } else {
        await clearGloDraft();
        router.replace('/(onboarding)/dna-loading');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(onboarding)/dna-loading');
  };

  return (
    <View style={styles.root}>
      {/* Warm ivory-to-blush background */}
      <LinearGradient
        colors={['#FFF5F2', '#FBE8E3', '#FAD8DD']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Back */}
      <Pressable onPress={() => router.back()} style={[styles.backBtn, { top: insets.top + 10 }]}>
        <MaterialIcons name="chevron-left" size={26} color={tokens.colors.pinkRich} />
      </Pressable>

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.inner, { paddingTop: insets.top + 54, paddingBottom: insets.bottom + 24 }]}>

          {/* Header */}
          <Animated.View entering={FadeInUp.delay(80).duration(500)} style={styles.header}>
            <Text style={styles.eyebrow}>Your results are ready</Text>
            <Text style={styles.title}>Unlock your{'\n'}Beauty DNA.</Text>
          </Animated.View>

          {/* DNA chip grid */}
          <Animated.View entering={FadeIn.delay(180).duration(700)} style={styles.chipSection}>
            <Text style={styles.chipSectionLabel}>10 results · locked</Text>
            <View style={styles.chipGrid}>
              {DNA_CHIPS.map((chip) => (
                <View key={chip.label} style={styles.chip}>
                  <Text style={styles.chipGlyph}>{chip.glyph}</Text>
                  <Text style={styles.chipLabel}>{chip.label}</Text>
                  <MaterialIcons name="lock" size={8} color={tokens.colors.pinkMid} />
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Divider */}
          <Animated.View entering={FadeIn.delay(260).duration(500)} style={styles.divider} />

          {/* Form */}
          <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={[styles.input, emailError ? styles.inputError : null]}
                placeholder="you@example.com"
                placeholderTextColor="rgba(61,53,50,0.28)"
                value={email}
                onChangeText={t => { setEmail(t); if (emailError) setEmailError(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.inputFlex, passwordError ? styles.inputError : null]}
                  placeholder="Min. 8 chars, 1 letter, 1 number"
                  placeholderTextColor="rgba(61,53,50,0.28)"
                  value={password}
                  onChangeText={t => { setPassword(t); if (passwordError) setPasswordError(''); }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable onPress={() => setShowPassword(v => !v)} hitSlop={10}>
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color={tokens.colors.gray}
                  />
                </Pressable>
              </View>
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            </View>
          </Animated.View>

          <View style={styles.spacer} />

          {/* Actions */}
          <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.actions}>
            <Pressable
              onPress={handleCreate}
              disabled={loading}
              style={({ pressed }) => [styles.cta, pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] }, loading && { opacity: 0.55 }]}
            >
              <LinearGradient
                colors={[tokens.colors.pinkDeep, tokens.colors.pinkRich]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                <Text style={styles.ctaText}>
                  {loading ? 'Creating account…' : 'Reveal My Beauty DNA'}
                </Text>
                {!loading && <MaterialIcons name="arrow-forward" size={16} color="#fff" />}
              </LinearGradient>
            </Pressable>
            <Text style={styles.legal}>
              By continuing you agree to our Terms of Service and Privacy Policy.
            </Text>
            <Pressable onPress={handleSkip} hitSlop={8} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip for now</Text>
            </Pressable>
          </Animated.View>

        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.ivory },
  kav: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
  },

  // Header
  header: { marginBottom: 24 },
  eyebrow: {
    fontFamily: tokens.fonts.regular,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3.2,
    textTransform: 'uppercase',
    color: tokens.colors.pinkDeep,
    marginBottom: 8,
  },
  title: {
    fontFamily: tokens.fonts.serif,
    fontSize: 36,
    fontWeight: '400',
    color: tokens.colors.text,
    lineHeight: 46,
  },

  // Chip grid
  chipSection: { marginBottom: 20 },
  chipSectionLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2.2,
    color: tokens.colors.pinkMid,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  chipGlyph: {
    fontFamily: tokens.fonts.serif,
    fontSize: 10,
    color: tokens.colors.pinkDeep,
    lineHeight: 14,
  },
  chipLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 10,
    fontWeight: '500',
    color: tokens.colors.gray,
    letterSpacing: 0.1,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: tokens.colors.border,
    marginBottom: 20,
  },

  // Form
  form: { gap: 12 },
  field: { gap: 6 },
  fieldLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.gray,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    color: tokens.colors.text,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
  },
  inputFlex: { flex: 1 },
  inputError: { borderColor: tokens.colors.pinkDeep },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  errorText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    color: tokens.colors.pinkDeep,
    marginTop: 2,
  },

  spacer: { flex: 1, minHeight: 20 },

  // Actions
  actions: { alignItems: 'center', gap: 10 },
  cta: {
    width: '100%',
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 28,
  },
  ctaText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
  legal: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    color: 'rgba(61,53,50,0.38)',
    textAlign: 'center',
    lineHeight: 17,
  },
  skipBtn: { paddingVertical: 4 },
  skipText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    color: tokens.colors.gray,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
