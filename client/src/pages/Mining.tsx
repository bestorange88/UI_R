import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Pickaxe, Cpu, Zap, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Mining = () => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return null;
  }

  const miningPlans = [
    { 
      name: t('mining.btc_standard'),
      coin: "BTC",
      hashrate: "100 TH/s", 
      period: `180${t('mining.days')}`, 
      dailyOutput: "0.00008", 
      totalCost: "12000",
      roi: "15%"
    },
    { 
      name: t('mining.eth_premium'),
      coin: "ETH",
      hashrate: "500 MH/s", 
      period: `365${t('mining.days')}`, 
      dailyOutput: "0.025", 
      totalCost: "28000",
      roi: "22%"
    },
    { 
      name: t('mining.ltc_professional'),
      coin: "LTC",
      hashrate: "10 GH/s", 
      period: `90${t('mining.days')}`, 
      dailyOutput: "0.15", 
      totalCost: "6500",
      roi: "12%"
    },
  ];

  const cloudMiningPools = [
    { coin: "BTC", apy: "18%", participants: "12,458", tvl: "$45.2M", risk: t('mining.low_risk') },
    { coin: "ETH", apy: "25%", participants: "8,923", tvl: "$32.7M", risk: t('mining.medium_risk') },
    { coin: "DOGE", apy: "35%", participants: "15,632", tvl: "$18.5M", risk: t('mining.high_risk') },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 mb-20 lg:mb-0">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
            <Pickaxe className="h-8 w-8 text-primary" />
            {t('mining.title')}
          </h1>
          <p className="text-muted-foreground">{t('mining.subtitle')}</p>
        </div>

        {/* Mining Stats Dashboard */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{t('mining.my_hashrate')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0 TH/s</div>
              <p className="text-xs text-muted-foreground mt-1">{t('mining.no_hashrate')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{t('mining.today_profit')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">+0.00</div>
              <p className="text-xs text-muted-foreground mt-1">≈ ¥0.00</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{t('mining.total_profit')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0.00</div>
              <p className="text-xs text-muted-foreground mt-1">≈ ¥0.00</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{t('mining.status')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{t('mining.offline')}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('mining.miners_running', { count: 0 })}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="hashrate" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="hashrate" className="gap-2">
              <Cpu className="h-4 w-4" />
              {t('mining.hashrate_plans')}
            </TabsTrigger>
            <TabsTrigger value="cloud" className="gap-2">
              <Zap className="h-4 w-4" />
              {t('mining.cloud_pool')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hashrate" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-primary" />
                  {t('mining.rental_title')}
                </CardTitle>
                <CardDescription>
                  {t('mining.rental_desc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {miningPlans.map((plan, index) => (
                    <Card key={index} className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{plan.name}</CardTitle>
                          <Badge variant="secondary">{t('mining.hot')}</Badge>
                        </div>
                        <CardDescription className="flex items-center gap-1 text-base font-semibold text-foreground">
                          <Cpu className="h-4 w-4" />
                          {plan.hashrate}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('mining.contract_period')}</span>
                            <span className="font-medium">{plan.period}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('mining.daily_output')}</span>
                            <span className="font-medium text-success">{plan.dailyOutput} {plan.coin}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('mining.expected_roi')}</span>
                            <span className="font-medium text-primary">{plan.roi}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-border">
                            <span className="text-muted-foreground">{t('mining.package_price')}</span>
                            <span className="font-bold text-lg">¥{plan.totalCost}</span>
                          </div>
                        </div>
                        <Button className="w-full">{t('mining.buy_now')}</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cloud" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  {t('mining.cloud_pool_title')}
                </CardTitle>
                <CardDescription>
                  {t('mining.cloud_pool_desc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cloudMiningPools.map((pool, index) => (
                    <Card key={index} className="bg-muted/50">
                      <CardContent className="p-6">
                        <div className="grid gap-4 md:grid-cols-6 items-center">
                          <div className="md:col-span-1">
                            <div className="text-2xl font-bold">{pool.coin}</div>
                          </div>

                          <div>
                            <div className="text-sm text-muted-foreground">{t('mining.annual_yield')}</div>
                            <div className="text-xl font-bold text-success">{pool.apy}</div>
                          </div>

                          <div>
                            <div className="text-sm text-muted-foreground">{t('mining.participants')}</div>
                            <div className="font-medium">{pool.participants}</div>
                          </div>

                          <div>
                            <div className="text-sm text-muted-foreground">{t('mining.tvl')}</div>
                            <div className="font-medium">{pool.tvl}</div>
                          </div>

                          <div>
                            <Badge variant="outline">
                              {pool.risk}
                            </Badge>
                          </div>

                          <div>
                            <Button className="w-full">{t('mining.join_pool')}</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Mining Tips */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {t('mining.advantages')}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="font-semibold">{t('mining.zero_threshold')}</div>
              <p className="text-sm text-muted-foreground">
                {t('mining.zero_threshold_desc')}
              </p>
            </div>
            <div className="space-y-2">
              <div className="font-semibold">{t('mining.stable_income')}</div>
              <p className="text-sm text-muted-foreground">
                {t('mining.stable_income_desc')}
              </p>
            </div>
            <div className="space-y-2">
              <div className="font-semibold">{t('mining.flexible_exit')}</div>
              <p className="text-sm text-muted-foreground">
                {t('mining.flexible_exit_desc')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Mining;
