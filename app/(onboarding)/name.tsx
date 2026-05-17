import { useRef } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';

export default function NameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [name, setName] = useState('');

  const handleContinue = async () => {
    const clean = name.trim();
    if (!clean) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await AsyncStorage.setItem('@remake_user_name', clean);
    router.push('/(onboarding)/pain-point');
  };

  return (
    <KeyboardAvoidingView
      style={styles.kav}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.root, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.track}><View style={styles.fill} /></View>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { top: insets.top + 10 }]}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>

        <Animated.View entering={FadeInUp.delay(80).duration(500)} style={styles.header}>
          <Text style={styles.title}>What's your name?</Text>
          <Text style={styles.sub}>We'll personalise your coaching just for you.</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(220).duration(500)}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Your first name"
            placeholderTextColor={tokens.colors.grayLight}
            value={name}
            onChangeText={setName}
            autoFocus
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={40}
            returnKeyType="done"
            onSubmitEditing={handleContinue}
          />
        </Animated.View>

        <View style={styles.spacer} />

        <Animated.View entering={FadeInUp.delay(380).duration(500)}>
          <GlassButton
            title="Continue"
            onPress={handleContinue}
            variant="primary"
            style={styles.cta}
            disabled={!name.trim()}
          />
        </Animated.View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1, backgroundColor: tokens.colors.beige },
  root: { flex: 1, paddingHorizontal: 28 },
  track: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: tokens.colors.border, zIndex: 10 },
  fill: { height: '100%', width: '5%', backgroundColor: tokens.colors.pinkDeep },
  backBtn: {
    position: 'absolute', left: 20, zIndex: 10,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: tokens.colors.white,
    borderWidth: 1, borderColor: tokens.colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  backIcon: { fontSize: 20, color: tokens.colors.text, lineHeight: 22 },
  header: { marginBottom: 32 },
  title: {
    fontFamily: tokens.fonts.serif,
    fontSize: 32,
    fontWeight: '400',
    color: tokens.colors.text,
    lineHeight: 42,
    marginBottom: 10,
  },
  sub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '300',
    color: tokens.colors.gray,
    lineHeight: 22,
  },
  input: {
    backgroundColor: tokens.colors.white,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontFamily: tokens.fonts.regular,
    fontSize: 18,
    color: tokens.colors.text,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
  },
  spacer: { flex: 1, minHeight: 40 },
  cta: { width: '100%' },
});
