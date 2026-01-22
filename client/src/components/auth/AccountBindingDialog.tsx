import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Wallet, Mail, Lock, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { z } from "zod";

interface AccountBindingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bindingType: "email" | "wallet";
  walletAddress?: string;
}

export function AccountBindingDialog({
  open,
  onOpenChange,
  bindingType,
  walletAddress,
}: AccountBindingDialogProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  // Password validation schema
  const passwordSchema = z.string()
    .min(6, t('auth.validation.password_min'))
    .max(8, t('auth.validation.password_max'))
    .regex(/[A-Z]/, t('auth.validation.password_uppercase'))
    .regex(/[a-z]/, t('auth.validation.password_lowercase'));

  const handleBindEmail = async () => {
    setError("");

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t('auth.validation.email_invalid'));
      return;
    }

    // Validate password
    const passwordValidation = passwordSchema.safeParse(password);
    if (!passwordValidation.success) {
      setError(passwordValidation.error.errors[0].message);
      return;
    }

    // Confirm password match
    if (password !== confirmPassword) {
      setError(t('auth.validation.password_mismatch'));
      return;
    }

    setLoading(true);

    try {
      // Update user email and password in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        email: email,
        password: password,
      });

      if (updateError) throw updateError;

      // Update profile with has_password flag
      if (user) {
        await supabase
          .from('profiles')
          .update({ 
            email: email,
            has_password: true 
          })
          .eq('id', user.id);
      }

      toast.success(t('auth.email_bound_success'));
      onOpenChange(false);
    } catch (err: any) {
      console.error('Bind email error:', err);
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleBindWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError(t('auth.wallet_not_detected'));
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const address = accounts[0];
      if (!address || typeof address !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        throw new Error(t('auth.invalid_wallet_address'));
      }
      
      const normalizedAddress = address.toLowerCase();

      // Check if wallet is already bound to another account
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('wallet_address', normalizedAddress)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingProfile && existingProfile.id !== user?.id) {
        throw new Error(t('auth.wallet_already_bound'));
      }

      // Sign message to verify ownership
      const message = `ARX Account Binding\n\nBinding wallet to account: ${user?.email}\nAddress: ${normalizedAddress}\nTimestamp: ${new Date().toISOString()}`;
      
      await window.ethereum.request({
        method: 'personal_sign',
        params: [message, normalizedAddress],
      });

      // Update profile with wallet address
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ wallet_address: normalizedAddress })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      toast.success(t('auth.wallet_bound_success'));
      onOpenChange(false);
    } catch (err: any) {
      console.error('Bind wallet error:', err);
      if (err.code === 4001) {
        setError(t('auth.user_rejected_signature'));
      } else {
        setError(err.message || t('common.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
    // Store skip preference in localStorage
    localStorage.setItem('binding_skipped', new Date().toISOString());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {bindingType === "email" ? (
              <>
                <Mail className="h-5 w-5 text-primary" />
                {t('auth.bind_email_title')}
              </>
            ) : (
              <>
                <Wallet className="h-5 w-5 text-primary" />
                {t('auth.bind_wallet_title')}
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {bindingType === "email" 
              ? t('auth.bind_email_desc')
              : t('auth.bind_wallet_desc')
            }
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {bindingType === "email" ? (
          <div className="space-y-4">
            {walletAddress && (
              <div className="p-3 bg-muted rounded-lg flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-mono">
                  {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
                </span>
                <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="bind-email">{t('auth.email')}</Label>
              <Input
                id="bind-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bind-password">{t('auth.password')}</Label>
              <Input
                id="bind-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                {t('auth.password_requirements')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bind-confirm-password">{t('auth.confirm_password')}</Label>
              <Input
                id="bind-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
                disabled={loading}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleSkip}
                disabled={loading}
              >
                {t('common.skip')}
              </Button>
              <Button
                className="flex-1"
                onClick={handleBindEmail}
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t('auth.bind_email')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <Wallet className="h-4 w-4" />
              <AlertDescription>
                {t('auth.bind_wallet_info')}
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleSkip}
                disabled={loading}
              >
                {t('common.skip')}
              </Button>
              <Button
                className="flex-1"
                onClick={handleBindWallet}
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Wallet className="h-4 w-4 mr-2" />
                {t('auth.connect_wallet')}
              </Button>
            </div>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
