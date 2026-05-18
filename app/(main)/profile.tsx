import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { tokens } from '@/components/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getScanHistory, getScanStats, type ScanRecord } from '@/lib/api/scan-storage';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [stats, setStats] = useState<{ totalScans: number; avgScore: number; currentStreak: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fullName: string = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? '';
  const firstName = fullName.split(' ')[0];

  const handleViewDna = () => {
    router.push('/(main)/dna-reveal');
  };

  useEffect(() => {
    if (!user) { setIsLoading(false); return; }

    const load = async () => {
      const [h, s] = await Promise.all([
        getScanHistory(user.id, 10),
        getScanStats(user.id),
      ]);
      setHistory(h);
      setStats(s);
      setIsLoading(false);
    };

    load();
  }, [user]);

  const displayStats = [
    [stats ? String(stats.totalScans) : '--', 'Scans'],
    [stats ? String(stats.currentStreak) : '--', 'Day Streak'],
    [stats ? String(stats.avgScore) : '--', 'Avg Score'],
  ];

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Hi, {firstName} ✨</Text>
        <Pressable onPress={() => router.push('/(main)/settings')} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
          <MaterialIcons name="settings" size={22} color={tokens.colors.text} />
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={[styles.statsRow, { marginTop: 16 }]}>
          {displayStats.map(([val, label]) => (
            <View key={label} style={styles.stat}>
              <Text style={styles.statVal}>{val}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(250).duration(600)} style={styles.dnaButtonWrap}>
          <Pressable
            style={({ pressed }) => [styles.dnaButton, pressed && { opacity: 0.85 }]}
            onPress={handleViewDna}
          >
            <Text style={styles.dnaButtonText}>View Your Beauty DNA ✨</Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.historySection}>
          <Text style={styles.sectionHeader}>Past Analyses</Text>

          {isLoading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Loading…</Text>
            </View>
          )}

          {!isLoading && history.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>◎</Text>
              <Text style={styles.emptyText}>No analyses yet.{'\n'}Complete your first scan to see it here.</Text>
            </View>
          )}

          {history.map((scan, i) => {
            const isGo = scan.verdict === 'GO';
            const score = Math.round(scan.overall_score);
            const prev = history[i + 1];
            const delta = prev ? Math.round(scan.overall_score - prev.overall_score) : null;

            return (
              <View key={scan.id} style={styles.scanRow}>
                <View style={styles.scanLeft}>
                  <View style={[styles.verdictDot, isGo ? styles.dotGo : styles.dotFix]} />
                  <View>
                    <Text style={styles.scanDate}>{formatDate(scan.created_at)}</Text>
                    {scan.coaching_compliment ? (
                      <Text style={styles.scanCompliment} numberOfLines={1}>
                        {scan.coaching_compliment}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <View style={styles.scanRight}>
                  <Text style={styles.scanScore}>{score}</Text>
                  {delta !== null && (
                    <Text style={[styles.scanDelta, delta >= 0 ? styles.deltaUp : styles.deltaDown]}>
                      {delta >= 0 ? '↑' : '↓'}{Math.abs(delta)}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.beige },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20,
  },
  back: { fontSize: 28, color: tokens.colors.text },
  title: { fontFamily: tokens.fonts.serif, fontSize: 22, fontWeight: '400', color: tokens.colors.text },
  spacer: { width: 22 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 28, paddingBottom: 50 },

  profileCard: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: tokens.colors.cream,
    borderWidth: 1, borderColor: tokens.colors.border,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  avatarText: { fontSize: 32, color: tokens.colors.pinkDeep },
  email: { fontFamily: tokens.fonts.regular, fontSize: 15, fontWeight: '500', color: tokens.colors.text },
  memberSince: { fontFamily: tokens.fonts.regular, fontSize: 12, color: tokens.colors.grayLight },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  stat: {
    flex: 1, backgroundColor: tokens.colors.white, borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: tokens.colors.border,
  },
  statVal: { fontFamily: tokens.fonts.serif, fontSize: 24, color: tokens.colors.pinkDeep, marginBottom: 4 },
  statLabel: { fontFamily: tokens.fonts.regular, fontSize: 11, color: tokens.colors.gray },

  dnaButtonWrap: { marginBottom: 32 },
  dnaButton: {
    width: '100%', paddingVertical: 16, borderRadius: 18,
    backgroundColor: tokens.colors.accent, alignItems: 'center',
    shadowColor: tokens.colors.pinkDeep, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 3,
  },
  dnaButtonText: {
    fontFamily: tokens.fonts.serif, fontSize: 16, fontWeight: '600',
    color: tokens.colors.white, letterSpacing: 0.5,
  },

  historySection: { gap: 10 },
  sectionHeader: {
    fontFamily: tokens.fonts.regular, fontSize: 11,
    letterSpacing: 0.16, textTransform: 'uppercase',
    color: tokens.colors.grayLight, fontWeight: '500',
    marginBottom: 4,
  },

  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyIcon: { fontSize: 40, color: tokens.colors.border },
  emptyText: {
    fontFamily: tokens.fonts.regular, fontSize: 14,
    color: tokens.colors.grayLight, textAlign: 'center', lineHeight: 22,
  },

  scanRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: tokens.colors.white, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: tokens.colors.border,
  },
  scanLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  verdictDot: { width: 8, height: 8, borderRadius: 4 },
  dotGo: { backgroundColor: '#2D7D46' },
  dotFix: { backgroundColor: '#C47A00' },
  scanDate: {
    fontFamily: tokens.fonts.regular, fontSize: 14,
    fontWeight: '500', color: tokens.colors.text,
  },
  scanCompliment: {
    fontFamily: tokens.fonts.regular, fontSize: 12,
    color: tokens.colors.grayLight, marginTop: 2,
    maxWidth: 200,
  },
  scanRight: { alignItems: 'flex-end', gap: 2 },
  scanScore: {
    fontFamily: tokens.fonts.serif, fontSize: 22,
    color: tokens.colors.text,
  },
  scanDelta: { fontFamily: tokens.fonts.regular, fontSize: 11, fontWeight: '600' },
  deltaUp: { color: '#2D7D46' },
  deltaDown: { color: '#B94040' },
});
