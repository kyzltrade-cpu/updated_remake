import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { tokens } from '@/components/theme';

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.spacer} />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>◎</Text>
          </View>
          <Text style={styles.email}>you@example.com</Text>
          <Text style={styles.memberSince}>Member since May 2026</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.statsRow}>
          {[['--', 'Scans'], ['--', 'Day Streak'], ['--', 'Avg Score']].map(([val, label]) => (
            <View key={label} style={styles.stat}>
              <Text style={styles.statVal}>{val}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.historySection}>
          <Text style={styles.sectionHeader}>Past Analyses</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>◎</Text>
            <Text style={styles.emptyText}>No analyses yet.{'\n'}Complete your first scan to see it here.</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.beige },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
  back: { fontSize: 28, color: tokens.colors.text },
  title: { fontFamily: tokens.fonts.regular, fontSize: 16, fontWeight: '500', color: tokens.colors.text },
  spacer: { width: 28 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 28, paddingBottom: 50 },
  profileCard: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: tokens.colors.cream, borderWidth: 1, borderColor: tokens.colors.border, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  avatarText: { fontSize: 32, color: tokens.colors.pinkDeep },
  email: { fontFamily: tokens.fonts.regular, fontSize: 15, fontWeight: '500', color: tokens.colors.text },
  memberSince: { fontFamily: tokens.fonts.regular, fontSize: 12, color: tokens.colors.grayLight },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  stat: { flex: 1, backgroundColor: tokens.colors.white, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: tokens.colors.border },
  statVal: { fontFamily: tokens.fonts.serif, fontSize: 24, color: tokens.colors.pinkDeep, marginBottom: 4 },
  statLabel: { fontFamily: tokens.fonts.regular, fontSize: 11, color: tokens.colors.gray },
  historySection: { gap: 16 },
  sectionHeader: { fontFamily: tokens.fonts.regular, fontSize: 11, letterSpacing: 0.16, textTransform: 'uppercase', color: tokens.colors.grayLight, fontWeight: '500' },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyIcon: { fontSize: 40, color: tokens.colors.border },
  emptyText: { fontFamily: tokens.fonts.regular, fontSize: 14, color: tokens.colors.grayLight, textAlign: 'center', lineHeight: 22 },
});