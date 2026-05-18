import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Image } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/theme';
import { useSettings } from '@/contexts/settings-context';
import { useUser } from '@/contexts/user-context';
import { useSubscription } from '@/contexts/subscription-context';

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

function Section({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(400)} style={styles.section}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </Animated.View>
  );
}

function Row({ label, sub, children }: { label: string; sub?: string; children?: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, toggleSetting } = useSettings();
  const { user, logout, isLoggedIn } = useUser();
  const { subscription } = useSubscription();
  const [pickingRef, setPickingRef] = useState(false);

  const pickReference = async () => {
    if (pickingRef) return;
    setPickingRef(true);
    if (settings.hapticsEnabled) Haptics.selectionAsync();
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.5,
        allowsEditing: true,
        aspect: [3, 4],
      });
      if (!result.canceled && result.assets[0]?.uri) {
        updateSettings({ referencePhoto: result.assets[0].uri });
      }
    } finally {
      setPickingRef(false);
    }
  };

  const clearReference = () => {
    if (settings.hapticsEnabled) Haptics.selectionAsync();
    updateSettings({ referencePhoto: null });
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure? You can sign back in anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>Your preferences</Text>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Preferences */}
        <Section title="Preferences" delay={50}>
          <Row label="Haptic feedback" sub="Vibration on interactions">
            <Toggle value={settings.hapticsEnabled} onValueChange={() => toggleSetting('hapticsEnabled')} />
          </Row>
          <View style={styles.divider} />
          <Row label="Mirror photos" sub="Front camera flip">
            <Toggle value={settings.mirrorPhotos} onValueChange={() => toggleSetting('mirrorPhotos')} />
          </Row>
        </Section>

        {/* Reference Photo */}
        <Section title="Reference Photo" delay={120}>
          {settings.referencePhoto ? (
            <>
              <Pressable onPress={pickReference}>
                <Image source={{ uri: settings.referencePhoto }} style={styles.refPhoto} />
                <Text style={styles.refHint}>Tap to change</Text>
              </Pressable>
              <Pressable style={styles.clearBtn} onPress={clearReference}>
                <Text style={styles.clearBtnText}>Remove</Text>
              </Pressable>
            </>
          ) : (
            <Pressable style={styles.refPlaceholder} onPress={pickReference}>
              <View style={styles.refIconWrap}>
                <MaterialIcons name="add-photo-alternate" size={22} color={tokens.colors.pinkDeep} />
              </View>
              <Text style={styles.refPlaceholderText}>Add reference photo</Text>
              <Text style={styles.refPlaceholderSub}>Compare scan-to-scan progress over time</Text>
            </Pressable>
          )}
        </Section>

        {/* Notifications */}
        <Section title="Notifications" delay={190}>
          <Row label="Push notifications" sub="Scan results & tips">
            <Toggle value={settings.notificationsEnabled} onValueChange={() => toggleSetting('notificationsEnabled')} />
          </Row>
          <View style={styles.divider} />
          <Row label="Product expiry reminders" sub="Alerts when scanned items expire">
            <Toggle value={settings.notificationsEnabled} onValueChange={() => toggleSetting('notificationsEnabled')} />
          </Row>
        </Section>

        {/* Subscription */}
        <Section title="Subscription" delay={260}>
          <Row
            label="Plan"
            sub={subscription?.plan === 'pro' ? 'Pro' : 'Free'}
          >
            <Text style={styles.rowValue}>
              {subscription?.plan === 'pro' ? '$39.99 / year' : 'Free (1 scan)'}
            </Text>
          </Row>
          <View style={styles.divider} />
          <Pressable
            style={styles.upgradeRow}
            onPress={() => {
              if (settings.hapticsEnabled) Haptics.selectionAsync();
              router.push('/(main)/paywall');
            }}
          >
            <Text style={styles.upgradeText}>Change plan</Text>
            <MaterialIcons name="chevron-right" size={18} color={tokens.colors.gold} />
          </Pressable>
        </Section>

        {/* About */}
        <Section title="About" delay={330}>
          <Row label="Version">
            <Text style={styles.rowValue}>1.0.0</Text>
          </Row>
          {isLoggedIn && (
            <>
              <View style={styles.divider} />
              <Row label="Account" sub={user?.email ?? ''} />
            </>
          )}
        </Section>

        {/* Sign out */}
        {isLoggedIn && (
          <Animated.View entering={FadeInUp.delay(400).duration(400)}>
            <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.beige },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 18,
    borderBottomWidth: 1, borderBottomColor: tokens.colors.border,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: tokens.colors.white, borderWidth: 1, borderColor: tokens.colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  backIcon: { fontSize: 20, color: tokens.colors.text, lineHeight: 22 },
  headerCenter: { alignItems: 'center', gap: 2 },
  headerEyebrow: {
    fontFamily: tokens.fonts.regular, fontSize: 10, fontWeight: '500',
    letterSpacing: 1.2, textTransform: 'uppercase', color: tokens.colors.grayLight,
  },
  headerTitle: {
    fontFamily: tokens.fonts.serif, fontSize: 22, fontWeight: '400', color: tokens.colors.text,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24, gap: 20 },

  section: {},
  sectionLabel: {
    fontFamily: tokens.fonts.regular, fontSize: 10, fontWeight: '600',
    letterSpacing: 1.2, textTransform: 'uppercase', color: tokens.colors.grayLight,
    marginBottom: 10, marginLeft: 4,
  },
  card: {
    backgroundColor: tokens.colors.white, borderRadius: 18, overflow: 'hidden',
    borderWidth: 1.5, borderColor: tokens.colors.border,
  },

  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, paddingHorizontal: 18, minHeight: 58,
  },
  rowLeft: { flex: 1, paddingRight: 12 },
  rowLabel: { fontFamily: tokens.fonts.regular, fontSize: 15, fontWeight: '500', color: tokens.colors.text },
  rowSub: { fontFamily: tokens.fonts.regular, fontSize: 12, color: tokens.colors.gray, marginTop: 2 },
  rowValue: { fontFamily: tokens.fonts.regular, fontSize: 14, color: tokens.colors.gray },

  divider: { height: 1, backgroundColor: tokens.colors.border, marginLeft: 18 },

  toggle: {
    width: 48, height: 28, borderRadius: 14,
    backgroundColor: tokens.colors.border, padding: 2, justifyContent: 'center',
  },
  toggleOn: { backgroundColor: tokens.colors.pinkDeep },
  toggleDisabled: { opacity: 0.4 },
  toggleThumb: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: tokens.colors.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2,
  },
  toggleThumbOn: { alignSelf: 'flex-end' },

  // Reference photo
  refPhoto: { width: '100%', aspectRatio: 3 / 4, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  refHint: { fontFamily: tokens.fonts.regular, fontSize: 12, color: tokens.colors.gray, textAlign: 'center', paddingVertical: 10 },
  refPlaceholder: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  refIconWrap: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: tokens.colors.cream, borderWidth: 1.5, borderColor: tokens.colors.border,
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  refPlaceholderText: { fontFamily: tokens.fonts.regular, fontSize: 14, fontWeight: '500', color: tokens.colors.text },
  refPlaceholderSub: { fontFamily: tokens.fonts.regular, fontSize: 12, color: tokens.colors.gray, textAlign: 'center', paddingHorizontal: 28 },
  clearBtn: { paddingVertical: 14, alignItems: 'center', borderTopWidth: 1, borderTopColor: tokens.colors.border },
  clearBtnText: { fontFamily: tokens.fonts.regular, fontSize: 14, color: '#C04040', fontWeight: '500' },

  // Upgrade
  upgradeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, paddingHorizontal: 18,
  },
  upgradeText: { fontFamily: tokens.fonts.regular, fontSize: 15, fontWeight: '600', color: tokens.colors.gold },

  // Sign out
  signOutBtn: {
    backgroundColor: tokens.colors.white, borderRadius: 18,
    borderWidth: 1.5, borderColor: tokens.colors.border,
    paddingVertical: 16, alignItems: 'center',
  },
  signOutText: { fontFamily: tokens.fonts.regular, fontSize: 15, fontWeight: '400', color: tokens.colors.gray },
});
