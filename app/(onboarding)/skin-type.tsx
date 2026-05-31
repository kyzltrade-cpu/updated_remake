import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { OnboardingHeader } from '@/components/onboarding-header';
import { CalCard } from '@/components/cal-card';
import { saveGloField } from '@/lib/glo-profile';
import { tokens } from '@/components/theme';

const OPTIONS = [
  { id: 'normal',      icon: '☀️', label: 'Normal',      description: 'Balanced, rarely breaks out' },
  { id: 'oily',        icon: '💧', label: 'Oily',        description: 'Shiny by mid-morning' },
  { id: 'dry',         icon: '🌿', label: 'Dry',         description: 'Tight, sometimes flaky' },
  { id: 'combination', icon: '✨', label: 'Combination', description: 'Oily T-zone, dry cheeks' },
  { id: 'sensitive',   icon: '🌸', label: 'Sensitive',   description: 'Reacts easily, prone to redness' },
] as const;

type Id = typeof OPTIONS[number]['id'];

export default function SkinTypeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Id | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSelect = (id: Id) => {

    setSelected(id);
    Haptics.selectionAsync();
    saveGloField({ skin_type: id });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => router.push('/(onboarding)/frequency'), 480);
  };

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 32 }]}>
      <OnboardingHeader step={1} total={18} onBack={() => router.back()} />
      <View style={styles.body}>
        <Text style={styles.title}>What's your{'\n'}skin type?</Text>
        <Text style={styles.sub}>Helps us nail your foundation and coverage picks.</Text>
        <View style={styles.options}>
          {OPTIONS.map((o, i) => (
            <CalCard
              key={o.id}
              icon={o.icon}
              label={o.label}
              description={o.description}
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
