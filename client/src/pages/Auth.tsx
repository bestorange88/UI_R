import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Mail, Phone, Wallet, Chrome } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import arxLogoGold from "@/assets/arx-logo-gold.png";
import { Separator } from "@/components/ui/separator";
import { CountryCodeSelect } from "@/components/auth/CountryCodeSelect";
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';


export default function Auth() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<"email" | "phone" | "wallet">("email");
  const [verificationSent, setVerificationSent] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+886"); // Default to Taiwan
  const [verificationCode, setVerificationCode] = useState("");
  // Email OTP states
  const [emailForOtp, setEmailForOtp] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [useEmailOtp, setUseEmailOtp] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Dynamic password schema with i18n
  const passwordSchema = z.string()
    .min(6, t('auth.validation.password_min'))
    .max(8, t('auth.validation.password_max'))
    .regex(/[A-Z]/, t('auth.validation.password_uppercase'))
    .regex(/[a-z]/, t('auth.validation.password_lowercase'));

  // Phone validation using libphonenumber-js
  const validatePhoneNumber = (phone: string, dialCode: string): boolean => {
    try {
      const fullNumber = `${dialCode}${phone}`;
      return isValidPhoneNumber(fullNumber);
    } catch {
      return false;
    }
  };

  // Email/Username Sign Up
  const handleEmailSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("signup-email") as string;
    const password = formData.get("signup-password") as string;
    const username = formData.get("signup-username") as string;

    const passwordValidation = passwordSchema.safeParse(password);
    if (!passwordValidation.success) {
      setIsLoading(false);
      toast({
        title: t('auth.validation.password_requirements'),
        description: passwordValidation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      setIsLoading(false);
      toast({
        title: t('auth.signup_failed'),
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Manually create profile if user was created successfully
    if (signUpData.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: signUpData.user.id,
        email: signUpData.user.email || email,
        username: username || email.split('@')[0],
      }, { onConflict: 'id' });

      if (profileError) {
        console.error('Failed to create profile:', profileError);
      }

      // Also create default role
      const { error: roleError } = await supabase.from('user_roles').upsert({
        user_id: signUpData.user.id,
        role: 'trader' as const,
      }, { onConflict: 'user_id,role' });

      if (roleError) {
        console.error('Failed to create user role:', roleError);
      }
    }

    setIsLoading(false);
    toast({
      title: t('auth.signup_success'),
      description: t('auth.welcome_coinmax'),
    });
    
    // Check for redirect parameter
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    navigate(redirect || "/trade");
  };

  // Email Sign In
  const handleEmailSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("signin-email") as string;
    const password = formData.get("signin-password") as string;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      toast({
        title: t('auth.signin_failed'),
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: t('auth.signin_success'),
        description: t('common.welcome'),
      });
      
      // Check for redirect parameter
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get('redirect');
      navigate(redirect || "/trade");
    }
  };

  // Email OTP Sign In
  const handleEmailOtpSignIn = async () => {
    if (!emailOtpSent) {
      // Send email OTP
      if (!emailForOtp || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForOtp)) {
        toast({
          title: t('auth.validation.email_invalid'),
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('send-email-otp', {
        body: { email: emailForOtp, action: "send" }
      });

      setIsLoading(false);

      if (error || data?.error) {
        toast({
          title: t('auth.send_code_failed'),
          description: data?.error || error?.message,
          variant: "destructive",
        });
      } else {
        setEmailOtpSent(true);
        toast({
          title: t('auth.code_sent'),
          description: t('auth.check_email'),
        });
      }
    } else {
      // Verify email OTP
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('send-email-otp', {
        body: { email: emailForOtp, action: "verify", code: emailOtpCode }
      });

      setIsLoading(false);

      if (error || data?.error) {
        toast({
          title: t('auth.verification_failed'),
          description: data?.error || error?.message,
          variant: "destructive",
        });
      } else if (data?.session) {
        // Set session
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });

        toast({
          title: t('auth.signin_success'),
          description: t('common.welcome'),
        });
        
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');
        navigate(redirect || "/trade");
      }
    }
  };

  // Phone OTP Sign In (using custom SMS service)
  const handlePhoneSignIn = async () => {
    if (!verificationSent) {
      // Validate phone number
      if (!validatePhoneNumber(phoneNumber, countryCode)) {
        toast({
          title: t('auth.phone_format_error'),
          description: t('auth.validation.phone_invalid'),
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      
      // Use custom SMS OTP service
      const { data, error } = await supabase.functions.invoke('send-sms-otp', {
        body: { phone: fullPhoneNumber, action: "send" }
      });

      setIsLoading(false);

      if (error || data?.error) {
        toast({
          title: t('auth.send_code_failed'),
          description: data?.error || error?.message,
          variant: "destructive",
        });
      } else {
        setVerificationSent(true);
        toast({
          title: t('auth.code_sent'),
          description: t('auth.check_sms'),
        });
      }
    } else {
      // Verify SMS OTP
      setIsLoading(true);
      
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      const { data, error } = await supabase.functions.invoke('send-sms-otp', {
        body: { phone: fullPhoneNumber, action: "verify", code: verificationCode }
      });

      setIsLoading(false);

      if (error || data?.error) {
        const errorMessage = data?.error || error?.message || t('auth.verification_failed');
        const isRateLimited = data?.code === 'RATE_LIMIT';
        
        toast({
          title: isRateLimited ? t('auth.rate_limited') : t('auth.verification_failed'),
          description: errorMessage,
          variant: "destructive",
        });
      } else if (data?.session) {
        // Set session
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });

        toast({
          title: t('auth.signin_success'),
          description: t('common.welcome'),
        });
        
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');
        navigate(redirect || "/trade");
      }
    }
  };

  // Web3 Wallet Connection (MetaMask, etc.)
  const handleWalletConnect = async () => {
    if (typeof window.ethereum === 'undefined') {
      toast({
        title: t('auth.wallet_not_detected'),
        description: t('auth.install_wallet'),
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Step 1: Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const address = accounts[0];
      if (!address || typeof address !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        throw new Error(t('auth.invalid_wallet_address'));
      }
      
      // Normalize to lowercase for consistency
      const normalizedAddress = address.toLowerCase();
      
      // Step 2: Get unique nonce from server
      const { data: nonceData, error: nonceError } = await supabase.functions.invoke('generate-wallet-nonce', {
        body: { address: normalizedAddress }
      });
      
      if (nonceError || !nonceData?.nonce) {
        throw new Error(t('auth.nonce_failed'));
      }
      
      // Step 3: Sign message with nonce (prevents replay attacks)
      // Use a standardized message format that matches the backend exactly
      const message = `ARX Wallet Authentication\n\nNonce: ${nonceData.nonce}\nAddress: ${normalizedAddress}\nExpires: ${nonceData.expiresAt}`;
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, normalizedAddress],
      });
      
      // Step 4: Verify signature on server and authenticate
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-wallet-signature', {
        body: { address: normalizedAddress, signature, nonce: nonceData.nonce, expiresAt: nonceData.expiresAt }
      });
      
      if (verifyError || !verifyData?.session) {
        throw new Error(verifyData?.error || t('auth.signature_verification_failed'));
      }
      
      // Step 5: Set session in Supabase client
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: verifyData.session.access_token,
        refresh_token: verifyData.session.refresh_token
      });
      
      if (sessionError) {
        throw sessionError;
      }

      setIsLoading(false);
      toast({
        title: t('auth.wallet_connected'),
        description: t('auth.wallet_address_short', { 
          address: `${normalizedAddress.slice(0, 6)}...${normalizedAddress.slice(-4)}` 
        }),
      });
      
      // Check for redirect parameter
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get('redirect');
      navigate(redirect || "/trade");

    } catch (error: any) {
      setIsLoading(false);
      toast({
        title: t('auth.wallet_connection_failed'),
        description: error.message || t('common.error'),
        variant: "destructive",
      });
    }
  };

  // Google OAuth Sign In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/trade`,
      },
    });

    setIsLoading(false);

    if (error) {
      toast({
        title: t('auth.google_signin_failed'),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-auth-background p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gold-deep/10 rounded-full blur-3xl" />
      
      <Card className="w-full max-w-md bg-auth-card/80 backdrop-blur-xl border-auth-border shadow-2xl shadow-primary/5 relative z-10">
        <CardHeader className="space-y-4 text-center pb-2">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-150" />
              <img src={arxLogoGold} alt="ARX" className="h-28 w-auto object-contain relative z-10 drop-shadow-2xl" />
            </div>
          </div>
          <CardDescription className="text-muted-foreground">
            {t('auth.platform_subtitle')}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-auth-background/50 border border-auth-border">
              <TabsTrigger value="signin" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{t('auth.signin')}</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{t('auth.signup')}</TabsTrigger>
            </TabsList>

            {/* Sign In Tab */}
            <TabsContent value="signin" className="space-y-4 mt-4">
              {/* Login Method Selector */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={authMethod === "email" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAuthMethod("email")}
                  className={`gap-2 ${authMethod === "email" ? "bg-gradient-to-r from-primary-dark via-primary to-primary-light text-primary-foreground shadow-lg shadow-primary/30" : "border-auth-border text-foreground hover:border-primary hover:text-primary"}`}
                >
                  <Mail className="h-4 w-4" />
                  {t('auth.email')}
                </Button>
                <Button
                  variant={authMethod === "phone" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAuthMethod("phone")}
                  className={`gap-2 ${authMethod === "phone" ? "bg-gradient-to-r from-primary-dark via-primary to-primary-light text-primary-foreground shadow-lg shadow-primary/30" : "border-auth-border text-foreground hover:border-primary hover:text-primary"}`}
                >
                  <Phone className="h-4 w-4" />
                  {t('auth.phone')}
                </Button>
                <Button
                  variant={authMethod === "wallet" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAuthMethod("wallet")}
                  className={`gap-2 ${authMethod === "wallet" ? "bg-gradient-to-r from-primary-dark via-primary to-primary-light text-primary-foreground shadow-lg shadow-primary/30" : "border-auth-border text-foreground hover:border-primary hover:text-primary"}`}
                >
                  <Wallet className="h-4 w-4" />
                  {t('auth.wallet')}
                </Button>
              </div>

              {/* Email Login */}
              {authMethod === "email" && (
                <div className="space-y-4">
                  {/* Toggle between password and OTP login */}
                  <div className="flex gap-2 p-1 bg-auth-background/50 rounded-lg border border-auth-border">
                    <Button
                      type="button"
                      variant={!useEmailOtp ? "default" : "ghost"}
                      size="sm"
                      onClick={() => {
                        setUseEmailOtp(false);
                        setEmailOtpSent(false);
                        setEmailOtpCode("");
                      }}
                      className={`flex-1 ${!useEmailOtp ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                    >
                      {t('auth.password_login')}
                    </Button>
                    <Button
                      type="button"
                      variant={useEmailOtp ? "default" : "ghost"}
                      size="sm"
                      onClick={() => {
                        setUseEmailOtp(true);
                      }}
                      className={`flex-1 ${useEmailOtp ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                    >
                      {t('auth.code_login')}
                    </Button>
                  </div>

                  {!useEmailOtp ? (
                    // Password login form
                    <form onSubmit={handleEmailSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email" className="text-foreground">{t('auth.email_address')}</Label>
                        <Input
                          id="signin-email"
                          name="signin-email"
                          type="email"
                          placeholder={t('auth.email_placeholder')}
                          required
                          className="bg-auth-background/50 border-auth-border focus:border-primary focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password" className="text-foreground">{t('auth.signin_password')}</Label>
                        <Input
                          id="signin-password"
                          name="signin-password"
                          type="password"
                          placeholder={t('auth.password_placeholder')}
                          required
                          className="bg-auth-background/50 border-auth-border focus:border-primary focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
                        />
                      </div>
                      <Button type="submit" className="w-full bg-gradient-to-r from-primary-dark via-primary to-primary-light text-primary-foreground font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] transition-all duration-300" disabled={isLoading}>
                        {isLoading ? t('auth.signing_in') : t('auth.signin')}
                      </Button>
                    </form>
                  ) : (
                    // Email OTP login
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email-otp" className="text-foreground">{t('auth.email_address')}</Label>
                        <Input
                          id="email-otp"
                          type="email"
                          placeholder={t('auth.email_placeholder')}
                          value={emailForOtp}
                          onChange={(e) => setEmailForOtp(e.target.value)}
                          disabled={emailOtpSent}
                          className="bg-auth-background/50 border-auth-border focus:border-primary focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
                        />
                      </div>

                      {emailOtpSent && (
                        <div className="space-y-2">
                          <Label htmlFor="email-code" className="text-foreground">{t('auth.otp_code')}</Label>
                          <Input
                            id="email-code"
                            type="text"
                            placeholder={t('auth.otp_placeholder')}
                            value={emailOtpCode}
                            onChange={(e) => setEmailOtpCode(e.target.value)}
                            maxLength={6}
                            className="bg-auth-background/50 border-auth-border focus:border-primary focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
                          />
                        </div>
                      )}

                      <Button 
                        onClick={handleEmailOtpSignIn} 
                        className="w-full bg-gradient-to-r from-primary-dark via-primary to-primary-light text-primary-foreground font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] transition-all duration-300" 
                        disabled={isLoading || (!emailOtpSent && !emailForOtp) || (emailOtpSent && !emailOtpCode)}
                      >
                        {isLoading ? t('auth.processing') : emailOtpSent ? t('auth.verify_signin') : t('auth.send_code')}
                      </Button>

                      {emailOtpSent && (
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setEmailOtpSent(false);
                            setEmailOtpCode("");
                          }} 
                          className="w-full border-auth-border text-foreground hover:border-primary hover:text-primary"
                        >
                          {t('auth.resend')}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Phone Login */}
              {authMethod === "phone" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground">{t('auth.phone_number')}</Label>
                    <div className="flex gap-2">
                      <CountryCodeSelect 
                        value={countryCode} 
                        onValueChange={setCountryCode}
                        disabled={verificationSent}
                      />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder={t('auth.phone_number_placeholder')}
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        disabled={verificationSent}
                        className="flex-1 bg-auth-background/50 border-auth-border focus:border-primary focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>

                  {verificationSent && (
                    <div className="space-y-2">
                      <Label htmlFor="code" className="text-foreground">{t('auth.otp_code')}</Label>
                      <Input
                        id="code"
                        type="text"
                        placeholder={t('auth.otp_placeholder')}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        maxLength={6}
                        className="bg-auth-background/50 border-auth-border focus:border-primary focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                  )}

                  <Button 
                    onClick={handlePhoneSignIn} 
                    className="w-full bg-gradient-to-r from-primary-dark via-primary to-primary-light text-primary-foreground font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] transition-all duration-300" 
                    disabled={isLoading || (!verificationSent && !phoneNumber) || (verificationSent && !verificationCode)}
                  >
                    {isLoading ? t('auth.processing') : verificationSent ? t('auth.verify_signin') : t('auth.send_code')}
                  </Button>

                  {verificationSent && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setVerificationSent(false);
                        setVerificationCode("");
                      }} 
                      className="w-full border-auth-border text-foreground hover:border-primary hover:text-primary"
                    >
                      {t('auth.resend')}
                    </Button>
                  )}
                </div>
              )}

              {/* Wallet Login */}
              {authMethod === "wallet" && (
                <div className="space-y-4">
                  <Alert className="bg-auth-background/50 border-auth-border">
                    <Wallet className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-muted-foreground">
                      {t('auth.wallet_quick_signin')}
                    </AlertDescription>
                  </Alert>

                  <Button 
                    onClick={handleWalletConnect} 
                    className="w-full gap-2 bg-gradient-to-r from-primary-dark via-primary to-primary-light text-primary-foreground font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] transition-all duration-300" 
                    disabled={isLoading}
                  >
                    <Wallet className="h-4 w-4" />
                    {isLoading ? t('auth.connecting') : t('auth.connect_wallet')}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    {t('auth.first_time_auto_register')}
                  </p>
                </div>
              )}

              {/* OAuth Login */}
              {authMethod === "email" && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="bg-auth-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-auth-card px-2 text-muted-foreground">
                        {t('auth.or_third_party')}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleGoogleSignIn}
                    className="w-full gap-2 border-auth-border text-foreground hover:border-primary hover:text-primary hover:bg-auth-background/50"
                    disabled={isLoading}
                  >
                    <Chrome className="h-4 w-4" />
                    {t('auth.google_signin')}
                  </Button>
                </>
              )}
            </TabsContent>

            {/* Sign Up Tab */}
            <TabsContent value="signup" className="space-y-4 mt-4">
              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username" className="text-foreground">{t('auth.username')}</Label>
                  <Input
                    id="signup-username"
                    name="signup-username"
                    type="text"
                    placeholder={t('auth.username_placeholder')}
                    required
                    className="bg-auth-background/50 border-auth-border focus:border-primary focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-foreground">{t('auth.email_address')}</Label>
                  <Input
                    id="signup-email"
                    name="signup-email"
                    type="email"
                    placeholder={t('auth.email_placeholder')}
                    required
                    className="bg-auth-background/50 border-auth-border focus:border-primary focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-foreground">{t('auth.set_password')}</Label>
                  <Input
                    id="signup-password"
                    name="signup-password"
                    type="password"
                    placeholder={t('auth.password_min_length')}
                    required
                    minLength={6}
                    maxLength={8}
                    className="bg-auth-background/50 border-auth-border focus:border-primary focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('auth.password_hint')}
                  </p>
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-primary-dark via-primary to-primary-light text-primary-foreground font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] transition-all duration-300" disabled={isLoading}>
                  {isLoading ? t('auth.registering') : t('auth.register_now')}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="bg-auth-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-auth-card px-2 text-muted-foreground">
                    {t('auth.quick_register')}
                  </span>
                </div>
              </div>

              <div className="grid gap-2">
                <Button
                  variant="outline"
                  onClick={handleWalletConnect}
                  className="w-full gap-2 border-auth-border text-foreground hover:border-primary hover:text-primary hover:bg-auth-background/50"
                  disabled={isLoading}
                >
                  <Wallet className="h-4 w-4" />
                  {t('auth.register_with_wallet')}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  className="w-full gap-2 border-auth-border text-foreground hover:border-primary hover:text-primary hover:bg-auth-background/50"
                  disabled={isLoading}
                >
                  <Chrome className="h-4 w-4" />
                  {t('auth.register_with_google')}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <p className="text-xs text-center text-muted-foreground">
            {t('auth.terms_text')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
