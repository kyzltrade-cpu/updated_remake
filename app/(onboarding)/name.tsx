import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import {
  View, Text, StyleSheet, TextInput,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokens } from '@/components/theme';
import { GlassButton } from '@/components/glass-button';
import * as Haptics from 'expo-haptics';

export default function NameScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleContinue = async () => {
    const clean = name.trim();
    if (!clean) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await AsyncStorage.setItem('@remake_user_name', clean);
    router.push('/(onboarding)/skill');
  };

  return (
    <KeyboardAvoidingView
      style={styles.kav}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.header}>
          <Text style={styles.title}>What's your name?</Text>
          <Text style={styles.sub}>We'll personalise your coaching just for you.</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(280).duration(600)} style={styles.inputWrap}>
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

        <Animated.View entering={FadeInUp.delay(450).duration(600)} style={styles.bottom}>
          <GlassButton
            title="Continue"
            onPress={handleContinue}
            variant="primary"
            style={styles.cta}
            disabled={!name.trim()}
          />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1, backgroundColor: tokens.colors.beige },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 100, paddingBottom: 50 },
  header: { marginBottom: 40 },
  title: {
    fontFamily: tokens.fonts.serif,
    fontSize: 36,
    fontWeight: '400',
    color: tokens.colors.text,
    lineHeight: 46,
    marginBottom: 12,
  },
  sub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '300',
    color: tokens.colors.gray,
    lineHeight: 22,
  },
  inputWrap: {},
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
  bottom: {},
  cta: { width: '100%' },
});
