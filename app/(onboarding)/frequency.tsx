import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingHeader } from '@/components/onboarding-header';
import { CalCard } from '@/components/cal-card';
import { tokens } from '@/components/theme';
import { PartyPopper, Moon, Calendar, Sunrise } from 'lucide-react-native';

const OPTIONS = [
  { id: 'daily',     icon: (active: boolean) => <Sunrise size={20} color={active ? '#FFFFFF' : tokens.colors.pinkDeep} />, label: 'Every day',          description: 'Part of my daily routine' },
  { id: 'often',     icon: (active: boolean) => <Calendar size={20} color={active ? '#FFFFFF' : tokens.colors.pinkDeep} />, label: 'A few times a week', description: 'Most days but not always' },
  { id: 'sometimes', icon: (active: boolean) => <PartyPopper size={20} color={active ? '#FFFFFF' : tokens.colors.pinkDeep} />, label: 'Special occasions',  description: 'Events and weekends' },
  { id: 'rarely',    icon: (active: boolean) => <Moon size={20} color={active ? '#FFFFFF' : tokens.colors.pinkDeep} />, label: 'Rarely',             description: 'Just getting started' },
] as const;

type Id = typeof OPTIONS[number]['id'];

export default function FrequencyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Id | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSelect = (id: Id) => {

    setSelected(id);
    Haptics.selectionAsync();
    AsyncStorage.setItem('@remake_frequency', id);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => router.push('/(onboarding)/where-heard'), 480);
  };

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 32 }]}>
      <OnboardingHeader step={2} total={18} onBack={() => router.back()} />
      <View style={styles.body}>
        <Text style={styles.title}>How often do you{'\n'}wear makeup?</Text>
        <Text style={styles.sub}>Tells us how often to check in with you.</Text>
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
