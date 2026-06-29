import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { tokens } from '@/components/theme';

const { width: SW } = Dimensions.get('window');

type Tab = 'terms' | 'privacy';

export default function LegalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('terms');

  const switchTab = (tab: Tab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Legal Documents</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Segmented Control Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable
          onPress={() => switchTab('terms')}
          style={[styles.tab, activeTab === 'terms' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'terms' && styles.tabTextActive]}>
            Terms of Service
          </Text>
        </Pressable>
        <Pressable
          onPress={() => switchTab('privacy')}
          style={[styles.tab, activeTab === 'privacy' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'privacy' && styles.tabTextActive]}>
            Privacy Policy
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'terms' ? (
          <View style={styles.doc}>
            <Text style={styles.docTitle}>Terms of Service</Text>
            <Text style={styles.lastUpdated}>Last updated: June 5, 2026</Text>

            <Text style={styles.disclaimerBox}>
              ⚠️ MEDICAL DISCLAIMER: ReMake provides AI-driven self-analysis of makeup and skin aesthetics. 
              The suggestions and ratings are for educational and cosmetic coaching purposes only. 
              ReMake does NOT provide medical advice, diagnosis, or treatment. Always consult a dermatologist 
              for skin health concerns.
            </Text>

            <Text style={styles.heading}>1. Agreement to Terms</Text>
            <Text style={styles.paragraph}>
              By creating an account, scanning your face, or using the ReMake mobile application, you agree to be bound by these Terms of Service. If you do not agree to all terms, do not use our services.
            </Text>

            <Text style={styles.heading}>2. Description of Service</Text>
            <Text style={styles.paragraph}>
              ReMake is an aesthetic analysis tool powered by computer vision algorithms. Users take or upload photos of their face to receive feedback, category breakdowns, and educational makeup coaching suggestions. It also features skincare and makeup barcode scanning to analyze ingredient lists, revealing comedogenic (pore-clogging) ratings, allergens, and clean beauty scores.
            </Text>

            <Text style={styles.heading}>3. Age Requirements</Text>
            <Text style={styles.paragraph}>
              You must be at least 13 years old to use this app. If you are under 18, you represent that you have your parent or legal guardian's permission to use the app and agree to these Terms.
            </Text>

            <Text style={styles.heading}>4. Subscription & Billing</Text>
            <Text style={styles.paragraph}>
              ReMake is a premium service that requires an active monthly or annual paid subscription. Subscriptions are billed directly through Apple In-App Purchases (App Store) and will auto-renew unless cancelled at least 24 hours before the end of the current billing cycle. No refunds are provided for partial periods.
            </Text>
            <Text style={styles.paragraph}>
              By using and subscribing to the App, you agree to be bound by Apple's standard Terms of Use (EULA), which can be accessed here:
            </Text>
            <Pressable 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/');
              }}
              style={styles.linkContainer}
            >
              <Text style={styles.linkText}>Apple Standard Terms of Use (EULA) ↗</Text>
            </Pressable>

            <Text style={styles.heading}>5. Intellectual Property</Text>
            <Text style={styles.paragraph}>
              All content, algorithms, designs, logos, text, and visual layouts inside ReMake are the sole property of ReMake and are protected under international copyright and intellectual property laws.
            </Text>
          </View>
        ) : (
          <View style={styles.doc}>
            <Text style={styles.docTitle}>Privacy Policy</Text>
            <Text style={styles.lastUpdated}>Last updated: June 5, 2026</Text>

            <Text style={styles.heading}>1. Information We Collect</Text>
            <Text style={styles.paragraph}>
              We collect information that you directly provide to us, including your email address and profile preferences (skin type, makeup skill level, skincare allergies).
            </Text>

            <Text style={styles.heading}>2. Camera & Photo Processing</Text>
            <Text style={styles.paragraph}>
              ReMake requires camera permissions to analyze your face. When you take a photo, the image is transmitted securely over HTTPS/SSL to our cloud vision partners (including Nvidia NIM and OpenAI secure endpoints) for instantaneous analysis. 
            </Text>
            <Text style={styles.paragraph}>
              Photos are processed in-memory and are NOT stored permanently on external servers. Photos are only saved locally on your device's secure sandbox directory if you explicitly opt to save your scan history in your profile.
            </Text>

            <Text style={styles.heading}>3. Data Protection & Sharing</Text>
            <Text style={styles.paragraph}>
              We do not sell, rent, or lease your personal data or photos to third parties. We only share data with secure service providers (e.g., Supabase DB, OpenAI, Nvidia) strictly necessary to run the app's diagnostic and auth pipelines.
            </Text>

            <Text style={styles.heading}>4. User Rights & Data Deletion</Text>
            <Text style={styles.paragraph}>
              You have full control over your data. You can request complete deletion of your account and all associated profile preferences directly inside the Settings screen of the app, or by contacting our support team at theremakeapp@gmail.com.
            </Text>

            <Text style={styles.heading}>5. Policy Changes</Text>
            <Text style={styles.paragraph}>
              We may update this Privacy Policy from time to time. We will notify you of any modifications by posting the new policy in the app and updating the "Last updated" date at the top.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.colors.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.07)',
  },
  backIcon: {
    fontSize: 28,
    color: tokens.colors.text,
    marginTop: -4,
  },
  headerTitle: {
    fontFamily: tokens.fonts.serif,
    fontSize: 18,
    fontWeight: '600',
    color: tokens.colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: tokens.colors.pinkDeep,
  },
  tabText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.gray,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  doc: {
    gap: 16,
  },
  docTitle: {
    fontFamily: tokens.fonts.serif,
    fontSize: 28,
    fontWeight: '400',
    color: tokens.colors.text,
  },
  lastUpdated: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    color: tokens.colors.grayLight,
    marginTop: -8,
  },
  disclaimerBox: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    color: '#A94442',
    backgroundColor: '#F2DEDE',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EBCCD1',
    lineHeight: 18,
    fontWeight: '500',
  },
  heading: {
    fontFamily: tokens.fonts.regular,
    fontSize: 16,
    fontWeight: '700',
    color: tokens.colors.text,
    marginTop: 12,
  },
  paragraph: {
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    color: tokens.colors.gray,
    lineHeight: 22,
    fontWeight: '300',
  },
  linkContainer: {
    marginTop: 4,
    marginBottom: 12,
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  linkText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 13,
    fontWeight: '600',
    color: tokens.colors.pinkDeep,
  },
});
