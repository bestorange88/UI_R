import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useAccountBinding } from "@/hooks/useAccountBinding";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Mail, Loader2, Save, ShieldCheck, CheckCircle, Wallet, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { AccountBindingDialog } from "@/components/auth/AccountBindingDialog";

interface ProfileData {
  username: string;
  email: string;
  avatar_url?: string;
}

interface KYCStatus {
  status?: string;
  real_name?: string;
}

export default function Profile() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { hasWallet, hasEmail, walletAddress, refreshStatus } = useAccountBinding();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
  const [profile, setProfile] = useState<ProfileData>({
    username: '',
    email: '',
    avatar_url: ''
  });
  const [showBindingDialog, setShowBindingDialog] = useState(false);
  const [bindingType, setBindingType] = useState<"email" | "wallet">("wallet");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (profileData) {
          setProfile({
            username: profileData.username || '',
            email: profileData.email || '',
            avatar_url: profileData.avatar_url || ''
          });
        }

        const { data: kycData, error: kycError } = await supabase
          .from('kyc_verifications')
          .select('status, real_name')
          .eq('user_id', user.id)
          .maybeSingle();

        if (kycError && kycError.code !== 'PGRST116') {
          console.error('Failed to load KYC status:', kycError);
        } else if (kycData) {
          setKycStatus(kycData);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
        toast.error(t('common.error'));
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, t]);

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: profile.username,
          avatar_url: profile.avatar_url
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success(t('common.success'));
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading || !user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6 mb-20 lg:mb-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t('settings.account')}</h1>
            <p className="text-muted-foreground">{t('common.welcome')}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('profile.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-2xl">
                  {profile.username.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{t('profile.avatar')}</p>
                <p className="font-medium">{profile.username || user.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">{t('auth.username')}</Label>
                <Input
                  id="username"
                  value={profile.username}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  placeholder={t('profile.username_placeholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="h-4 w-4 inline mr-2" />
                  {t('auth.email')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  {t('profile.email_readonly')}
                </p>
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {t('common.save')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('profile.account_security')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{t('profile.kyc_title')}</p>
                  {kycStatus?.status === 'approved' && (
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {t('common.verified')}
                    </Badge>
                  )}
                  {kycStatus?.status === 'pending' && (
                    <Badge variant="secondary">{t('common.under_review')}</Badge>
                  )}
                  {kycStatus?.status === 'rejected' && (
                    <Badge variant="destructive">{t('common.failed')}</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {kycStatus?.status === 'approved' 
                    ? `${t('profile.kyc_verified')} (${kycStatus.real_name})`
                    : t('profile.kyc_enhance')}
                </p>
              </div>
              <Button 
                variant={kycStatus?.status === 'approved' ? 'ghost' : 'outline'}
                onClick={() => navigate('/kyc-verification')}
                disabled={kycStatus?.status === 'approved'}
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                {kycStatus?.status === 'approved' ? t('common.verified') : 
                 kycStatus?.status === 'pending' ? t('common.view_progress') : t('common.go_verify')}
              </Button>
            </div>
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="font-medium">{t('profile.change_password')}</p>
                <p className="text-sm text-muted-foreground">{t('profile.change_password_desc')}</p>
              </div>
              <Button variant="outline">{t('common.modify')}</Button>
            </div>
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="font-medium">{t('profile.two_factor')}</p>
                <p className="text-sm text-muted-foreground">{t('profile.two_factor_desc')}</p>
              </div>
              <Button variant="outline">{t('common.setup')}</Button>
            </div>
            
            {/* Wallet Binding Section */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  <p className="font-medium">{t('auth.bind_wallet_title')}</p>
                  {hasWallet && (
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {t('common.verified')}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasWallet 
                    ? `${walletAddress?.slice(0, 8)}...${walletAddress?.slice(-6)}`
                    : t('auth.bind_wallet_desc')}
                </p>
              </div>
              <Button 
                variant={hasWallet ? 'ghost' : 'outline'}
                onClick={() => {
                  setBindingType("wallet");
                  setShowBindingDialog(true);
                }}
                disabled={hasWallet}
              >
                <Wallet className="h-4 w-4 mr-2" />
                {hasWallet ? t('common.verified') : t('auth.connect_wallet')}
              </Button>
            </div>

            {/* Email Binding Section (for wallet users) */}
            {!hasEmail && (
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <p className="font-medium">{t('auth.bind_email_title')}</p>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {t('common.pending')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('auth.bind_email_desc')}
                  </p>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setBindingType("email");
                    setShowBindingDialog(true);
                  }}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {t('auth.bind_email')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <AccountBindingDialog
          open={showBindingDialog}
          onOpenChange={(open) => {
            setShowBindingDialog(open);
            if (!open) {
              refreshStatus();
            }
          }}
          bindingType={bindingType}
          walletAddress={walletAddress || undefined}
        />
      </div>
    </AppLayout>
  );
}
