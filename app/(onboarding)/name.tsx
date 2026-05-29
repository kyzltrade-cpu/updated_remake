import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { ob } from '@/components/onboarding-styles';
import { OnboardingHeader } from '@/components/onboarding-header';
import { GlassButton } from '@/components/glass-button';
import { tokens } from '@/components/theme';

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
    router.push('/(onboarding)/frequency');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.kav]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[ob.root, { paddingBottom: insets.bottom + 32 }]}>
        <OnboardingHeader step={1} total={11} onBack={() => router.back()} />

        <Animated.View entering={FadeInUp.delay(80).duration(500)} style={ob.header}>
          <Text style={ob.title}>What should we{'\n'}call you?</Text>
          <Text style={ob.sub}>We'll personalise your coaching just for you.</Text>
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

        <View style={ob.spacer} />

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
  kav: {
    flex: 1,
    backgroundColor: tokens.colors.cream,
  },
  input: {
    backgroundColor: tokens.colors.white,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontFamily: tokens.fonts.regular,
    fontSize: 18,
    color: tokens.colors.text,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
  },
  cta: { width: '100%' },
});
