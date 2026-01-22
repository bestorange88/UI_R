import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { adminApi } from "@/hooks/useAdminData";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { createAdminAuditLog, AdminAuditActions, AdminResourceTypes } from "@/services/adminAuditLog";

interface KYCVerification {
  id: string;
  user_id: string;
  real_name: string;
  id_type: string;
  id_number: string;
  status: string;
  submitted_at: string;
  id_front_url?: string;
  id_back_url?: string;
  selfie_url?: string;
  username?: string;
  email?: string;
}

export const AdminKYCManager = () => {
  const { admin } = useAdminAuth();
  const [verifications, setVerifications] = useState<KYCVerification[]>([]);
  const [selectedKYC, setSelectedKYC] = useState<KYCVerification | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [signedUrls, setSignedUrls] = useState<{
    front?: string;
    back?: string;
    selfie?: string;
  }>({});

  const fetchVerifications = async () => {
    const { data, error } = await adminApi.getKycWithProfiles();
    if (error) {
      toast.error("加载KYC数据失败");
      return;
    }
    setVerifications((data as KYCVerification[]) || []);
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const handleApprove = async (id: string) => {
    setLoading(true);
    
    const kyc = verifications.find(v => v.id === id);
    if (!kyc) return;
    
    const { error } = await adminApi.update('kyc_verifications', {
      status: 'approved',
      reviewed_at: new Date().toISOString()
    }, { id });

    if (error) {
      toast.error("审核失败");
    } else {
      if (admin) {
        await createAdminAuditLog({
          adminId: admin.id,
          adminUsername: admin.username,
          action: AdminAuditActions.KYC_APPROVE,
          resourceType: AdminResourceTypes.KYC_VERIFICATION,
          resourceId: id,
          details: {
            user_id: kyc.user_id,
            username: kyc.username,
            real_name: kyc.real_name,
            id_type: kyc.id_type,
            id_number: kyc.id_number
          }
        });
      }
      
      toast.success("已批准");
      fetchVerifications();
    }
    setLoading(false);
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      toast.error("请填写拒绝原因");
      return;
    }

    setLoading(true);
    
    const kyc = verifications.find(v => v.id === id);
    if (!kyc) return;
    
    const { error } = await adminApi.update('kyc_verifications', {
      status: 'rejected',
      reject_reason: rejectReason,
      reviewed_at: new Date().toISOString()
    }, { id });

    if (error) {
      toast.error("审核失败");
    } else {
      if (admin) {
        await createAdminAuditLog({
          adminId: admin.id,
          adminUsername: admin.username,
          action: AdminAuditActions.KYC_REJECT,
          resourceType: AdminResourceTypes.KYC_VERIFICATION,
          resourceId: id,
          details: {
            user_id: kyc.user_id,
            username: kyc.username,
            real_name: kyc.real_name,
            id_type: kyc.id_type,
            id_number: kyc.id_number,
            reject_reason: rejectReason
          }
        });
      }
      
      toast.success("已拒绝");
      setRejectReason("");
      setSelectedKYC(null);
      fetchVerifications();
    }
    setLoading(false);
  };

  const loadSignedUrls = async (kyc: KYCVerification) => {
    setLoadingImages(true);
    const urls: { front?: string; back?: string; selfie?: string } = {};

    try {
      if (kyc.id_front_url) {
        const { data } = await supabase.storage
          .from('kyc-documents')
          .createSignedUrl(kyc.id_front_url, 3600);
        if (data) urls.front = data.signedUrl;
      }

      if (kyc.id_back_url) {
        const { data } = await supabase.storage
          .from('kyc-documents')
          .createSignedUrl(kyc.id_back_url, 3600);
        if (data) urls.back = data.signedUrl;
      }

      if (kyc.selfie_url) {
        const { data } = await supabase.storage
          .from('kyc-documents')
          .createSignedUrl(kyc.selfie_url, 3600);
        if (data) urls.selfie = data.signedUrl;
      }

      setSignedUrls(urls);
    } catch (error) {
      console.error('Failed to load images:', error);
      toast.error('加载图片失败');
    } finally {
      setLoadingImages(false);
    }
  };

  const handleViewKYC = async (kyc: KYCVerification) => {
    setSelectedKYC(kyc);
    await loadSignedUrls(kyc);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      pending: { variant: "outline", label: "待审核" },
      approved: { variant: "default", label: "已通过" },
      rejected: { variant: "destructive", label: "已拒绝" }
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>KYC 审核管理</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {verifications.map((kyc) => (
              <div key={kyc.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{kyc.real_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {kyc.id_type} - {kyc.id_number}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    用户: {kyc.username} | 提交时间: {new Date(kyc.submitted_at).toLocaleString('zh-CN')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(kyc.status)}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewKYC(kyc)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {kyc.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleApprove(kyc.id)}
                        disabled={loading}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        批准
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setSelectedKYC(kyc)}
                        disabled={loading}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        拒绝
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedKYC && (
        <Dialog open={!!selectedKYC} onOpenChange={() => {
          setSelectedKYC(null);
          setSignedUrls({});
          setRejectReason("");
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>KYC 详情</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium">姓名</div>
                  <div>{selectedKYC.real_name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">证件类型</div>
                  <div>{selectedKYC.id_type}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">证件号码</div>
                  <div>{selectedKYC.id_number}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">状态</div>
                  {getStatusBadge(selectedKYC.status)}
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-sm font-medium">上传的证件</div>
                {loadingImages ? (
                  <div className="text-center py-8 text-muted-foreground">加载图片中...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {signedUrls.front && (
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">证件正面</div>
                        <img 
                          src={signedUrls.front} 
                          alt="ID Front" 
                          className="w-full h-48 object-contain border rounded-lg bg-muted"
                        />
                      </div>
                    )}
                    {signedUrls.back && (
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">证件背面</div>
                        <img 
                          src={signedUrls.back} 
                          alt="ID Back" 
                          className="w-full h-48 object-contain border rounded-lg bg-muted"
                        />
                      </div>
                    )}
                    {signedUrls.selfie && (
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">手持证件照</div>
                        <img 
                          src={signedUrls.selfie} 
                          alt="Selfie" 
                          className="w-full h-48 object-contain border rounded-lg bg-muted"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedKYC.status === 'pending' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">拒绝原因</label>
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="请输入拒绝原因..."
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(selectedKYC.id)}
                      disabled={loading}
                      className="flex-1"
                    >
                      批准
                    </Button>
                    <Button
                      onClick={() => handleReject(selectedKYC.id)}
                      disabled={loading}
                      variant="destructive"
                      className="flex-1"
                    >
                      拒绝
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
