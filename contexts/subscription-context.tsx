import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Platform } from 'react-native';
import Purchases, { PurchasesOffering, PurchasesPackage, CustomerInfo, PurchasesOfferings } from 'react-native-purchases';
import { createClient } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import type { Subscription } from '@/types/database';

interface SubscriptionContextValue {
  subscription: Subscription | null;
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOfferings | null;
  packages: PurchasesPackage[];
  isLoading: boolean;
  isPro: boolean;
  rcConfigured: boolean;
  refreshSubscription: () => Promise<void>;
  purchasePackage: (pack: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  mockUpgradeToPro: () => Promise<boolean>;
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  subscription: null,
  customerInfo: null,
  offerings: null,
  packages: [],
  isLoading: true,
  isPro: false,
  rcConfigured: false,
  refreshSubscription: async () => {},
  purchasePackage: async () => false,
  restorePurchases: async () => false,
  mockUpgradeToPro: async () => false,
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [rcConfigured, setRcConfigured] = useState(false);

  // Initialize RevenueCat Purchases SDK
  useEffect(() => {
    const initPurchases = async () => {
      const appleKey = process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY || '';
      const androidKey = process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY || '';
      const apiKey = Platform.OS === 'ios' ? appleKey : androidKey;

      if (!apiKey) {
        console.warn('[SubscriptionContext] No RevenueCat API key found. Operating in local-bypass/mock mode.');
        setRcConfigured(false);
        return;
      }

      try {
        // Configure Purchases SDK
        Purchases.configure({
          apiKey,
          appUserID: user?.id || undefined,
        });
        
        // Enable debugging in local development
        if (__DEV__) {
          Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
        }

        setRcConfigured(true);
        console.log('[SubscriptionContext] RevenueCat Purchases SDK initialized successfully!');
      } catch (e) {
        console.error('[SubscriptionContext] Failed to configure Purchases SDK:', e);
        setRcConfigured(false);
      }
    };

    initPurchases();
  }, []);

  // Sync user logging state to RevenueCat
  useEffect(() => {
    if (!rcConfigured) return;

    const syncUser = async () => {
      try {
        if (user?.id) {
          console.log(`[SubscriptionContext] Logging user into RevenueCat: ${user.id}`);
          const result = await Purchases.logIn(user.id);
          setCustomerInfo(result.customerInfo);
          await loadOfferings();
        } else {
          console.log('[SubscriptionContext] Logging out of RevenueCat (anonymous user state)');
          await Purchases.logOut();
          setCustomerInfo(null);
          setOfferings(null);
          setPackages([]);
        }
      } catch (e) {
        console.warn('[SubscriptionContext] Error syncing user with RevenueCat:', e);
      }
    };

    syncUser();
  }, [user, rcConfigured]);

  const loadOfferings = async () => {
    if (!rcConfigured) return;
    try {
      const activeOfferings = await Purchases.getOfferings();
      setOfferings(activeOfferings);
      if (activeOfferings.current) {
        setPackages(activeOfferings.current.availablePackages);
        console.log(`[SubscriptionContext] Offerings loaded. Found ${activeOfferings.current.availablePackages.length} packages.`);
      }
    } catch (e) {
      console.warn('[SubscriptionContext] Failed to fetch offerings:', e);
    }
  };

  const fetchSubscription = async () => {
    setIsLoading(true);
    let dbHasActivePro = false;
    let rcHasActivePro = false;
    let localMockPro = false;

    // 0. Check local AsyncStorage mock pro bypass (for easy anonymous TestFlight testing)
    try {
      const { default: AsyncStorage } = require('@react-native-async-storage/async-storage');
      const storedVal = await AsyncStorage.getItem('MOCK_PRO_ACTIVE');
      if (storedVal === 'true') {
        localMockPro = true;
      }
    } catch (e) {
      //
    }

    // 1. Fetch from Supabase Database (our local database redundant check)
    if (user) {
      try {
        const supabase = createClient() as any;
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.warn('[SubscriptionContext] Supabase fetch error:', error.message);
        } else if (data) {
          setSubscription(data as any);
          if (data.plan === 'pro' && data.status === 'active') {
            dbHasActivePro = true;
          }
        }
      } catch (e) {
        console.warn('[SubscriptionContext] DB check failed:', e);
      }
    } else {
      setSubscription(null);
    }

    // 2. Fetch from RevenueCat Purchases SDK (real receipt state)
    if (rcConfigured) {
      try {
        const info = await Purchases.getCustomerInfo();
        setCustomerInfo(info);
        
        // Entitlements 'pro' or 'premium' active
        const hasRcPro = info.entitlements.active['pro'] !== undefined || info.entitlements.active['premium'] !== undefined;
        if (hasRcPro) {
          rcHasActivePro = true;
        }

        // Keep local database synced with RevenueCat state
        if (user && hasRcPro && !dbHasActivePro) {
          await syncRcSubscriptionToDb(user.id, info);
          dbHasActivePro = true; // Set to true since we are syncing
        }
      } catch (e) {
        console.warn('[SubscriptionContext] RevenueCat getCustomerInfo failed:', e);
      }
    }

    // Computed combined status (dual-redundant safety net!)
    setIsPro(dbHasActivePro || rcHasActivePro || localMockPro);
    setIsLoading(false);
  };

  // Automated write-through: Synced RevenueCat state to Supabase table
  const syncRcSubscriptionToDb = async (userId: string, info: CustomerInfo) => {
    const activeEntitlement = info.entitlements.active['pro'] || info.entitlements.active['premium'];
    if (!activeEntitlement) return;

    try {
      const supabase = createClient() as any;
      await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan: 'pro',
          status: 'active',
          current_period_end: activeEntitlement.expirationDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }, { onConflict: 'user_id' });
      console.log('[SubscriptionContext] Successfully synced RevenueCat Pro status back to local Supabase!');
    } catch (e) {
      console.warn('[SubscriptionContext] Failed to write RC sync to DB:', e);
    }
  };

  // Perform purchase via RevenueCat Purchases
  const purchasePackage = async (pack: PurchasesPackage): Promise<boolean> => {
    if (!rcConfigured) {
      console.warn('[SubscriptionContext] Purchase called but RevenueCat is not configured. Falling back to local DB bypass.');
      return await mockUpgradeToPro();
    }

    try {
      console.log(`[SubscriptionContext] Starting App Store purchase for package: ${pack.identifier}`);
      const { customerInfo: updatedInfo } = await Purchases.purchasePackage(pack);
      setCustomerInfo(updatedInfo);
      
      const hasPro = updatedInfo.entitlements.active['pro'] !== undefined || updatedInfo.entitlements.active['premium'] !== undefined;
      setIsPro(hasPro);
      
      if (user && hasPro) {
        await syncRcSubscriptionToDb(user.id, updatedInfo);
      }
      return hasPro;
    } catch (e: any) {
      if (e.userCancelled) {
        console.log('[SubscriptionContext] User cancelled the App Store payment sheet.');
      } else {
        console.error('[SubscriptionContext] Purchase package encountered error:', e);
      }
      return false;
    }
  };

  // Restore Purchases
  const restorePurchases = async (): Promise<boolean> => {
    if (!rcConfigured) {
      console.warn('[SubscriptionContext] Restore called but RevenueCat is not configured.');
      return false;
    }

    try {
      console.log('[SubscriptionContext] Restoring purchases from App Store...');
      const restoredInfo = await Purchases.restorePurchases();
      setCustomerInfo(restoredInfo);
      
      const hasPro = restoredInfo.entitlements.active['pro'] !== undefined || restoredInfo.entitlements.active['premium'] !== undefined;
      setIsPro(hasPro);
      
      if (user && hasPro) {
        await syncRcSubscriptionToDb(user.id, restoredInfo);
      }
      return hasPro;
    } catch (e) {
      console.error('[SubscriptionContext] Restore purchases encountered error:', e);
      return false;
    }
  };

  // Mock Developer bypass upgrade (highly premium dev tooling)
  const mockUpgradeToPro = async (): Promise<boolean> => {
    try {
      const { default: AsyncStorage } = require('@react-native-async-storage/async-storage');
      await AsyncStorage.setItem('MOCK_PRO_ACTIVE', 'true');

      if (user) {
        const supabase = createClient() as any;
        const { error } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: user.id,
            plan: 'pro',
            status: 'active',
            current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          }, { onConflict: 'user_id' });

        if (error) {
          console.warn('[SubscriptionContext] Mock upgrade DB upsert failed:', error.message);
        }
      }
      
      console.log('[SubscriptionContext] Mock upgrade successful. Local & DB state set to PRO!');
      await fetchSubscription();
      return true;
    } catch (e) {
      console.error('[SubscriptionContext] Mock upgrade exception:', e);
      return false;
    }
  };

  // Sync subscription state on mount / user change, including local mock-pro upgrades
  useEffect(() => {
    const syncMockProAndFetch = async () => {
      if (user) {
        try {
          const { default: AsyncStorage } = require('@react-native-async-storage/async-storage');
          const storedVal = await AsyncStorage.getItem('MOCK_PRO_ACTIVE');
          if (storedVal === 'true') {
            console.log('[SubscriptionContext] Active local mock pro detected on login. Syncing to DB...');
            const supabase = createClient() as any;
            await supabase
              .from('subscriptions')
              .upsert({
                user_id: user.id,
                plan: 'pro',
                status: 'active',
                current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              }, { onConflict: 'user_id' });
          }
        } catch (e) {
          //
        }
      }
      await fetchSubscription();
    };

    syncMockProAndFetch();
  }, [user, rcConfigured]);

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        customerInfo,
        offerings,
        packages,
        isLoading,
        isPro,
        rcConfigured,
        refreshSubscription: fetchSubscription,
        purchasePackage,
        restorePurchases,
        mockUpgradeToPro,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
