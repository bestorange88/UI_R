import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Upload, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

interface KYCData {
  id?: string;
  real_name: string;
  id_type: string;
  id_number: string;
  id_front_url?: string;
  id_back_url?: string;
  selfie_url?: string;
  status?: string;
  reject_reason?: string;
  submitted_at?: string;
}

const kycSchema = z.object({
  real_name: z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[\p{L}\s'-]+$/u, 'Name contains invalid characters'),
  id_type: z.enum(['id_card', 'passport', 'driver_license']),
  id_number: z.string()
    .trim()
    .min(5, 'ID number must be at least 5 characters')
    .max(50, 'ID number must be less than 50 characters')
    .regex(/^[A-Z0-9]+$/i, 'ID number must contain only letters and numbers'),
});

export default function KYCVerification() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [kycData, setKycData] = useState<KYCData>({
    real_name: '',
    id_type: 'id_card',
    id_number: '',
  });
  const [existingKYC, setExistingKYC] = useState<KYCData | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadKYC = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('kyc_verifications')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setExistingKYC(data);
          setKycData({
            real_name: data.real_name,
            id_type: data.id_type,
            id_number: data.id_number,
          });
        }
      } catch (error) {
        console.error('Failed to load KYC:', error);
        toast.error(t('kyc.load_failed'));
      } finally {
        setLoading(false);
      }
    };

    loadKYC();
  }, [user, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate input
    const validation = kycSchema.safeParse({
      real_name: kycData.real_name,
      id_type: kycData.id_type,
      id_number: kycData.id_number,
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setSubmitting(true);
    try {
      if (existingKYC && existingKYC.status === 'pending') {
        const { error } = await supabase
          .from('kyc_verifications')
          .update({
            real_name: kycData.real_name,
            id_type: kycData.id_type,
            id_number: kycData.id_number,
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } else if (!existingKYC) {
        const { error } = await supabase
          .from('kyc_verifications')
          .insert({
            user_id: user.id,
            real_name: kycData.real_name,
            id_type: kycData.id_type,
            id_number: kycData.id_number,
          });

        if (error) throw error;
      }

      toast.success(t('kyc.submit_success'));
      
      const { data } = await supabase
        .from('kyc_verifications')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data) setExistingKYC(data);
    } catch (error) {
      console.error('Failed to submit KYC:', error);
      toast.error(t('kyc.submit_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = () => {
    if (!existingKYC?.status) return null;

    const statusConfig = {
      pending: { icon: Clock, text: t('kyc.status_pending'), color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
      approved: { icon: CheckCircle, text: t('kyc.status_approved'), color: 'text-green-600 bg-green-50 border-green-200' },
      rejected: { icon: XCircle, text: t('kyc.status_rejected'), color: 'text-red-600 bg-red-50 border-red-200' },
    };

    const config = statusConfig[existingKYC.status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <Alert className={`${config.color} border`}>
        <Icon className="h-4 w-4" />
        <AlertDescription>
          <span className="font-medium">{t('kyc.status_label')}{config.text}</span>
          {existingKYC.status === 'rejected' && existingKYC.reject_reason && (
            <p className="mt-2 text-sm">{t('kyc.reject_reason')}{existingKYC.reject_reason}</p>
          )}
          {existingKYC.submitted_at && (
            <p className="mt-1 text-xs opacity-75">
              {t('kyc.submit_time')}{new Date(existingKYC.submitted_at).toLocaleString()}
            </p>
          )}
        </AlertDescription>
      </Alert>
    );
  };

  const isDisabled = existingKYC?.status === 'approved' || existingKYC?.status === 'pending';

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
            <h1 className="text-3xl font-bold">{t('kyc.title')}</h1>
            <p className="text-muted-foreground">{t('kyc.subtitle')}</p>
          </div>
        </div>

        {getStatusBadge()}

        <Card>
          <CardHeader>
            <CardTitle>{t('kyc.info_title')}</CardTitle>
            <CardDescription>
              {t('kyc.info_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="real_name">{t('kyc.real_name')} *</Label>
                  <Input
                    id="real_name"
                    value={kycData.real_name}
                    onChange={(e) => setKycData({ ...kycData, real_name: e.target.value })}
                    placeholder={t('kyc.real_name_placeholder')}
                    disabled={isDisabled}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="id_type">{t('kyc.id_type')} *</Label>
                  <Select
                    value={kycData.id_type}
                    onValueChange={(value) => setKycData({ ...kycData, id_type: value })}
                    disabled={isDisabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id_card">{t('kyc.id_type_id_card')}</SelectItem>
                      <SelectItem value="passport">{t('kyc.id_type_passport')}</SelectItem>
                      <SelectItem value="driver_license">{t('kyc.id_type_driver_license')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="id_number">{t('kyc.id_number')} *</Label>
                  <Input
                    id="id_number"
                    value={kycData.id_number}
                    onChange={(e) => setKycData({ ...kycData, id_number: e.target.value })}
                    placeholder={t('kyc.id_number_placeholder')}
                    disabled={isDisabled}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('kyc.documents')}</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{t('kyc.doc_front')}</p>
                    </div>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{t('kyc.doc_back')}</p>
                    </div>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{t('kyc.doc_selfie')}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('kyc.doc_hint')}
                  </p>
                </div>
              </div>

              <Alert>
                <AlertDescription className="text-sm">
                  <strong>{t('kyc.tips_title')}</strong>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>{t('kyc.tip_1')}</li>
                    <li>{t('kyc.tip_2')}</li>
                    <li>{t('kyc.tip_3')}</li>
                    <li>{t('kyc.tip_4')}</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {!isDisabled && (
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('common.submitting')}
                    </>
                  ) : (
                    t('kyc.submit_kyc')
                  )}
                </Button>
              )}

              {existingKYC?.status === 'rejected' && (
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full"
                  variant="outline"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('common.submitting')}
                    </>
                  ) : (
                    t('kyc.resubmit_kyc')
                  )}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
