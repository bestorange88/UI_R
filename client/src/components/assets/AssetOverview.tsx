import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  RefreshCw, 
  Loader2, 
  Eye, 
  EyeOff,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  BarChart3,
  PiggyBank,
  LineChart,
  Activity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { AccountTransfer } from "./AccountTransfer";
import { AssetTrendChart } from "./AssetTrendChart";
interface Balance {
  currency: string;
  available: number;
  frozen: number;
  total: number;
  usdValue: number;
}

interface BalanceData {
  spot: Balance[];
  contract: Balance[];
  stock: Balance[];
  futures: Balance[];
  earn: Balance[];
  totalAssets: number;
  profit24h: number;
  profitPercent24h: number;
}

interface AccountCardProps {
  title: string;
  icon: React.ReactNode;
  balances: Balance[];
  totalValue: number;
  color: string;
  hideValues: boolean;
}

const AccountCard = ({ title, icon, balances, totalValue, color, hideValues }: AccountCardProps) => {
  const { t } = useTranslation();
  
  return (
    <Card className={`relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/80`}>
      {/* Decorative gradient */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 ${color}`} />
      
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${color} bg-opacity-20`}>
              {icon}
            </div>
            <span className="font-medium text-sm lg:text-base">{title}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {balances.length} {t('assets.currencies', '幣種')}
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">{t('assetOverview.total_value')}</div>
            <div className="text-xl lg:text-2xl font-bold">
              {hideValues ? '****' : `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </div>
          </div>
          
          {/* Top 3 currencies */}
          <div className="space-y-2 pt-2 border-t border-border/30">
            {balances.slice(0, 3).map((balance) => (
              <div key={balance.currency} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                    {balance.currency.slice(0, 2)}
                  </div>
                  <span className="text-muted-foreground">{balance.currency}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {hideValues ? '****' : balance.available.toFixed(4)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    ≈ ${hideValues ? '**' : balance.usdValue.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
            {balances.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-2">
                {t('assetOverview.no_assets', '暫無資產')}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function AssetOverview() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [balances, setBalances] = useState<BalanceData>({
    spot: [],
    contract: [],
    stock: [],
    futures: [],
    earn: [],
    totalAssets: 0,
    profit24h: 0,
    profitPercent24h: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hideValues, setHideValues] = useState(false);

  const loadBalances = async () => {
    if (!user) return;
    try {
      const { data: balanceData, error: balanceError } = await supabase
        .from('user_balances')
        .select('*')
        .eq('user_id', user.id);
      
      if (balanceError) throw balanceError;

      const spotBalances = balanceData?.filter(b => b.account_type === 'spot') || [];
      const contractBalances = balanceData?.filter(b => b.account_type === 'contract') || [];
      const stockBalances = balanceData?.filter(b => b.account_type === 'stock') || [];
      const futuresBalances = balanceData?.filter(b => b.account_type === 'futures') || [];
      const earnBalances = balanceData?.filter(b => b.account_type === 'earn') || [];

      const STABLES = new Set(["USDT", "USDC", "USD"]);
      const totalAssets = balanceData?.reduce((sum, b) => {
        const usd = (b.usd_value || 0) || (STABLES.has(b.currency) ? (b.total || 0) : 0);
        return sum + usd;
      }, 0) || 0;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { data: snapshotData } = await supabase
        .from('user_balance_snapshots')
        .select('total_usd_value')
        .eq('user_id', user.id)
        .eq('snapshot_type', 'daily')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const yesterdayTotal = snapshotData?.total_usd_value || totalAssets;
      const profit24h = totalAssets - yesterdayTotal;
      const profitPercent24h = yesterdayTotal > 0 ? (profit24h / yesterdayTotal) * 100 : 0;

      const formatBalances = (data: any[]): Balance[] => 
        data.map(b => ({
          currency: b.currency,
          available: b.available || 0,
          frozen: b.frozen || 0,
          total: b.total || b.available || 0,
          usdValue: (b.usd_value || 0) || (STABLES.has(b.currency) ? (b.total || 0) : 0),
        })).sort((a, b) => b.usdValue - a.usdValue);

      setBalances({
        spot: formatBalances(spotBalances),
        contract: formatBalances(contractBalances),
        stock: formatBalances(stockBalances),
        futures: formatBalances(futuresBalances),
        earn: formatBalances(earnBalances),
        totalAssets,
        profit24h,
        profitPercent24h,
      });
    } catch (error) {
      console.error('Failed to load balances:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    loadBalances();
  }, [user]);

  const refreshBalances = async () => {
    setRefreshing(true);
    await loadBalances();
    toast.success(t('common.success'));
  };

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const { totalAssets, profit24h, profitPercent24h, spot, contract, stock, futures, earn } = balances;
  const isProfit = profit24h >= 0;

  const spotTotal = spot.reduce((sum, b) => sum + b.usdValue, 0);
  const contractTotal = contract.reduce((sum, b) => sum + b.usdValue, 0);
  const stockTotal = stock.reduce((sum, b) => sum + b.usdValue, 0);
  const futuresTotal = futures.reduce((sum, b) => sum + b.usdValue, 0);
  const earnTotal = earn.reduce((sum, b) => sum + b.usdValue, 0);

  // Compact account card for mobile grid
  const CompactAccountCard = ({ title, icon, totalValue, color }: { 
    title: string; 
    icon: React.ReactNode; 
    totalValue: number; 
    color: string;
  }) => (
    <Card className={`relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/80`}>
      <div className={`absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-20 ${color}`} />
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-1.5 rounded-md bg-gradient-to-br ${color} bg-opacity-20`}>
            {icon}
          </div>
          <span className="font-medium text-xs">{title}</span>
        </div>
        <div className="text-sm font-bold">
          {hideValues ? '****' : `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Total Assets Header with Trend Chart */}
      <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card via-card to-primary/5">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold-glow/10 rounded-full blur-3xl" />
        
        <CardContent className="relative p-4 lg:p-8 pb-2">
          {/* Top section with trend controls */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wallet className="h-4 w-4" />
              <span className="text-sm">{t('assetOverview.total_value')}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={() => setHideValues(!hideValues)}
              >
                {hideValues ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
            {/* Trend Chart Controls - right side */}
            <AssetTrendChart currentTotal={totalAssets} hideValues={hideValues} controlsOnly />
          </div>

          {/* Total Value */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl lg:text-5xl font-bold tracking-tight">
                {hideValues ? '******' : `$${totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </span>
              <Badge 
                variant="outline" 
                className={`gap-1 ${isProfit ? 'text-success border-success/30 bg-success/10' : 'text-destructive border-destructive/30 bg-destructive/10'}`}
              >
                {isProfit ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {isProfit ? '+' : ''}{profitPercent24h.toFixed(2)}%
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {t('assetOverview.profit_24h')}: 
              <span className={`ml-1 font-medium ${isProfit ? 'text-success' : 'text-destructive'}`}>
                {hideValues ? '****' : `${isProfit ? '+' : ''}$${profit24h.toFixed(2)}`}
              </span>
            </div>
          </div>

          {/* Trend Chart Line - between 24h profit and buttons */}
          <div className="w-full h-8 -mx-4 lg:-mx-8 px-4 lg:px-8 mt-1 mb-2">
            <AssetTrendChart currentTotal={totalAssets} hideValues={hideValues} chartOnly />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button 
              className="gap-2 bg-primary hover:bg-primary/90"
              onClick={() => navigate('/deposit')}
            >
              <ArrowDownLeft className="h-4 w-4" />
              {t('assets.deposit', '充值')}
            </Button>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => navigate('/withdraw')}
            >
              <ArrowUpRight className="h-4 w-4" />
              {t('assets.withdraw', '提現')}
            </Button>
            <AccountTransfer onTransferComplete={refreshBalances} />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={refreshBalances} 
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardContent>
        
        {/* Date axis at the very bottom */}
        <div className="px-4 lg:px-8 pb-2">
          <AssetTrendChart currentTotal={totalAssets} hideValues={hideValues} showAxisOnly />
        </div>
      </Card>

      {/* Mobile: Compact 3-column grid */}
      <div className="grid gap-2 grid-cols-3 md:hidden">
        <CompactAccountCard
          title={t('assetOverview.spot', '現貨')}
          icon={<Coins className="h-3 w-3 text-blue-400" />}
          totalValue={spotTotal}
          color="from-blue-500/20 to-blue-600/10"
        />
        <CompactAccountCard
          title={t('assetOverview.contract', '合約')}
          icon={<BarChart3 className="h-3 w-3 text-orange-400" />}
          totalValue={contractTotal}
          color="from-orange-500/20 to-orange-600/10"
        />
        <CompactAccountCard
          title={t('assetOverview.stock', '股票')}
          icon={<LineChart className="h-3 w-3 text-purple-400" />}
          totalValue={stockTotal}
          color="from-purple-500/20 to-purple-600/10"
        />
        <CompactAccountCard
          title={t('assetOverview.futures', '期貨')}
          icon={<Activity className="h-3 w-3 text-cyan-400" />}
          totalValue={futuresTotal}
          color="from-cyan-500/20 to-cyan-600/10"
        />
        <CompactAccountCard
          title={t('assetOverview.earn', '理財')}
          icon={<PiggyBank className="h-3 w-3 text-green-400" />}
          totalValue={earnTotal}
          color="from-green-500/20 to-green-600/10"
        />
      </div>

      {/* Desktop: Full account cards */}
      <div className="hidden md:grid gap-4 grid-cols-2 lg:grid-cols-5">
        <AccountCard
          title={t('assetOverview.spot', '現貨')}
          icon={<Coins className="h-4 w-4 text-blue-400" />}
          balances={spot}
          totalValue={spotTotal}
          color="from-blue-500/20 to-blue-600/10"
          hideValues={hideValues}
        />
        <AccountCard
          title={t('assetOverview.contract', '合約')}
          icon={<BarChart3 className="h-4 w-4 text-orange-400" />}
          balances={contract}
          totalValue={contractTotal}
          color="from-orange-500/20 to-orange-600/10"
          hideValues={hideValues}
        />
        <AccountCard
          title={t('assetOverview.stock', '股票')}
          icon={<LineChart className="h-4 w-4 text-purple-400" />}
          balances={stock}
          totalValue={stockTotal}
          color="from-purple-500/20 to-purple-600/10"
          hideValues={hideValues}
        />
        <AccountCard
          title={t('assetOverview.futures', '期貨')}
          icon={<Activity className="h-4 w-4 text-cyan-400" />}
          balances={futures}
          totalValue={futuresTotal}
          color="from-cyan-500/20 to-cyan-600/10"
          hideValues={hideValues}
        />
        <AccountCard
          title={t('assetOverview.earn', '理財')}
          icon={<PiggyBank className="h-4 w-4 text-green-400" />}
          balances={earn}
          totalValue={earnTotal}
          color="from-green-500/20 to-green-600/10"
          hideValues={hideValues}
        />
      </div>
    </div>
  );
}