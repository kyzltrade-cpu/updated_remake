import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Alert, Dimensions } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Animated, { FadeInUp, FadeIn, Layout, SlideInRight, ZoomIn } from 'react-native-reanimated';
import { tokens } from '@/components/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getScanHistory, getScanStats, type ScanRecord } from '@/lib/api/scan-storage';
import { getOnboardingData } from '@/lib/onboarding-store';
import { useSettings } from '@/contexts/settings-context';
import { useSubscription } from '@/contexts/subscription-context';
import { createClient } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';

const { width: W } = Dimensions.get('window');

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const SEASON_PALETTES: Record<string, string[]> = {
  'Warm Spring':  ['#E8744A', '#F0A882', '#F5C86A', '#C86430', '#F5DDB0', '#F2E4D0'],
  'Light Spring': ['#F4A090', '#F9C8A8', '#F4D878', '#E8906A', '#FBE8D0', '#FDE8D8'],
  'Warm Autumn':  ['#B84C20', '#C8774A', '#8B6914', '#6B3A1F', '#C8956A', '#D4AA78'],
  'Deep Autumn':  ['#8B2810', '#A84020', '#5C3418', '#3A1C0C', '#C87840', '#8B5828'],
  'Cool Summer':  ['#C49098', '#A8B0C8', '#B898C0', '#786880', '#E8D0D8', '#C8C0D0'],
  'Light Summer': ['#E8B0BC', '#C8D4E0', '#D8C0E0', '#A09098', '#F0DDE4', '#E8DCE8'],
  'Deep Winter':  ['#8C0028', '#1A2B70', '#1A5C38', '#500080', '#C0B090', '#0A2A58'],
  'Cool Winter':  ['#780060', '#2840A0', '#007060', '#483060', '#C8C8D8', '#5068B0'],
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { settings, profilePhoto, setProfilePhoto } = useSettings();
  const { subscription } = useSubscription();
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [stats, setStats] = useState<{ totalScans: number; avgScore: number; currentStreak: number } | null>(null);
  const [dna, setDna] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingName, setOnboardingName] = useState('');
  const [expandedScanId, setExpandedScanId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dna' | 'safety'>('dna');

  const isPro = subscription?.plan === 'pro';

  useEffect(() => {
    getOnboardingData().then(data => { if (data.name) setOnboardingName(data.name); });
  }, []);

  const handleViewDna = () => {
    if (settings.hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isPro) {
      router.push({
        pathname: '/(main)/dna-reveal',
        params: dna ? { dna: JSON.stringify(dna) } : {},
      } as any);
    } else {
      router.push('/(main)/paywall');
    }
  };

  const loadData = async () => {
    if (!user) { setIsLoading(false); return; }
    try {
      const [h, s, supabaseRes] = await Promise.all([
        getScanHistory(user.id, 10),
        getScanStats(user.id),
        createClient().from('profiles').select('dna_result').eq('id', user.id).maybeSingle()
      ]);
      setHistory(h);
      setStats(s);
      const profileData = supabaseRes.data as any;
      if (profileData?.dna_result) {
        setDna(profileData.dna_result);
      }
    } catch (e) {
      console.warn('[Profile] Failed to load data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handlePickAvatar = async () => {
    if (settings.hapticsEnabled) Haptics.selectionAsync();
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.6,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!result.canceled && result.assets[0]?.uri) {
        await setProfilePhoto(result.assets[0].uri);
        if (settings.hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update profile photo.');
    }
  };

  const handleShareScan = async (scan: ScanRecord) => {
    if (settings.hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('Sharing Unavailable', 'Native sharing is not supported on this device.');
      return;
    }
    try {
      // Formulate a beautiful message
      const text = `✨ My Skin Health Score is ${Math.round(scan.overall_score)}/100 on Remake! 🌸\nVerdict: ${scan.verdict === 'GO' ? 'Clean & Acne-Safe! ✅' : 'Exposed Bad Ingredients! 🛑'}\n"${scan.coaching_compliment}"\nGet your free scan at remake.beauty 💖`;
      await Sharing.shareAsync('https://remake.beauty', { dialogTitle: 'Share Scan Results', mimeType: 'text/plain' });
    } catch (e) {
      console.warn('[Profile] Sharing failed:', e);
    }
  };

  const toggleExpandScan = (id: string) => {
    if (settings.hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedScanId(expandedScanId === id ? null : id);
  };

  const paletteColors = dna?.colorSeason ? SEASON_PALETTES[dna.colorSeason] : null;

  return (
    <View style={styles.container}>
      {/* Absolute Header Ambient Glow */}
      <View style={styles.ambientGlow} pointerEvents="none" />

      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.iconCircle} hitSlop={8}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Vanity File</Text>
        <Pressable 
          onPress={() => {
            if (settings.hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/(main)/settings');
          }} 
          style={styles.iconCircle}
          hitSlop={8}
        >
          <MaterialIcons name="settings" size={20} color={tokens.colors.text} />
        </Pressable>
      </View>

      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.userCard}>
          <Pressable onPress={handlePickAvatar} style={styles.avatarContainer}>
            <View style={styles.makeupRingBorder}>
              <View style={styles.makeupRingBorderInner}>
                {profilePhoto ? (
                  <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>
                    {(user?.email?.[0] ?? 'U').toUpperCase()}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.editBadge}>
              <MaterialIcons name="photo-camera" size={10} color={tokens.colors.white} />
            </View>
          </Pressable>

          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>hi, bestie ✨</Text>
              <View style={[styles.proBadge, isPro && styles.proBadgeActive]}>
                <Text style={styles.proBadgeText}>{isPro ? 'PRO ✦' : 'FREE'}</Text>
              </View>
            </View>
            <Text style={styles.userSubtitle}>
              {stats?.avgScore && stats.avgScore >= 80 
                ? 'Barrier Protected & Glowing 🌸' 
                : 'Curating Skin Health 🧬'}
            </Text>
          </View>
        </Animated.View>

        {/* Stats Pod Grid */}
        <Animated.View entering={FadeInUp.delay(150).duration(500)} style={styles.statsGrid}>
          <Pressable 
            style={({ pressed }) => [styles.statCard, pressed && styles.statCardPressed]}
            onPress={() => {
              if (settings.hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(main)/wrapped');
            }}
          >
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statVal}>{stats ? stats.currentStreak : '--'}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </Pressable>

          <Pressable 
            style={({ pressed }) => [styles.statCard, pressed && styles.statCardPressed]}
            onPress={() => {
              if (settings.hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(main)/wrapped');
            }}
          >
            <Text style={styles.statEmoji}>📸</Text>
            <Text style={styles.statVal}>{stats ? stats.totalScans : '--'}</Text>
            <Text style={styles.statLabel}>Total Scans</Text>
          </Pressable>

          <Pressable 
            style={({ pressed }) => [styles.statCard, pressed && styles.statCardPressed]}
            onPress={() => {
              if (settings.hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(main)/wrapped');
            }}
          >
            <Text style={styles.statEmoji}>💖</Text>
            <Text style={styles.statVal}>{stats ? `${stats.avgScore}%` : '--'}</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </Pressable>
        </Animated.View>

        {/* Segment Tabs */}
        <Animated.View entering={FadeInUp.delay(180).duration(500)} style={styles.tabsContainer}>
          <Pressable 
            onPress={() => {
              if (settings.hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('dna');
            }}
            style={[styles.tabButton, activeTab === 'dna' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabButtonText, activeTab === 'dna' && styles.tabButtonTextActive]}>
              Beauty DNA ✦
            </Text>
          </Pressable>
          <Pressable 
            onPress={() => {
              if (settings.hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('safety');
            }}
            style={[styles.tabButton, activeTab === 'safety' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabButtonText, activeTab === 'safety' && styles.tabButtonTextActive]}>
              Skin Guard 🛡️
            </Text>
          </Pressable>
        </Animated.View>

        {/* Dynamic Panel */}
        <Animated.View entering={FadeInUp.delay(200).duration(500)}>
          {activeTab === 'dna' ? (
            (dna && isPro) ? (
              <View style={styles.dnaActiveCard}>
                <View style={styles.dnaHeader}>
                  <View>
                    <Text style={styles.dnaEyebrow}>YOUR ARCHETYPE</Text>
                    <Text style={styles.dnaTitle}>{dna.archetype || 'The Natural'}</Text>
                  </View>
                  <View style={styles.dnaSparkleIcon}>
                    <Text style={{ fontSize: 18 }}>✦</Text>
                  </View>
                </View>

                <View style={styles.dnaDivider} />

                {/* Grid of details */}
                <View style={styles.dnaDetailGrid}>
                  <View style={styles.dnaGridItem}>
                    <Text style={styles.dnaItemLabel}>Color Season</Text>
                    <Text style={styles.dnaItemValue}>{dna.colorSeason}</Text>
                  </View>
                  <View style={styles.dnaGridItem}>
                    <Text style={styles.dnaItemLabel}>Face Shape</Text>
                    <Text style={styles.dnaItemValue}>{dna.faceShape}</Text>
                  </View>
                  <View style={styles.dnaGridItem}>
                    <Text style={styles.dnaItemLabel}>Brows</Text>
                    <Text style={styles.dnaItemValue}>{dna.browShape} ({dna.browSymmetryPct}%)</Text>
                  </View>
                  <View style={styles.dnaGridItem}>
                    <Text style={styles.dnaItemLabel}>Lash Profile</Text>
                    <Text style={styles.dnaItemValue}>{dna.lashProfile}</Text>
                  </View>
                </View>

                {/* Aesthetic Palette Row */}
                {paletteColors && (
                  <View style={styles.paletteSection}>
                    <Text style={styles.dnaItemLabel}>Seasonal Palette Swatches</Text>
                    <View style={styles.paletteRow}>
                      {paletteColors.map((col, idx) => (
                        <View key={idx} style={[styles.colorBubble, { backgroundColor: col }]}>
                          <View style={styles.colorBubbleHighlight} />
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <Pressable onPress={handleViewDna} style={styles.actionBtn}>
                  <Text style={styles.actionBtnText}>Open Beauty wrapped story ✦</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.dnaLockedCard}>
                <LinearGradient
                  colors={[tokens.colors.darkBg, '#2d1424']}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.lockedSparkle} pointerEvents="none">
                  <Text style={{ color: 'rgba(255,255,255,0.15)', fontSize: 120 }}>✦</Text>
                </View>
                
                <View style={styles.lockedIconCircle}>
                  <MaterialIcons name="lock" size={28} color={tokens.colors.accent} />
                </View>

                <Text style={styles.lockedTitle}>Your Beauty DNA is Sealed</Text>
                <Text style={styles.lockedSubtitle}>
                  {dna 
                    ? "Your analysis is complete! Unlock PRO to reveal your color season, archetype, and perfect-match ingredients."
                    : "Analyze your skin & facial symmetry to uncover your season, archetype, and perfect-match ingredients."
                  }
                </Text>

                <Pressable 
                  onPress={() => {
                    if (settings.hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push('/(main)/paywall');
                  }}
                  style={styles.lockedActionBtn}
                >
                  <Text style={styles.lockedActionText}>
                    {dna ? "Reveal Beauty DNA ✦" : "Unlock Beauty DNA ✨"}
                  </Text>
                </Pressable>
              </View>
            )
          ) : (
            /* Skin Guard Panel */
            <View style={styles.safetyCard}>
              <View style={styles.safetyHeader}>
                <MaterialIcons name="security" size={22} color={tokens.colors.pinkDeep} />
                <Text style={styles.safetyTitle}>Active Ingredient Watchdog</Text>
              </View>
              <Text style={styles.safetyBody}>
                Exposing ingredients that trigger breakouts, destroy skin barriers, or spike allergy alerts. Remake maintains 100% objective testing.
              </Text>

              <View style={styles.safetyDivider} />

              <View style={styles.safetyMetricRow}>
                <View style={styles.safetyMetricItem}>
                  <Text style={styles.safetyMetricEmoji}>🛡️</Text>
                  <Text style={styles.safetyMetricTitle}>Comedogenic Guard</Text>
                  <Text style={styles.safetyMetricStatus}>STRICT ACTIVE</Text>
                </View>
                <View style={styles.safetyMetricItem}>
                  <Text style={styles.safetyMetricEmoji}>⚠️</Text>
                  <Text style={styles.safetyMetricTitle}>Hidden Allergens</Text>
                  <Text style={styles.safetyMetricStatus}>SCANNING ON</Text>
                </View>
              </View>

              <View style={[styles.safetyMetricRow, { marginTop: 12 }]}>
                <View style={styles.safetyMetricItem}>
                  <Text style={styles.safetyMetricEmoji}>🧪</Text>
                  <Text style={styles.safetyMetricTitle}>Barrier Risks</Text>
                  <Text style={styles.safetyMetricStatus}>MONITORED</Text>
                </View>
                <View style={styles.safetyMetricItem}>
                  <Text style={styles.safetyMetricEmoji}>🌱</Text>
                  <Text style={styles.safetyMetricTitle}>Clean Index Goal</Text>
                  <Text style={styles.safetyMetricStatus}>90% +</Text>
                </View>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Scan Archive Section */}
        <Animated.View entering={FadeInUp.delay(250).duration(500)} style={styles.archiveSection}>
          <Text style={styles.sectionHeader}>Vaulted Scan Files</Text>

          {isLoading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Accessing secure vault...</Text>
            </View>
          )}

          {!isLoading && history.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <MaterialIcons name="camera-alt" size={28} color={tokens.colors.pinkDeep} />
              </View>
              <Text style={styles.emptyTitle}>Vault is Empty</Text>
              <Text style={styles.emptyText}>Complete your first skin/makeup scan to unlock your chronological audit log.</Text>
              <Pressable 
                onPress={() => router.push('/(main)/scan')}
                style={styles.emptyActionBtn}
              >
                <Text style={styles.emptyActionBtnText}>Run First Scan</Text>
              </Pressable>
            </View>
          )}

          {history.map((scan, i) => {
            const score = Math.round(scan.overall_score);
            const isExpanded = expandedScanId === scan.id;

            return (
              <Animated.View 
                key={scan.id} 
                layout={Layout.springify().damping(20).stiffness(150)}
                style={[styles.scanRow, isExpanded && styles.scanRowExpanded]}
              >
                <Pressable onPress={() => toggleExpandScan(scan.id)} style={styles.scanHeaderPress}>
                  <View style={styles.scanLeft}>
                    <View style={styles.scanMeta}>
                      <Text style={styles.scanDate}>{formatDate(scan.created_at)}</Text>
                      {scan.coaching_compliment && !isExpanded && (
                        <Text style={styles.scanCompliment} numberOfLines={1}>
                          {scan.coaching_compliment}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.scanRight}>
                    <View style={styles.scorePill}>
                      <Text style={styles.scanScore}>{score}</Text>
                    </View>
                    <MaterialIcons 
                      name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                      size={18} 
                      color={tokens.colors.gray} 
                    />
                  </View>
                </Pressable>

                {isExpanded && (
                  <Animated.View entering={FadeIn.duration(300)} style={styles.expandedContent}>
                    <View style={styles.scanDottedLine} />
                    <View style={styles.aiQuoteSection}>
                      <Text style={styles.aiQuoteLabel}>AI COACH REPORT</Text>
                      <Text style={styles.aiQuoteText}>"{scan.coaching_compliment}"</Text>
                    </View>

                    <View style={styles.rowActions}>
                      <Pressable 
                        onPress={() => handleShareScan(scan)}
                        style={styles.actionSubBtn}
                      >
                        <MaterialIcons name="share" size={13} color={tokens.colors.pinkDeep} />
                        <Text style={styles.actionSubBtnText}>Share File</Text>
                      </Pressable>

                      <Pressable 
                        onPress={() => {
                          if (settings.hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          router.push({
                            pathname: '/(main)/scan/results',
                            params: { scanId: scan.id }
                          });
                        }}
                        style={[styles.actionSubBtn, styles.actionSubBtnPrimary]}
                      >
                        <MaterialIcons name="zoom-in" size={14} color={tokens.colors.white} />
                        <Text style={[styles.actionSubBtnText, { color: tokens.colors.white }]}>Full Report</Text>
                      </Pressable>
                    </View>
                  </Animated.View>
                )}
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* Developer Bypass Test Actions */}
        {__DEV__ && (
          <View style={styles.devSection}>
            <Text style={styles.devSectionTitle}>🛠️ Developer Previews (Dev Only)</Text>
            <View style={styles.devRow}>
              <Pressable
                onPress={() => {
                  if (settings.hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push({
                    pathname: '/(main)/dna-reveal',
                    params: { bypass: '1' }
                  } as any);
                }}
                style={styles.devBtn}
              >
                <Text style={styles.devBtnText}>Test Beauty DNA 🧬</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (settings.hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push({
                    pathname: '/(main)/wrapped',
                    params: { bypass: '1' }
                  } as any);
                }}
                style={[styles.devBtn, { backgroundColor: '#1E1B4B' }]}
              >
                <Text style={[styles.devBtnText, { color: '#FFFFFF' }]}>Test Scan Stats 📸</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.beige },
  ambientGlow: {
    position: 'absolute',
    top: -150,
    left: -100,
    width: W + 200,
    height: 400,
    backgroundColor: tokens.colors.blush,
    opacity: 0.35,
    borderRadius: 200,
  },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16,
    zIndex: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: tokens.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  back: { fontSize: 24, fontWeight: '300', color: tokens.colors.text, marginTop: -3 },
  title: { fontFamily: tokens.fonts.serif, fontSize: 20, fontWeight: '400', color: tokens.colors.text },
  
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 60 },

  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    marginBottom: 16,
    gap: 16,
  },
  avatarContainer: { position: 'relative' },
  makeupRingBorder: {
    width: 76,
    height: 76,
    borderRadius: 38,
    padding: 2.5,
    backgroundColor: tokens.colors.white,
    borderWidth: 1.5,
    borderColor: tokens.colors.pinkDeep,
  },
  makeupRingBorderInner: {
    flex: 1,
    borderRadius: 35,
    overflow: 'hidden',
    backgroundColor: tokens.colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { fontSize: 26, fontFamily: tokens.fonts.serif, color: tokens.colors.pinkDeep },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: tokens.colors.pinkDeep,
    borderWidth: 1.5,
    borderColor: tokens.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: { flex: 1, justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  userName: { fontFamily: tokens.fonts.serif, fontSize: 18, color: tokens.colors.text },
  proBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(61,53,50,0.15)',
  },
  proBadgeActive: {
    backgroundColor: tokens.colors.accent,
  },
  proBadgeText: { 
    fontSize: 8, 
    fontFamily: tokens.fonts.regular, 
    fontWeight: '700', 
    color: tokens.colors.white,
    letterSpacing: 0.5 
  },
  userSubtitle: { fontFamily: tokens.fonts.regular, fontSize: 12, color: tokens.colors.gray, marginTop: 4 },

  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: tokens.colors.white,
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.border,
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statCardPressed: { transform: [{ scale: 0.97 }] },
  statEmoji: { fontSize: 18, marginBottom: 4 },
  statVal: { fontFamily: tokens.fonts.serif, fontSize: 22, fontWeight: '600', color: tokens.colors.text },
  statLabel: { fontFamily: tokens.fonts.regular, fontSize: 10, color: tokens.colors.gray, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.2 },

  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: tokens.colors.white,
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  tabButtonText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.gray,
  },
  tabButtonTextActive: {
    color: tokens.colors.pinkDeep,
  },

  dnaActiveCard: {
    backgroundColor: tokens.colors.white,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 24,
  },
  dnaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dnaEyebrow: { fontFamily: tokens.fonts.regular, fontSize: 9, letterSpacing: 1, color: tokens.colors.gray, fontWeight: '700' },
  dnaTitle: { fontFamily: tokens.fonts.serif, fontSize: 20, color: tokens.colors.pinkDeep, marginTop: 2 },
  dnaSparkleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: tokens.colors.pinkLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dnaDivider: { height: 1, backgroundColor: tokens.colors.border, opacity: 0.6, marginVertical: 14 },
  dnaDetailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  dnaGridItem: {
    width: '47%',
    backgroundColor: tokens.colors.cream,
    borderRadius: 14,
    padding: 10,
    borderWidth: 0.5,
    borderColor: tokens.colors.border,
  },
  dnaItemLabel: { fontFamily: tokens.fonts.regular, fontSize: 9, color: tokens.colors.gray, textTransform: 'uppercase', letterSpacing: 0.2 },
  dnaItemValue: { fontFamily: tokens.fonts.serif, fontSize: 13, color: tokens.colors.text, marginTop: 3 },
  
  paletteSection: { marginBottom: 16 },
  paletteRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  colorBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: tokens.colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
  },
  colorBubbleHighlight: {
    width: '100%',
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },

  actionBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: tokens.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  actionBtnText: {
    fontFamily: tokens.fonts.serif,
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.white,
    letterSpacing: 0.5,
  },

  dnaLockedCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    height: 220,
    marginBottom: 24,
    position: 'relative',
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  lockedSparkle: { position: 'absolute', top: -30, right: -30 },
  lockedIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  lockedTitle: { fontFamily: tokens.fonts.serif, fontSize: 18, color: tokens.colors.white, marginBottom: 6 },
  lockedSubtitle: { 
    fontFamily: tokens.fonts.regular, 
    fontSize: 11, 
    color: 'rgba(255, 255, 255, 0.75)', 
    textAlign: 'center', 
    lineHeight: 16,
    paddingHorizontal: 16,
    marginBottom: 16 
  },
  lockedActionBtn: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: tokens.colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  lockedActionText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.darkBg,
  },

  safetyCard: {
    backgroundColor: tokens.colors.white,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 24,
  },
  safetyHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  safetyTitle: { fontFamily: tokens.fonts.serif, fontSize: 16, color: tokens.colors.text },
  safetyBody: { fontFamily: tokens.fonts.regular, fontSize: 11, color: tokens.colors.gray, lineHeight: 17, marginBottom: 12 },
  safetyDivider: { height: 1, backgroundColor: tokens.colors.border, opacity: 0.6, marginBottom: 14 },
  safetyMetricRow: { flexDirection: 'row', gap: 12 },
  safetyMetricItem: {
    flex: 1,
    backgroundColor: tokens.colors.cream,
    borderRadius: 14,
    padding: 12,
    borderWidth: 0.5,
    borderColor: tokens.colors.border,
  },
  safetyMetricEmoji: { fontSize: 16, marginBottom: 4 },
  safetyMetricTitle: { fontFamily: tokens.fonts.regular, fontSize: 10, color: tokens.colors.text, fontWeight: '600' },
  safetyMetricStatus: { fontFamily: tokens.fonts.regular, fontSize: 8, color: tokens.colors.pinkDeep, fontWeight: '700', marginTop: 4, letterSpacing: 0.5 },

  archiveSection: { gap: 10 },
  sectionHeader: {
    fontFamily: tokens.fonts.regular,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: tokens.colors.gray,
    fontWeight: '700',
    marginBottom: 6,
    paddingHorizontal: 4,
  },

  emptyState: { 
    alignItems: 'center', 
    backgroundColor: 'rgba(255, 255, 255, 0.4)', 
    borderRadius: 24, 
    padding: 24, 
    borderWidth: 1, 
    borderColor: tokens.colors.border,
    marginTop: 8
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: tokens.colors.pinkLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: { fontFamily: tokens.fonts.serif, fontSize: 16, color: tokens.colors.text, marginBottom: 6 },
  emptyText: {
    fontFamily: tokens.fonts.regular, fontSize: 12,
    color: tokens.colors.gray, textAlign: 'center', lineHeight: 18,
    paddingHorizontal: 20, marginBottom: 16,
  },
  emptyActionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: tokens.colors.pinkDeep,
  },
  emptyActionBtnText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.white,
  },

  scanRow: {
    backgroundColor: tokens.colors.white, 
    borderRadius: 18, 
    borderWidth: 1, 
    borderColor: tokens.colors.border,
    overflow: 'hidden',
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  scanRowExpanded: {
    borderColor: tokens.colors.pinkDeep,
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  scanHeaderPress: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: 14,
  },
  scanLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  verdictPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillGo: { backgroundColor: '#EDF7F2' },
  pillFix: { backgroundColor: '#FFF0F0' },
  verdictText: {
    fontSize: 8,
    fontFamily: tokens.fonts.regular,
    fontWeight: '700',
  },
  textGo: { color: '#2D7D46' },
  textFix: { color: tokens.colors.pinkDeep },
  scanMeta: { flex: 1, justifyContent: 'center' },
  scanDate: {
    fontFamily: tokens.fonts.regular, fontSize: 13,
    fontWeight: '600', color: tokens.colors.text,
  },
  scanCompliment: {
    fontFamily: tokens.fonts.regular, fontSize: 10,
    color: tokens.colors.gray, marginTop: 2,
    maxWidth: 160,
  },
  scanRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scorePill: {
    backgroundColor: tokens.colors.cream,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: tokens.colors.border,
  },
  scanScore: {
    fontFamily: tokens.fonts.serif, fontSize: 14,
    fontWeight: '700',
    color: tokens.colors.text,
  },

  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  scanDottedLine: {
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 0.5,
    borderColor: tokens.colors.border,
    marginBottom: 12,
  },
  aiQuoteSection: {
    backgroundColor: tokens.colors.cream,
    borderRadius: 12,
    padding: 12,
    borderWidth: 0.5,
    borderColor: tokens.colors.border,
    marginBottom: 14,
  },
  aiQuoteLabel: {
    fontSize: 8,
    fontWeight: '700',
    fontFamily: tokens.fonts.regular,
    color: tokens.colors.gray,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  aiQuoteText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    color: tokens.colors.text,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  rowActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionSubBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.white,
  },
  actionSubBtnPrimary: {
    backgroundColor: tokens.colors.pinkDeep,
    borderColor: tokens.colors.pinkDeep,
  },
  actionSubBtnText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    fontWeight: '600',
    color: tokens.colors.pinkDeep,
  },
  devSection: {
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(232, 160, 170, 0.1)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: tokens.colors.pinkDeep,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  devSectionTitle: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.text,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  devRow: {
    flexDirection: 'row',
    gap: 10,
  },
  devBtn: {
    flex: 1,
    backgroundColor: tokens.colors.pinkDeep,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  devBtnText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
