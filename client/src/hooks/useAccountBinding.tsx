import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface AccountBindingStatus {
  hasEmail: boolean;
  hasPassword: boolean;
  hasWallet: boolean;
  walletAddress: string | null;
  email: string | null;
  needsEmailBinding: boolean;
  needsWalletBinding: boolean;
  loading: boolean;
}

export function useAccountBinding() {
  const { user } = useAuth();
  const [status, setStatus] = useState<AccountBindingStatus>({
    hasEmail: false,
    hasPassword: false,
    hasWallet: false,
    walletAddress: null,
    email: null,
    needsEmailBinding: false,
    needsWalletBinding: false,
    loading: true,
  });

  const checkBindingStatus = useCallback(async () => {
    if (!user) {
      setStatus(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      // Check if user logged in via wallet (email contains @wallet.arx.app)
      const isWalletUser = user.email?.includes('@wallet.arx.app');
      
      // Get profile data
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('email, wallet_address, has_password')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        setStatus(prev => ({ ...prev, loading: false }));
        return;
      }

      // Check if binding was recently skipped
      const bindingSkipped = localStorage.getItem('binding_skipped');
      const skipExpiry = bindingSkipped ? new Date(bindingSkipped).getTime() + 24 * 60 * 60 * 1000 : 0; // 24 hours
      const shouldPrompt = !bindingSkipped || Date.now() > skipExpiry;

      const hasRealEmail = profile?.email && !profile.email.includes('@wallet.arx.app');
      const hasPassword = profile?.has_password || !isWalletUser;
      const hasWallet = !!profile?.wallet_address;

      setStatus({
        hasEmail: !!hasRealEmail,
        hasPassword: hasPassword,
        hasWallet: hasWallet,
        walletAddress: profile?.wallet_address || null,
        email: hasRealEmail ? profile.email : null,
        // Wallet users need to bind email/password
        needsEmailBinding: isWalletUser && !hasRealEmail && shouldPrompt,
        // Email users can optionally bind wallet
        needsWalletBinding: !isWalletUser && !hasWallet && shouldPrompt,
        loading: false,
      });
    } catch (err) {
      console.error('Error checking binding status:', err);
      setStatus(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    checkBindingStatus();
  }, [checkBindingStatus]);

  const refreshStatus = useCallback(() => {
    checkBindingStatus();
  }, [checkBindingStatus]);

  return { ...status, refreshStatus };
}
