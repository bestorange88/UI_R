import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock, User } from "lucide-react";
import arxLogo from "@/assets/arx-logo-square.png";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export default function AdminLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, login } = useAdminAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/admin");
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(username, password);

      if (!result.success) {
        toast({
          title: "登錄失敗",
          description: result.error || "用戶名或密碼錯誤",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: "登錄成功",
        description: "歡迎進入管理後台",
      });

      navigate("/admin");
    } catch (error: any) {
      toast({
        title: "登錄失敗",
        description: error.message || "認證錯誤",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-destructive/5 p-4">
      <Card className="w-full max-w-md border-destructive/20">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center">
            <img src={arxLogo} alt="ARX" className="h-16 w-16 object-contain" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-6 w-6 text-destructive" />
            <CardTitle className="text-2xl font-bold">管理後台</CardTitle>
          </div>
          <CardDescription>
            僅限授權管理員訪問
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-username" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                管理員帳號
              </Label>
              <Input
                id="admin-username"
                type="text"
                placeholder="請輸入管理員帳號"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                密碼
              </Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
              variant="destructive"
            >
              {isLoading ? "認證中..." : "管理員登錄"}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => navigate("/")}
                className="text-sm text-muted-foreground"
              >
                ← 返回主站
              </Button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <p className="text-xs text-center text-muted-foreground">
              <Shield className="h-3 w-3 inline mr-1" />
              此區域僅限授權管理員訪問，所有訪問記錄將被監控。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
