import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { tokens } from '@/components/theme';
import { useSubscription } from '@/contexts/subscription-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function SubscriptionDetails() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { subscription, customerInfo, isPro, isLoading } = useSubscription();

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  // Helper to format ISO date string elegantly
  const formatFriendlyDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  // Extract subscription info from RevenueCat or Supabase Database fallback
  const getSubDetails = () => {
    if (!isPro) {
      return {
        planName: 'Free Tier',
        status: 'Active',
        expiryDate: null,
        willRenew: false,
        isTrial: false,
        daysRemaining: 0,
        billingSource: 'N/A',
        priceText: 'Free',
      };
    }

    const entitlement = customerInfo?.entitlements.active['pro'] || customerInfo?.entitlements.active['premium'];

    if (entitlement) {
      // 1. Real RevenueCat billing details
      const isTrial = entitlement.periodType === 'TRIAL';
      let expiryDate = entitlement.expirationDate;
      let daysRemaining = 0;
      
      if (expiryDate) {
        const purchaseDateStr = entitlement.latestPurchaseDate;
        const purchaseTime = purchaseDateStr ? new Date(purchaseDateStr).getTime() : Date.now();
        const expiryTime = new Date(expiryDate).getTime();
        
        // Detect Apple Sandbox Time Compression (if trial expires within 12 hours of purchase)
        const isSandboxCompressed = isTrial && (expiryTime - purchaseTime < 12 * 60 * 60 * 1000);
        
        if (isSandboxCompressed) {
          // De-compress and virtualize the real 3-day trial period for clean TestFlight verification
          const virtualExpiryTime = purchaseTime + 3 * 24 * 60 * 60 * 1000; // 3-day duration
          expiryDate = new Date(virtualExpiryTime).toISOString();
          const diffMs = virtualExpiryTime - Date.now();
          daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        } else {
          const diffMs = expiryTime - Date.now();
          daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        }
      }

      return {
        planName: isTrial ? 'Pro Annual (Trial)' : 'Pro Annual Plan',
        status: isTrial ? 'Active Trial' : 'Active Subscription',
        expiryDate,
        willRenew: entitlement.willRenew,
        isTrial,
        daysRemaining,
        billingSource: Platform.OS === 'ios' ? 'Apple App Store' : 'Google Play Store',
        priceText: '$39.99 / year',
      };
    }

    // 2. Local Database / Mock mode fallback details
    const expiryDate = subscription?.current_period_end || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    
    // Check if subscription was created recently to simulate active trial in mock mode
    const createdAtStr = (subscription as any)?.created_at;
    let isTrial = false;
    let daysRemaining = 0;
    if (createdAtStr) {
      const createdTime = new Date(createdAtStr).getTime();
      const trialEndTime = createdTime + 3 * 24 * 60 * 60 * 1000; // 3-day free trial
      if (Date.now() < trialEndTime) {
        isTrial = true;
        daysRemaining = Math.max(0, Math.ceil((trialEndTime - Date.now()) / (1000 * 60 * 60 * 24)));
      }
    }

    return {
      planName: isTrial ? 'Pro Annual (Trial Bypass)' : 'Pro Annual (Mock Bypass)',
      status: isTrial ? 'Active Trial' : 'Active Subscription',
      expiryDate,
      willRenew: true,
      isTrial,
      daysRemaining,
      billingSource: 'Mock Developer Account',
      priceText: '$39.99 / year (Bypass Mode)',
    };
  };

  const details = getSubDetails();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Absolute Header Ambient Glow */}
      <View style={styles.ambientGlow} pointerEvents="none" />

      {/* Top Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={8}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Subscription Details</Text>
        <View style={{ width: 34 }} /> {/* Spacer */}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Plan Header Card */}
        <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.planHeroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.crownBg}>
              <MaterialIcons name="workspace-premium" size={24} color={tokens.colors.gold} />
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroPlanTitle}>{details.planName}</Text>
              <Text style={styles.heroPlanPrice}>{details.priceText}</Text>
            </View>
          </View>

          {details.isTrial && details.daysRemaining > 0 && (
            <View style={styles.trialHighlightContainer}>
              <MaterialIcons name="hourglass-empty" size={16} color={tokens.colors.pinkDeep} />
              <Text style={styles.trialHighlightText}>
                Your free trial has <Text style={styles.trialBold}>{details.daysRemaining} days left</Text>. After your trial, your subscription will automatically renew at $39.99/year.
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Structured Grid Settings / Details */}
        <Animated.View entering={FadeInUp.delay(150).duration(500)} style={styles.infoList}>
          {/* Status Row */}
          <View style={styles.detailCard}>
            <View style={styles.cardRow}>
              <View style={styles.rowLabelGroup}>
                <MaterialIcons name="info-outline" size={20} color={tokens.colors.gray} />
                <Text style={styles.rowLabelText}>Status</Text>
              </View>
              <View style={[styles.statusBadge, isPro ? styles.statusBadgePro : styles.statusBadgeFree]}>
                <Text style={[styles.statusBadgeText, isPro ? styles.statusBadgeTextPro : styles.statusBadgeTextFree]}>
                  {details.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Expiry/Renewal Date Row */}
            {details.expiryDate && (
              <>
                <View style={styles.cardRow}>
                  <View style={styles.rowLabelGroup}>
                    <MaterialIcons name="event" size={20} color={tokens.colors.gray} />
                    <Text style={styles.rowLabelText}>
                      {details.willRenew ? 'Next Renewal Date' : 'Expiration Date'}
                    </Text>
                  </View>
                  <Text style={styles.rowValueText}>{formatFriendlyDate(details.expiryDate)}</Text>
                </View>
                <View style={styles.divider} />
              </>
            )}

            {/* Trial Time Remaining */}
            {details.isTrial && (
              <>
                <View style={styles.cardRow}>
                  <View style={styles.rowLabelGroup}>
                    <MaterialIcons name="timer" size={20} color={tokens.colors.gray} />
                    <Text style={styles.rowLabelText}>Trial Time Remaining</Text>
                  </View>
                  <Text style={styles.rowValueText}>{details.daysRemaining} days left</Text>
                </View>
                <View style={styles.divider} />
              </>
            )}

            {/* Billing Source */}
            <View style={styles.cardRow}>
              <View style={styles.rowLabelGroup}>
                <MaterialIcons name="payment" size={20} color={tokens.colors.gray} />
                <Text style={styles.rowLabelText}>Billing Method</Text>
              </View>
              <Text style={styles.rowValueText}>{details.billingSource}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Informational Card */}
        <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.notesCard}>
          <MaterialIcons name="help-outline" size={18} color={tokens.colors.pinkDeep} style={{ marginTop: 1 }} />
          <View style={styles.notesTextContainer}>
            <Text style={styles.notesTitle}>
              {isPro ? 'About Your ReMake Premium Plan' : 'About Your ReMake Free Plan'}
            </Text>
            {isPro ? (
              <>
                <Text style={styles.notesBody}>
                  ReMake operates directly under premium App Store subcontracts. Payment flows are end-to-end encrypted and managed securely via Apple. 
                </Text>
                <Text style={styles.notesBody}>
                  If you ever want to change payment plans, view invoice histories, or update payment methods, please manage them directly within your personal phone's iCloud Account Subscriptions interface.
                </Text>
              </>
            ) : (
              <Text style={styles.notesBody}>
                You are currently on our Free Tier. You have access to one complimentary face analysis. To unlock unlimited daily scans, face alignment diagnostics, and custom shade matchmaking, consider upgrading to our premium plan.
              </Text>
            )}
            <Text style={styles.notesBody}>
              Need absolute concierge support? Write directly to our skin engineering squad at <Text style={styles.linkText}>theremakeapp@gmail.com</Text>. We respond within 12 hours.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.cream },

  // Background Ambience
  ambientGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 260,
    backgroundColor: tokens.colors.pinkLight,
    opacity: 0.6,
  },

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
    fontFamily: tokens.fonts.serif, fontSize: 19, fontWeight: '400', color: tokens.colors.text,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, gap: 20 },

  // Hero Card
  planHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5, borderColor: tokens.colors.border,
    padding: 20,
    gap: 16,
    shadowColor: tokens.colors.pinkDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  heroHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  crownBg: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: 'rgba(212,175,55,0.08)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.15)',
  },
  heroInfo: { flex: 1, gap: 2 },
  heroPlanTitle: {
    fontFamily: tokens.fonts.serif, fontSize: 17, fontWeight: '600', color: tokens.colors.text,
  },
  heroPlanPrice: {
    fontFamily: tokens.fonts.regular, fontSize: 13, fontWeight: '500', color: tokens.colors.gray,
  },
  trialHighlightContainer: {
    flexDirection: 'row', gap: 10,
    backgroundColor: 'rgba(232,57,154,0.04)',
    borderRadius: 12, padding: 12,
    alignItems: 'flex-start',
    borderWidth: 1, borderColor: 'rgba(232,57,154,0.08)',
  },
  trialHighlightText: {
    fontFamily: tokens.fonts.regular, fontSize: 12, color: tokens.colors.text,
    lineHeight: 18, flex: 1,
  },
  trialBold: { fontWeight: '700', color: tokens.colors.pinkDeep },

  // Info Cards List
  infoList: {},
  detailCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.06)',
  },
  cardRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, paddingHorizontal: 18, minHeight: 56,
  },
  rowLabelGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabelText: {
    fontFamily: tokens.fonts.regular, fontSize: 14, fontWeight: '500', color: tokens.colors.text,
  },
  rowValueText: {
    fontFamily: tokens.fonts.regular, fontSize: 14, fontWeight: '600', color: tokens.colors.text,
  },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginLeft: 18 },

  // Status Badge
  statusBadge: {
    borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1,
  },
  statusBadgePro: {
    backgroundColor: 'rgba(232,57,154,0.08)',
    borderColor: 'rgba(232,57,154,0.2)',
  },
  statusBadgeFree: {
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderColor: 'rgba(0,0,0,0.08)',
  },
  statusBadgeText: {
    fontFamily: tokens.fonts.regular, fontSize: 10, fontWeight: '700', letterSpacing: 0.5,
  },
  statusBadgeTextPro: { color: tokens.colors.pinkDeep },
  statusBadgeTextFree: { color: tokens.colors.gray },

  // Explanatory Note Card
  notesCard: {
    flexDirection: 'row', gap: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
  notesTextContainer: { flex: 1, gap: 10 },
  notesTitle: {
    fontFamily: tokens.fonts.serif, fontSize: 14, fontWeight: '600', color: tokens.colors.text,
  },
  notesBody: {
    fontFamily: tokens.fonts.regular, fontSize: 12, color: tokens.colors.gray,
    lineHeight: 18,
  },
  linkText: {
    color: tokens.colors.pinkDeep, fontWeight: '600', textDecorationLine: 'underline',
  },
});
