import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Percent, Lock, Zap, Bitcoin, TrendingUp, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EarnProduct {
  id: string;
  product_type: string;
  coin_symbol: string;
  coin_name: string;
  apy_rate: number;
  min_amount: number;
  max_amount: number | null;
  lock_period_days: number | null;
  risk_level: string;
  total_value_locked: number;
}

interface EarnSubscription {
  id: string;
  user_id: string;
  product_id: string;
  amount: number;
  start_date: string;
  end_date: string | null;
  earned_interest: number;
  status: string;
  created_at: string;
  earn_products: EarnProduct;
}

const Earn = () => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<EarnProduct[]>([]);
  const [subscriptions, setSubscriptions] = useState<EarnSubscription[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<EarnProduct | null>(null);
  const [subscribeDialogOpen, setSubscribeDialogOpen] = useState(false);
  const [subscribeAmount, setSubscribeAmount] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchSubscriptions();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("earn_products")
        .select("*")
        .eq("is_active", true)
        .order("product_type", { ascending: true })
        .order("apy_rate", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch products: " + error.message);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from("earn_subscriptions")
        .select(`
          *,
          earn_products (*)
        `)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error: any) {
      console.error("Failed to fetch subscriptions:", error);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedProduct || !subscribeAmount) {
      toast.error(t('earn.enter_amount'));
      return;
    }

    const amount = parseFloat(subscribeAmount);
    if (amount < selectedProduct.min_amount) {
      toast.error(`${t('earn.min_amount')}: ${selectedProduct.min_amount} ${selectedProduct.coin_symbol}`);
      return;
    }

    if (selectedProduct.max_amount && amount > selectedProduct.max_amount) {
      toast.error(`${t('earn.max_amount')}: ${selectedProduct.max_amount} ${selectedProduct.coin_symbol}`);
      return;
    }

    try {
      const endDate = selectedProduct.lock_period_days
        ? new Date(Date.now() + selectedProduct.lock_period_days * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error } = await supabase
        .from("earn_subscriptions")
        .insert([
          {
            user_id: user!.id,
            product_id: selectedProduct.id,
            amount,
            end_date: endDate,
          },
        ]);

      if (error) throw error;

      toast.success(t('common.success'));
      setSubscribeDialogOpen(false);
      setSubscribeAmount("");
      setSelectedProduct(null);
      fetchSubscriptions();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openSubscribeDialog = (product: EarnProduct) => {
    setSelectedProduct(product);
    setSubscribeDialogOpen(true);
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case "low": return t('mining.low_risk');
      case "medium": return t('mining.medium_risk');
      case "high": return t('mining.high_risk');
      default: return risk;
    }
  };

  const getProductTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      crypto_savings: t('earn.crypto_savings'),
      crypto_staking: t('earn.crypto_staking'),
      crypto_defi: t('earn.crypto_defi'),
      stock_dividend: t('earn.stock_dividend'),
      stock_growth: t('earn.stock_growth'),
      stock_index: t('earn.stock_index'),
      futures_arbitrage: t('earn.futures_arbitrage'),
      futures_hedge: t('earn.futures_hedge'),
      savings: t('earn.savings'),
      staking: t('earn.staking'),
      defi: t('earn.defi'),
    };
    return labels[type] || type;
  };

  // 分类产品
  const cryptoProducts = products.filter(p => 
    p.product_type.startsWith('crypto_') || 
    ['savings', 'staking', 'defi'].includes(p.product_type)
  );
  const stockProducts = products.filter(p => p.product_type.startsWith('stock_'));
  const futuresProducts = products.filter(p => p.product_type.startsWith('futures_'));

  if (loading || !user) {
    return null;
  }

  if (loadingProducts) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-lg text-muted-foreground">{t('common.loading')}</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const renderProductCard = (product: EarnProduct) => (
    <Card key={product.id} className="bg-muted/50 hover:bg-muted/70 transition-colors">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{product.coin_symbol}</CardTitle>
          <Badge variant="secondary">{getRiskLabel(product.risk_level)}</Badge>
        </div>
        <CardDescription>{product.coin_name}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-primary">{product.apy_rate}%</div>
            <div className="text-sm text-muted-foreground">{t('earn.apy')}</div>
          </div>
          {product.total_value_locked > 0 && (
            <div className="text-right">
              <div className="text-lg font-semibold">${(product.total_value_locked / 1000000).toFixed(1)}M</div>
              <div className="text-sm text-muted-foreground">{t('mining.tvl')}</div>
            </div>
          )}
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('earn.min_amount')}</span>
            <span className="font-medium">{product.min_amount} {product.coin_symbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('earn.period')}</span>
            <span className="font-medium">
              {product.lock_period_days 
                ? `${product.lock_period_days} ${t('mining.days')}` 
                : t('earn.flexible')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('common.status')}</span>
            <Badge variant="outline">{getProductTypeLabel(product.product_type)}</Badge>
          </div>
        </div>
        <Button className="w-full" onClick={() => openSubscribeDialog(product)}>
          {t('earn.invest')}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <AppLayout>
      <div className="space-y-4 lg:space-y-6 mb-20 lg:mb-0 px-2 lg:px-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl lg:text-3xl font-bold">{t('earn.title')}</h1>
          <Badge variant="outline" className="text-xs lg:text-sm w-fit">{t('earn.safe_reliable')}</Badge>
        </div>

        {/* 我的订阅 */}
        {subscriptions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('earn.my_subscriptions')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {subscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-muted/50"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{sub.earn_products.coin_symbol}</span>
                        <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                          {sub.status === 'active' ? t('earn.active') : t('earn.completed')}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {getProductTypeLabel(sub.earn_products.product_type)} • {sub.earn_products.apy_rate}% APY
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-semibold">
                        {sub.amount} {sub.earn_products.coin_symbol}
                      </div>
                      <div className="text-sm text-green-500">
                        +{sub.earned_interest.toFixed(8)} {sub.earn_products.coin_symbol}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="crypto" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
            <TabsTrigger value="crypto" className="gap-1 lg:gap-2 text-xs lg:text-sm">
              <Bitcoin className="h-3 w-3 lg:h-4 lg:w-4" />
              <span>{t('earn.crypto')}</span>
            </TabsTrigger>
            <TabsTrigger value="stocks" className="gap-1 lg:gap-2 text-xs lg:text-sm">
              <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4" />
              <span>{t('earn.stocks')}</span>
            </TabsTrigger>
            <TabsTrigger value="futures" className="gap-1 lg:gap-2 text-xs lg:text-sm">
              <BarChart3 className="h-3 w-3 lg:h-4 lg:w-4" />
              <span>{t('earn.futures')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="crypto" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bitcoin className="h-5 w-5 text-primary" />
                  {t('earn.crypto')}
                </CardTitle>
                <CardDescription>
                  {t('earn.crypto_savings_desc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cryptoProducts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {t('earn.no_crypto_products')}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {cryptoProducts.map(renderProductCard)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stocks" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  {t('earn.stocks')}
                </CardTitle>
                <CardDescription>
                  {t('earn.stock_dividend_desc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stockProducts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {t('earn.no_stock_products')}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {stockProducts.map(renderProductCard)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="futures" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  {t('earn.futures')}
                </CardTitle>
                <CardDescription>
                  {t('earn.futures_arbitrage_desc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {futuresProducts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {t('earn.no_futures_products')}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {futuresProducts.map(renderProductCard)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={subscribeDialogOpen} onOpenChange={setSubscribeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('earn.subscribe')} {selectedProduct?.coin_symbol}
            </DialogTitle>
            <DialogDescription>
              {selectedProduct && getProductTypeLabel(selectedProduct.product_type)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">{t('earn.apy')}</div>
                <div className="text-xl font-bold text-primary">{selectedProduct?.apy_rate}%</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{t('earn.period')}</div>
                <div className="text-xl font-bold">
                  {selectedProduct?.lock_period_days 
                    ? `${selectedProduct.lock_period_days} ${t('mining.days')}` 
                    : t('earn.flexible')}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('earn.enter_amount')}</Label>
              <Input
                type="number"
                placeholder={`${t('earn.min_amount')}: ${selectedProduct?.min_amount}`}
                value={subscribeAmount}
                onChange={(e) => setSubscribeAmount(e.target.value)}
              />
              <div className="text-sm text-muted-foreground">
                {t('earn.min_amount')}: {selectedProduct?.min_amount} {selectedProduct?.coin_symbol}
                {selectedProduct?.max_amount && ` | ${t('earn.max_amount')}: ${selectedProduct.max_amount} ${selectedProduct.coin_symbol}`}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setSubscribeDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button className="flex-1" onClick={handleSubscribe}>
                {t('earn.confirm_subscribe')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Earn;
