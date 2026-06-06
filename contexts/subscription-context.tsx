import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import type { Subscription } from '@/types/database';

interface SubscriptionContextValue {
  subscription: Subscription | null;
  isLoading: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  subscription: null,
  isLoading: true,
  refreshSubscription: async () => {},
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('[Subscription] fetch error:', error.message);
    }
    setSubscription(data ?? null);
    setIsLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    const supabase = createClient();
    supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('[Subscription] fetch error:', error.message);
        }
        setSubscription(data ?? null);
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <SubscriptionContext.Provider value={{ subscription, isLoading, refreshSubscription: fetchSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
