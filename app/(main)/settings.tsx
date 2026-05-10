import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert, Image } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokens } from '@/components/theme';

const SETTINGS_KEY = 'remake_settings';

const defaultSettings = {
  hapticsEnabled: true,
  notificationsEnabled: true,
  mirrorPhotos: true,
  referencePhoto: null as string | null,
};

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY).then(saved => {
      if (saved) setSettings({ ...defaultSettings, ...JSON.parse(saved) });
    });
  }, []);

  const save = (updates: Partial<typeof defaultSettings>) => {
    const next = { ...settings, ...updates };
    setSettings(next);
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  };

  const pickReference = async () => {
    Haptics.selectionAsync();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.5,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      save({ referencePhoto: result.assets[0].uri });
    }
  };

  const toggle = (key: keyof typeof defaultSettings) => {
    Haptics.selectionAsync();
    save({ [key]: !settings[key] });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.exitBtn}>
          <Text style={styles.exitBtnText}>✕</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.closeBtn}>Done</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <Animated.View entering={FadeInUp.delay(50).duration(500)} style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>◎</Text>
          </View>
          <Text style={styles.email}>you@example.com</Text>
          <Text style={styles.memberSince}>Member since May 2026</Text>
        </Animated.View>

        {/* Stats row */}
        <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.statsRow}>
          {[['--', 'Scans'], ['--', 'Streak'], ['--', 'Avg']].map(([val, label]) => (
            <View key={label} style={styles.stat}>
              <Text style={styles.statVal}>{val}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Camera & AI */}
        <Animated.View entering={FadeInUp.delay(150).duration(500)}>
          <Text style={styles.section}>Camera & AI</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Mirror Photos</Text>
              <Switch
                value={settings.mirrorPhotos}
                onValueChange={() => toggle('mirrorPhotos')}
                trackColor={{ true: tokens.colors.pink }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </Animated.View>

        {/* Reference Photo */}
        <Animated.View entering={FadeInUp.delay(150).duration(500)}>
          <Text style={styles.section}>Reference Photo for AI</Text>
          <View style={styles.card}>
            {settings.referencePhoto ? (
              <View style={styles.refPhotoWrap}>
                <Image source={{ uri: settings.referencePhoto }} style={styles.refPhoto} />
                <Pressable style={styles.changeBtn} onPress={pickReference}>
                  <Text style={styles.changeBtnText}>Change</Text>
                </Pressable>
                <Pressable style={styles.removeBtn} onPress={() => save({ referencePhoto: null })}>
                  <Text style={styles.removeBtnText}>Remove</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.uploadBox} onPress={pickReference}>
                <Text style={styles.uploadIcon}>⊕</Text>
                <Text style={styles.uploadText}>Upload a reference photo</Text>
                <Text style={styles.uploadSub}>AI uses this to compare against your look</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* Preferences */}
        <Animated.View entering={FadeInUp.delay(200).duration(500)}>
          <Text style={styles.section}>Preferences</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Haptic Feedback</Text>
              <Switch
                value={settings.hapticsEnabled}
                onValueChange={() => toggle('hapticsEnabled')}
                trackColor={{ true: tokens.colors.pink }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Notifications</Text>
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={() => toggle('notificationsEnabled')}
                trackColor={{ true: tokens.colors.pink }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </Animated.View>

        {/* Account */}
        <Animated.View entering={FadeInUp.delay(250).duration(500)}>
          <Text style={styles.section}>Account</Text>
          <View style={styles.card}>
            <Pressable style={styles.row}>
              <Text style={styles.rowLabel}>Manage Subscription</Text>
              <Text style={styles.rowArrow}>›</Text>
            </Pressable>
            <View style={styles.divider} />
            <Pressable style={styles.row} onPress={() => Alert.alert('Coming soon', 'Profile editing coming soon.')}>
              <Text style={styles.rowLabel}>Edit Profile</Text>
              <Text style={styles.rowArrow}>›</Text>
            </Pressable>
          </View>
        </Animated.View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.beige },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { fontFamily: tokens.fonts.serif, fontSize: 22, color: tokens.colors.text, textAlign: 'center', flex: 1 },
  exitBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  exitBtnText: { fontSize: 18, color: tokens.colors.gray, marginTop: -1 },
  closeBtn: { fontFamily: tokens.fonts.regular, fontSize: 16, color: '#fff', fontWeight: '600', backgroundColor: tokens.colors.pink, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, overflow: 'hidden' },
  body: { flex: 1, paddingHorizontal: 20 },
  section: { fontFamily: tokens.fonts.regular, fontSize: 11, fontWeight: '600', color: tokens.colors.gray, textTransform: 'uppercase', letterSpacing: 0.08, marginTop: 24, marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 4, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  rowLabel: { fontFamily: tokens.fonts.regular, fontSize: 15, color: tokens.colors.text },
  rowArrow: { fontSize: 18, color: tokens.colors.gray },
  divider: { height: 1, backgroundColor: tokens.colors.border, marginLeft: 16 },
  refPhotoWrap: { padding: 12, alignItems: 'center', gap: 12 },
  refPhoto: { width: 100, height: 100, borderRadius: 12, backgroundColor: tokens.colors.border },
  changeBtn: { backgroundColor: tokens.colors.pink, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 12 },
  changeBtnText: { color: '#fff', fontWeight: '500', fontSize: 13 },
  removeBtn: { paddingVertical: 4 },
  removeBtnText: { color: tokens.colors.gray, fontSize: 13 },
  uploadBox: { padding: 24, alignItems: 'center', gap: 6 },
  uploadIcon: { fontSize: 32, color: tokens.colors.pinkLight },
  uploadText: { fontFamily: tokens.fonts.regular, fontSize: 14, color: tokens.colors.text },
  uploadSub: { fontFamily: tokens.fonts.regular, fontSize: 12, color: tokens.colors.gray, textAlign: 'center' },
  profileCard: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: tokens.colors.cream, borderWidth: 1, borderColor: tokens.colors.border, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  avatarText: { fontSize: 28, color: tokens.colors.pinkDeep },
  email: { fontFamily: tokens.fonts.regular, fontSize: 15, fontWeight: '500', color: tokens.colors.text },
  memberSince: { fontFamily: tokens.fonts.regular, fontSize: 12, color: tokens.colors.grayLight },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 8, paddingHorizontal: 4 },
  stat: { flex: 1, backgroundColor: tokens.colors.white, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: tokens.colors.border },
  statVal: { fontFamily: tokens.fonts.serif, fontSize: 20, color: tokens.colors.pinkDeep, marginBottom: 2 },
  statLabel: { fontFamily: tokens.fonts.regular, fontSize: 10, color: tokens.colors.gray },
  bottomPad: { height: 40 },
});