import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import type { Subscription } from '@/types/database';

interface SubscriptionContextValue {
  subscription: Subscription | null;
  isLoading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  subscription: null,
  isLoading: true,
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setSubscription(data);
        }
        setIsLoading(false);
      });
  }, [user]);

  return (
    <SubscriptionContext.Provider value={{ subscription, isLoading }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}