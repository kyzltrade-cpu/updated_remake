import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert, Image,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import { useSettings } from '@/contexts/settings-context';
import { useUser } from '@/contexts/user-context';
import { useSubscription } from '@/contexts/subscription-context';

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ value, onValueChange, disabled }: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={() => { if (!disabled) onValueChange(!value); }}
      style={[styles.toggle, value && styles.toggleOn, disabled && styles.toggleDisabled]}
    >
      <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
    </Pressable>
  );
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({ title, children, delay = 0 }: {
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(400)} style={styles.section}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </Animated.View>
  );
}

// ─── Standard row ────────────────────────────────────────────────────────────

function Row({ label, sub, right, onPress }: {
  label: string;
  sub?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  const inner = (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      {right}
    </View>
  );
  if (onPress) return <Pressable onPress={onPress}>{inner}</Pressable>;
  return inner;
}

// ─── Reference photo section ─────────────────────────────────────────────────

// ─── Reference photo section ─────────────────────────────────────────────────

function ReferencePhotoCard({
  uri,
  onRetake,
}: {
  uri: string | null;
  onRetake: () => void;
}) {
  if (uri) {
    return (
      <View>
        {/* Photo with change-overlay */}
        <Pressable onPress={onRetake} style={styles.refPhotoWrap}>
          <Image source={{ uri }} style={styles.refPhoto} />
          {/* Dark gradient + edit badge at bottom of photo */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)']}
            style={styles.refPhotoOverlay}
          >
            <View style={styles.refEditBadge}>
              <MaterialIcons name="camera-alt" size={13} color="#FFFFFF" />
              <Text style={styles.refEditText}>Retake face scan</Text>
            </View>
          </LinearGradient>
        </Pressable>

        {/* Metadata row */}
        <View style={styles.refMetaRow}>
          <View style={styles.refMetaLeft}>
            <MaterialIcons 
              name="check-circle" 
              size={14} 
              color={tokens.colors.pinkDeep} 
            />
            <Text style={styles.refMetaText}>Face scan set • Ready to retake</Text>
          </View>
        </View>
      </View>
    );
  }

  // Empty state
  return (
    <Pressable onPress={onRetake} style={styles.refEmpty}>
      {/* Dashed photo-shaped preview */}
      <View style={styles.refEmptyPreview}>
        <View style={styles.refEmptyIcon}>
          <MaterialIcons name="camera-alt" size={28} color={tokens.colors.pinkDeep} />
        </View>
        <Text style={styles.refEmptyAdd}>Take Face Scan</Text>
      </View>

      {/* Explanation */}
      <View style={styles.refEmptyInfo}>
        <Text style={styles.refEmptyTitle}>Initial face scan required</Text>
        <Text style={styles.refEmptyBody}>
          Your face scan forms your Beauty DNA. Take a front-facing photo in natural, even light.
        </Text>
        <View style={styles.refAddBtn}>
          <Text style={styles.refAddBtnText}>Open Camera</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, toggleSetting } = useSettings();
  const { user, logout, isLoggedIn } = useUser();
  const { subscription } = useSubscription();

  const isPro = subscription?.plan === 'pro';

  const handleRetake = () => {
    if (settings.hapticsEnabled) Haptics.selectionAsync();
    router.push('/(main)/retake-scan');
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure? You can sign back in anytime.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 48 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* Profile card */}
        {isLoggedIn && (
          <Animated.View entering={FadeInUp.delay(40).duration(400)} style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarLetter}>
                {(user?.email?.[0] ?? 'U').toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileEmail}>{user?.email ?? ''}</Text>
              <View style={[styles.planBadge, isPro && styles.planBadgePro]}>
                <Text style={[styles.planBadgeText, isPro && styles.planBadgeTextPro]}>
                  {isPro ? '✦  Pro' : 'Free'}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => router.push('/(main)/paywall')}
              style={styles.upgradeCta}
              hitSlop={8}
            >
              {!isPro && <Text style={styles.upgradeCtaText}>Upgrade</Text>}
            </Pressable>
          </Animated.View>
        )}

        {/* ── Preferences ── */}
        <Section title="Preferences" delay={80}>
          <Row
            label="Haptic feedback"
            sub="Vibration on interactions"
            right={
              <Toggle
                value={settings.hapticsEnabled}
                onValueChange={() => toggleSetting('hapticsEnabled')}
              />
            }
          />
          <View style={styles.divider} />
          <Row
            label="Mirror photos"
            sub="Front camera flip"
            right={
              <Toggle
                value={settings.mirrorPhotos}
                onValueChange={() => toggleSetting('mirrorPhotos')}
              />
            }
          />
        </Section>

        {/* ── Notifications ── */}
        <Section title="Notifications" delay={150}>
          <Row
            label="Push notifications"
            sub="Scan results & tips"
            right={
              <Toggle
                value={settings.notificationsEnabled}
                onValueChange={() => toggleSetting('notificationsEnabled')}
              />
            }
          />
          <View style={styles.divider} />
          <Row
            label="Product expiry reminders"
            sub="Alerts when scanned items expire"
            right={
              <Toggle
                value={settings.notificationsEnabled}
                onValueChange={() => toggleSetting('notificationsEnabled')}
              />
            }
          />
        </Section>

        {/* ── Reference Photo ── */}
        <Section title="Reference Photo" delay={210}>
          <ReferencePhotoCard
            uri={settings.referencePhoto ?? null}
            onRetake={handleRetake}
          />
        </Section>

        {/* ── Subscription ── */}
        <Section title="Subscription" delay={270}>
          <Row
            label="Current plan"
            sub={isPro ? 'Pro · $39.99 / year' : 'Free — 1 scan included'}
            right={
              <Pressable
                onPress={() => router.push('/(main)/paywall')}
                style={styles.changePlanBtn}
              >
                <Text style={styles.changePlanText}>
                  {isPro ? 'Manage' : 'Upgrade'}
                </Text>
                <MaterialIcons name="chevron-right" size={16} color={tokens.colors.pinkDeep} />
              </Pressable>
            }
          />
        </Section>

        {/* ── About ── */}
        <Section title="About" delay={330}>
          <Row label="Version" right={<Text style={styles.rowValue}>1.0.0</Text>} />
          {isLoggedIn && (
            <>
              <View style={styles.divider} />
              <Row label="Account" sub={user?.email ?? ''} />
            </>
          )}
        </Section>

        {/* Sign out */}
        {isLoggedIn && (
          <Animated.View entering={FadeInUp.delay(390).duration(400)}>
            <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
              <MaterialIcons name="logout" size={16} color="#B04040" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.cream },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.07)',
    justifyContent: 'center', alignItems: 'center',
  },
  backIcon: { fontSize: 22, color: tokens.colors.text, lineHeight: 26, includeFontPadding: false },
  headerTitle: {
    fontFamily: tokens.fonts.serif, fontSize: 20, fontWeight: '400', color: tokens.colors.text,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, gap: 20 },

  // Profile card
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.06)',
    padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  profileAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: tokens.colors.pinkDeep,
    alignItems: 'center', justifyContent: 'center',
  },
  profileAvatarLetter: {
    fontFamily: tokens.fonts.regular, fontSize: 18, fontWeight: '700', color: '#FFFFFF',
  },
  profileInfo: { flex: 1, gap: 5 },
  profileEmail: {
    fontFamily: tokens.fonts.regular, fontSize: 14, fontWeight: '500', color: tokens.colors.text,
  },
  planBadge: {
    alignSelf: 'flex-start',
    backgroundColor: tokens.colors.cream,
    borderRadius: 50, paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
  },
  planBadgePro: {
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderColor: 'rgba(212,175,55,0.3)',
  },
  planBadgeText: {
    fontFamily: tokens.fonts.regular, fontSize: 11, fontWeight: '600', color: tokens.colors.gray,
  },
  planBadgeTextPro: { color: tokens.colors.gold },
  upgradeCta: {
    backgroundColor: tokens.colors.pinkDeep,
    borderRadius: 50, paddingHorizontal: 14, paddingVertical: 8,
  },
  upgradeCtaText: {
    fontFamily: tokens.fonts.regular, fontSize: 12, fontWeight: '700', color: '#FFFFFF',
  },

  // Section
  section: {},
  sectionLabel: {
    fontFamily: tokens.fonts.regular, fontSize: 10, fontWeight: '700',
    letterSpacing: 1.4, textTransform: 'uppercase', color: tokens.colors.grayLight,
    marginBottom: 9, marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 18, overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.06)',
  },

  // Row
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 15, paddingHorizontal: 18, minHeight: 56,
  },
  rowLeft: { flex: 1, paddingRight: 12 },
  rowLabel: {
    fontFamily: tokens.fonts.regular, fontSize: 15, fontWeight: '500', color: tokens.colors.text,
  },
  rowSub: {
    fontFamily: tokens.fonts.regular, fontSize: 12, color: tokens.colors.gray, marginTop: 2,
  },
  rowValue: { fontFamily: tokens.fonts.regular, fontSize: 14, color: tokens.colors.gray },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginLeft: 18 },

  // Toggle
  toggle: {
    width: 48, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.12)', padding: 2, justifyContent: 'center',
  },
  toggleOn: { backgroundColor: tokens.colors.pinkDeep },
  toggleDisabled: { opacity: 0.4 },
  toggleThumb: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15, shadowRadius: 2, elevation: 2,
  },
  toggleThumbOn: { alignSelf: 'flex-end' },

  // ── Reference photo ───────────────────────────────────────────

  // Filled state
  refPhotoWrap: { position: 'relative' },
  refPhoto: { width: '100%', aspectRatio: 3 / 4 },
  refPhotoOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 72,
    justifyContent: 'flex-end',
    paddingHorizontal: 16, paddingBottom: 14,
  },
  refEditBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 50, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  refEditBadgeDisabled: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  refEditText: {
    fontFamily: tokens.fonts.regular, fontSize: 12, fontWeight: '600', color: '#FFFFFF',
  },
  refMetaRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)',
  },
  refMetaLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  refMetaText: {
    fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '500', color: tokens.colors.text,
  },
  refRemoveText: {
    fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '500', color: '#C04040',
  },

  // Empty state
  refEmpty: {
    flexDirection: 'row', gap: 16,
    padding: 18, alignItems: 'flex-start',
  },
  refEmptyPreview: {
    width: 80,
    aspectRatio: 3 / 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: tokens.colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.cream,
    flexShrink: 0,
    gap: 6,
  },
  refEmptyIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(232,57,154,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  refEmptyAdd: {
    fontFamily: tokens.fonts.regular, fontSize: 9, fontWeight: '600',
    color: tokens.colors.pinkDeep, textAlign: 'center', letterSpacing: 0.2,
    paddingHorizontal: 4,
  },
  refEmptyInfo: { flex: 1, gap: 6 },
  refEmptyTitle: {
    fontFamily: tokens.fonts.regular, fontSize: 14, fontWeight: '700', color: tokens.colors.text,
    lineHeight: 20,
  },
  refEmptyBody: {
    fontFamily: tokens.fonts.regular, fontSize: 12, fontWeight: '300',
    color: tokens.colors.gray, lineHeight: 18,
  },
  refAddBtn: {
    marginTop: 6, alignSelf: 'flex-start',
    backgroundColor: tokens.colors.pinkDeep,
    borderRadius: 50, paddingHorizontal: 14, paddingVertical: 8,
  },
  refAddBtnText: {
    fontFamily: tokens.fonts.regular, fontSize: 12, fontWeight: '700', color: '#FFFFFF',
  },

  // Subscription change plan
  changePlanBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
  },
  changePlanText: {
    fontFamily: tokens.fonts.regular, fontSize: 14, fontWeight: '600', color: tokens.colors.pinkDeep,
  },

  // Sign out
  signOutBtn: {
    backgroundColor: '#FFFFFF', borderRadius: 18,
    borderWidth: 1.5, borderColor: 'rgba(192,64,64,0.2)',
    paddingVertical: 15, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  signOutText: {
    fontFamily: tokens.fonts.regular, fontSize: 15, fontWeight: '500', color: '#B04040',
  },
});
