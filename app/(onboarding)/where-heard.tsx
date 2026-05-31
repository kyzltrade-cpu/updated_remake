import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingHeader } from '@/components/onboarding-header';
import { CalCard } from '@/components/cal-card';
import { tokens } from '@/components/theme';

const OPTIONS = [
  { id: 'instagram',  icon: '📸', label: 'Instagram' },
  { id: 'tiktok',     icon: '🎵', label: 'TikTok' },
  { id: 'youtube',    icon: '▶️',  label: 'YouTube' },
  { id: 'friend',     icon: '👯', label: 'Friend or family' },
  { id: 'influencer', icon: '💄', label: 'Influencer / creator' },
  { id: 'search',     icon: '🔍', label: 'App Store search' },
  { id: 'other',      icon: '✨', label: 'Other' },
] as const;

type Id = typeof OPTIONS[number]['id'];

export default function WhereHeardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Id | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSelect = (id: Id) => {

    setSelected(id);
    Haptics.selectionAsync();
    AsyncStorage.setItem('@remake_source', id);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => router.push('/(onboarding)/tried-apps'), 480);
  };

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 32 }]}>
      <OnboardingHeader step={3} total={18} onBack={() => router.back()} />
      <View style={styles.body}>
        <Text style={styles.title}>Where did you{'\n'}hear about us?</Text>
        <Text style={styles.sub}>Helps us reach more people like you.</Text>
        <View style={styles.options}>
          {OPTIONS.map((o, i) => (
            <CalCard
              key={o.id}
              icon={o.icon}
              label={o.label}
              active={selected === o.id}
              onPress={() => handleSelect(o.id)}

              index={i}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.cream },
  body: { paddingHorizontal: 28, paddingTop: 20 },
  title: {
    fontFamily: tokens.fonts.serif,
    fontSize: 32,
    fontWeight: '400',
    color: tokens.colors.text,
    lineHeight: 42,
    marginBottom: 8,
  },
  sub: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '300',
    color: tokens.colors.gray,
    marginBottom: 28,
    lineHeight: 20,
  },
  options: { gap: 10 },
});
