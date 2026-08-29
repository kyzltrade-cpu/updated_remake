import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert, Image, TextInput, Modal,
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
import { setupUserPushNotifications } from '@/lib/api/notifications';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';

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
  const { user: authUser } = useAuth();
  const { subscription, isPro, refreshSubscription } = useSubscription();

  const [promoCode, setPromoCode] = useState('');
  const [isApplyingCode, setIsApplyingCode] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    code: string;
    days: number;
    expiresAt: string;
  } | null>(null);

  const handleApplyCode = async () => {
    if (!promoCode.trim()) {
      Alert.alert('Error', 'Please enter a code.');
      return;
    }

    if (settings.hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsApplyingCode(true);

    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase.rpc('redeem_promo_code', {
        p_code: promoCode,
      });

      if (error) {
        console.error('[Settings] Promo code error:', error);
        Alert.alert('Error', error.message || 'Failed to redeem code. Please try again.');
      } else {
        const response = data as { success: boolean; message: string; current_period_end?: string };
        if (response.success) {
          const expiresStr = response.current_period_end ? new Date(response.current_period_end).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          }) : 'Lifetime';
          
          let daysCount = 0;
          if (response.current_period_end) {
            const diffTime = new Date(response.current_period_end).getTime() - Date.now();
            daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }

          setSuccessInfo({
            code: promoCode.toUpperCase().trim(),
            days: daysCount,
            expiresAt: expiresStr,
          });

          setPromoCode('');
          await refreshSubscription();

          if (settings.hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setShowSuccessModal(true);
        } else {
          Alert.alert('Promo Code', response.message);
        }
      }
    } catch (e: any) {
      console.error('[Settings] Promo code redemption exception:', e);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsApplyingCode(false);
    }
  };

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

  const handleDeleteAccount = () => {
    if (settings.hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Account',
      'Are you absolutely sure? This will instantly wipe all of your Beauty DNA analyses, habit streaks, scan history, and active subscription access. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              if (settings.hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              const supabase = createClient();
              const { error } = await supabase.rpc('delete_user_account');
              if (error) {
                console.error('[Settings] Account deletion failed:', error);
                Alert.alert('Error', 'Failed to delete account. Please try again or email support.');
              } else {
                Alert.alert('Account Deleted', 'Your account has been permanently erased. Best of luck on your skin journey, bestie! 🌸');
                await logout();
              }
            } catch (e) {
              console.error('[Settings] Account deletion exception:', e);
              Alert.alert('Error', 'An unexpected error occurred. Please try again.');
            }
          }
        }
      ]
    );
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
            {!isPro && (
              <Pressable
                onPress={() => router.push('/(main)/paywall')}
                style={styles.upgradeCta}
                hitSlop={8}
              >
                <Text style={styles.upgradeCtaText}>Upgrade</Text>
              </Pressable>
            )}
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
                onValueChange={async (value) => {
                  toggleSetting('notificationsEnabled');
                  if (value && authUser?.id) {
                    await setupUserPushNotifications(authUser.id).catch(() => {});
                  }
                }}
              />
            }
          />
        </Section>

        {/* ── Subscription ── */}
        <Section title="Subscription" delay={210}>
          <Row
            label="Current plan"
            sub={isPro ? 'Pro · $39.99 / year' : 'Free'}
            right={
              <Pressable
                onPress={() => {
                  if (settings.hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (isPro) {
                    router.push('/(main)/subscription-details');
                  } else {
                    router.push('/(main)/paywall');
                  }
                }}
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

        {/* ── Redeem Code ── */}
        <Section title="Redeem Code" delay={270}>
          <View style={styles.promoRow}>
            <TextInput
              style={[styles.promoInput, isApplyingCode && { opacity: 0.6 }]}
              placeholder={isApplyingCode ? "Applying..." : "Enter code"}
              placeholderTextColor={tokens.colors.grayLight}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isApplyingCode}
              value={promoCode}
              onChangeText={setPromoCode}
            />
            <Pressable
              onPress={handleApplyCode}
              disabled={isApplyingCode}
              style={[styles.promoApplyBtn, isApplyingCode && { opacity: 0.6 }]}
            >
              <Text style={styles.promoApplyText}>
                {isApplyingCode ? '...' : 'Apply'}
              </Text>
            </Pressable>
          </View>
        </Section>

        {/* ── About ── */}
        <Section title="About" delay={330}>
          <Row label="Version" right={<Text style={styles.rowValue}>1.0.0</Text>} />
          <View style={styles.divider} />
          <Row
            label="Terms & Privacy Policy"
            sub="Read our legal policies"
            onPress={() => {
              if (settings.hapticsEnabled) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.push('/(onboarding)/legal');
            }}
            right={<MaterialIcons name="chevron-right" size={16} color={tokens.colors.pinkDeep} />}
          />
          {isLoggedIn && (
            <>
              <View style={styles.divider} />
              <Row label="Account" sub={user?.email ?? ''} />
            </>
          )}
        </Section>

        {/* Sign out & Delete Account */}
        {isLoggedIn && (
          <View style={{ gap: 10, marginBottom: 20 }}>
            <Animated.View entering={FadeInUp.delay(390).duration(400)}>
              <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
                <MaterialIcons name="logout" size={16} color="#B04040" />
                <Text style={styles.signOutText}>Sign Out</Text>
              </Pressable>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(420).duration(400)}>
              <Pressable style={styles.deleteAccountBtn} onPress={handleDeleteAccount}>
                <MaterialIcons name="delete-forever" size={16} color="rgba(176,64,64,0.6)" />
                <Text style={styles.deleteAccountText}>Delete Account</Text>
              </Pressable>
            </Animated.View>
          </View>
        )}
      </ScrollView>

      {/* ── Promo Success Modal ── */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderDecor}>
              <Text style={styles.modalSparkle}>✦</Text>
            </View>
            
            <Text style={styles.modalTitle}>Code Applied!</Text>
            
            <View style={styles.modalBadge}>
              <Text style={styles.modalBadgeText}>{successInfo?.code}</Text>
            </View>

            <Text style={styles.modalText}>
              Your account has been upgraded to ReMake Pro! Enjoy fully unlimited face analysis, advanced makeup score breakdowns, and personalized coaching suggestions.
            </Text>

            <View style={styles.modalInfoBox}>
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalInfoLabel}>Plan Status</Text>
                <Text style={styles.modalInfoValue}>Pro Active</Text>
              </View>
              <View style={styles.modalInfoDivider} />
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalInfoLabel}>Duration</Text>
                <Text style={styles.modalInfoValue}>
                  {successInfo?.days && successInfo.days >= 9999 ? 'Lifetime Access' : `${successInfo?.days} Days`}
                </Text>
              </View>
              <View style={styles.modalInfoDivider} />
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalInfoLabel}>Expires on</Text>
                <Text style={styles.modalInfoValue}>{successInfo?.expiresAt}</Text>
              </View>
            </View>

            <Pressable
              onPress={() => {
                if (settings.hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowSuccessModal(false);
              }}
              style={styles.modalCloseBtn}
            >
              <Text style={styles.modalCloseBtnText}>Let's scan</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    backgroundColor: tokens.colors.accent,
    borderColor: tokens.colors.accent,
  },
  planBadgeText: {
    fontFamily: tokens.fonts.regular, fontSize: 11, fontWeight: '600', color: tokens.colors.gray,
  },
  planBadgeTextPro: { color: tokens.colors.white },
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

  // Redeem Promo Code
  promoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  promoInput: {
    flex: 1,
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    color: tokens.colors.text,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: tokens.colors.cream,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  promoApplyBtn: {
    backgroundColor: tokens.colors.pinkDeep,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoApplyText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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

  // Delete account
  deleteAccountBtn: {
    backgroundColor: '#FFFFFF', borderRadius: 18,
    borderWidth: 1.5, borderColor: 'rgba(192,64,64,0.08)',
    paddingVertical: 15, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  deleteAccountText: {
    fontFamily: tokens.fonts.regular, fontSize: 15, fontWeight: '500', color: '#B04040', opacity: 0.7,
  },

  // Promo Success Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: tokens.colors.pinkLight,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeaderDecor: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(232,57,154,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalSparkle: {
    fontSize: 28,
    color: tokens.colors.pinkDeep,
  },
  modalTitle: {
    fontFamily: tokens.fonts.serif,
    fontSize: 24,
    fontWeight: '400',
    color: tokens.colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalBadge: {
    backgroundColor: tokens.colors.cream,
    borderWidth: 1.5,
    borderColor: tokens.colors.pinkLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 18,
  },
  modalBadgeText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '700',
    color: tokens.colors.pinkDeep,
    letterSpacing: 1,
  },
  modalText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '300',
    color: tokens.colors.gray,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  modalInfoBox: {
    width: '100%',
    backgroundColor: tokens.colors.cream,
    borderRadius: 16,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalInfoLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '500',
    color: tokens.colors.gray,
  },
  modalInfoValue: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '600',
    color: tokens.colors.text,
  },
  modalInfoDivider: {
    height: 1,
    backgroundColor: 'rgba(232,57,154,0.06)',
    marginVertical: 10,
  },
  modalCloseBtn: {
    width: '100%',
    backgroundColor: tokens.colors.pinkDeep,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
