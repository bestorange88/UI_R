import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Headset, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logoImage from "@/assets/arx-logo.png";

const ServiceLogin = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "错误",
        description: "请输入用户名和密码",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cs-agent-login', {
        body: { username, password }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || '登录失败');
      }

      // Store agent token
      localStorage.setItem('cs_agent_token', data.token);
      localStorage.setItem('cs_agent_info', JSON.stringify(data.agent));
      localStorage.setItem('cs_agent_last_activity', Date.now().toString());

      toast({
        title: "登录成功",
        description: `欢迎回来，${data.agent.display_name}！`
      });

      navigate('/service/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "登录失败",
        description: error.message || "用户名或密码错误",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={logoImage} alt="ARX" className="h-12" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <Headset className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">客服工作台</CardTitle>
          </div>
          <CardDescription>
            请使用客服账号登录
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceLogin;
