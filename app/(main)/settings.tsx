import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Image } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { tokens } from '@/components/theme';
import { useSettings } from '@/contexts/settings-context';
import { useUser } from '@/contexts/user-context';
import { useSubscription } from '@/contexts/subscription-context';

function SettingRow({ label, sublabel, children }: { label: string; sublabel?: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sublabel && <Text style={styles.rowSublabel}>{sublabel}</Text>}
      </View>
      {children}
    </View>
  );
}

function Toggle({ value, onValueChange, disabled }: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={() => {
        if (!disabled) onValueChange(!value);
      }}
      style={[styles.toggle, value && styles.toggleOn, disabled && styles.toggleDisabled]}
    >
      <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, profilePhoto, updateSettings, toggleSetting, setProfilePhoto } = useSettings();
  const { user, logout, isLoggedIn } = useUser();
  const { subscription } = useSubscription();
  const [pickingRef, setPickingRef] = useState(false);
  const [pickingPfp, setPickingPfp] = useState(false);
  // Ref to avoid stale closure in alert callbacks
  const profilePhotoRef = useRef(profilePhoto);
  useEffect(() => { profilePhotoRef.current = profilePhoto; }, [profilePhoto]);

  const pickProfilePhoto = async () => {
    if (pickingPfp) return;
    setPickingPfp(true);
    if (settings.hapticsEnabled) Haptics.selectionAsync();
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.6,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setProfilePhoto(result.assets[0].uri);
      }
    } finally {
      setPickingPfp(false);
    }
  };

  const showPfpOptions = () => {
    const hasPhoto = !!profilePhotoRef.current;
    const options: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] = [];
    if (hasPhoto) options.push({ text: 'Remove Photo', style: 'destructive', onPress: () => { if (settings.hapticsEnabled) Haptics.selectionAsync(); setProfilePhoto(null); } });
    options.push({ text: 'Choose Photo', onPress: pickProfilePhoto });
    options.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Profile Photo', undefined, options);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure? You can sign back in anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const pickReference = async () => {
    if (pickingRef) return;
    setPickingRef(true);
    if (settings.hapticsEnabled) Haptics.selectionAsync();
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.5,
        allowsEditing: true,
        aspect: [1, 1],
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.exitBtn}>
          <Text style={styles.exitBtnText}>✕</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.exitBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User section */}
        <Animated.View entering={FadeInUp.delay(50).duration(400)}>
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Account</Text>
            <View style={styles.card}>
              <View style={styles.pfpCentered}>
                <Pressable onPress={showPfpOptions} style={styles.avatarWrapLarge}>
                  {profilePhoto ? (
                    <Image source={{ uri: profilePhoto }} style={styles.avatarPhotoLarge} />
                  ) : (
                    <View style={styles.avatarLarge}>
                      <MaterialIcons name="person" size={48} color={tokens.colors.grayLight} />
                    </View>
                  )}
                  <View style={styles.pfpEditBadgeLarge}>
                    <Text style={styles.pfpEditIcon}>✎</Text>
                  </View>
                </Pressable>
                {isLoggedIn ? (
                  <Text style={styles.userEmail}>{user?.email || 'your@email.com'}</Text>
                ) : (
                  <Pressable onPress={() => router.push('/(onboarding)/create-account')}>
                    <Text style={styles.signInLink}>Sign in to save your data</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Preferences */}
        <Animated.View entering={FadeInUp.delay(120).duration(400)}>
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Preferences</Text>
            <View style={styles.card}>
              <SettingRow label="Haptic feedback" sublabel="Vibration on interactions">
                <Toggle
                  value={settings.hapticsEnabled}
                  onValueChange={() => toggleSetting('hapticsEnabled')}
                />
              </SettingRow>

              <View style={styles.divider} />

              <SettingRow label="Mirror photos" sublabel="Front camera flip">
                <Toggle
                  value={settings.mirrorPhotos}
                  onValueChange={() => toggleSetting('mirrorPhotos')}
                />
              </SettingRow>
            </View>
          </View>
        </Animated.View>

        {/* Reference photo */}
        <Animated.View entering={FadeInUp.delay(190).duration(400)}>
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Reference Photo</Text>
            <View style={styles.card}>
              {settings.referencePhoto ? (
                <Pressable onPress={pickReference}>
                  <Image source={{ uri: settings.referencePhoto }} style={styles.refPhoto} />
                  <Text style={styles.refHint}>Tap to change</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.refPlaceholder} onPress={pickReference}>
                  <Text style={styles.refPlaceholderIcon}>⊕</Text>
                  <Text style={styles.refPlaceholderText}>Add reference photo</Text>
                </Pressable>
              )}
              {settings.referencePhoto && (
                <Pressable style={styles.clearBtn} onPress={clearReference}>
                  <Text style={styles.clearBtnText}>Remove</Text>
                </Pressable>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Notifications */}
        <Animated.View entering={FadeInUp.delay(260).duration(400)}>
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Notifications</Text>
            <View style={styles.card}>
              <SettingRow label="Push notifications" sublabel="Scan results & tips">
                <Toggle
                  value={settings.notificationsEnabled}
                  onValueChange={() => toggleSetting('notificationsEnabled')}
                />
              </SettingRow>
            </View>
          </View>
        </Animated.View>

        {/* Subscription */}
        <Animated.View entering={FadeInUp.delay(330).duration(400)}>
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Subscription</Text>
            <View style={styles.card}>
              <SettingRow
                label="Plan"
                sublabel={subscription?.plan === 'pro' ? 'Pro plan' : 'Free plan'}
              >
                <Text style={[styles.rowValue, subscription?.plan === 'pro' && styles.proText]}>
                  {subscription?.plan === 'pro' ? '✦ Pro' : 'Free'}
                </Text>
              </SettingRow>
            </View>

            {subscription?.plan !== 'pro' && (
              <Pressable
                style={styles.upgradePill}
                onPress={() => {
                  if (settings.hapticsEnabled) Haptics.selectionAsync();
                  router.push('/(onboarding)/pricing');
                }}
              >
                <Text style={styles.upgradePillText}>Upgrade to Pro</Text>
              </Pressable>
            )}

            <View style={styles.divider} />

            <SettingRow label="Version">
              <Text style={styles.rowValue}>1.0.0</Text>
            </SettingRow>
          </View>
        </Animated.View>

        {/* Sign out */}
        {isLoggedIn && (
          <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.section}>
            <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </Pressable>
          </Animated.View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.beige },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  exitBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  exitBtnText: { fontSize: 18, color: tokens.colors.gray, marginTop: -1 },
  headerTitle: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '600',
    color: tokens.colors.text,
    letterSpacing: 0.02,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  section: { marginBottom: 24 },
  sectionHeader: {
    fontFamily: tokens.fonts.regular,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.12,
    textTransform: 'uppercase',
    color: tokens.colors.gray,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: tokens.colors.white,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
    minHeight: 58,
  },
  rowLeft: { flex: 1, paddingRight: 12 },
  rowLabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '500',
    color: tokens.colors.text,
  },
  rowSublabel: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    color: tokens.colors.gray,
    marginTop: 2,
  },
  rowValue: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    color: tokens.colors.gray,
  },
  divider: { height: 1, backgroundColor: tokens.colors.border, marginLeft: 18 },

  // Toggle
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0dbd5',
    padding: 2,
    justifyContent: 'center',
  },
  toggleOn: { backgroundColor: tokens.colors.pink },
  toggleDisabled: { opacity: 0.4 },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: tokens.colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  toggleThumbOn: { alignSelf: 'flex-end' },

  // User
  userRow: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: tokens.colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 16,
    fontWeight: '600',
    color: tokens.colors.white,
  },
  avatarWrap: { position: 'relative' },
  avatarPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  pfpEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: tokens.colors.pink,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: tokens.colors.white,
  },
  // User - stacked
  pfpCentered: {
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  avatarWrapLarge: { position: 'relative' },
  avatarLarge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: tokens.colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTextLarge: {
    fontFamily: tokens.fonts.regular,
    fontSize: 28,
    fontWeight: '600',
    color: tokens.colors.white,
  },
  avatarPhotoLarge: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  pfpEditBadgeLarge: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: tokens.colors.pink,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: tokens.colors.white,
  },
  pfpEditIcon: {
    fontSize: 13,
    color: tokens.colors.white,
    fontWeight: '700',
  },
  userEmail: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    color: tokens.colors.gray,
  },
  proText: {
    color: tokens.colors.pink,
    fontWeight: '600',
  },
  signInLink: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    color: tokens.colors.pink,
    textDecorationLine: 'underline',
  },

  // Upgrade
  upgradePill: {
    marginTop: 16,
    marginHorizontal: 1,
    paddingVertical: 14,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: tokens.colors.goldSoft,
    alignItems: 'center',
    backgroundColor: tokens.colors.white,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  upgradePillText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.1,
    textTransform: 'uppercase',
    color: tokens.colors.gold,
  },

  // Reference photo
  refPhoto: { width: '100%', height: 200, borderRadius: 12, margin: 16 },
  refHint: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    color: tokens.colors.gray,
    textAlign: 'center',
    marginBottom: 12,
  },
  refPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 10,
  },
  refPlaceholderIcon: { fontSize: 28, color: tokens.colors.gray },
  refPlaceholderText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    color: tokens.colors.gray,
  },
  clearBtn: { paddingVertical: 14, alignItems: 'center' },
  clearBtnText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: '500',
  },

  // Sign out
  signOutBtn: {
    backgroundColor: tokens.colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e74c3c',
    paddingVertical: 16,
    alignItems: 'center',
  },
  signOutText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    fontWeight: '600',
    color: '#e74c3c',
  },
});