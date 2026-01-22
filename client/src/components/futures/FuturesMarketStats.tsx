import { useTranslation } from "react-i18next";
import { TrendingUp, TrendingDown, Clock, Calendar } from "lucide-react";

interface FuturesMarketStatsProps {
  selectedContract: string;
}

// 模擬期貨市場數據
const futuresStats: Record<string, any> = {
  ES: { price: 5285.50, change: 45.25, changePercent: 0.86, high: 5298.75, low: 5265.00, volume: "1.2M", openInterest: "2.8M", expiry: "Mar 2025", tickSize: 0.25 },
  NQ: { price: 18520.25, change: 205.50, changePercent: 1.12, high: 18650.00, low: 18380.00, volume: "850K", openInterest: "1.5M", expiry: "Mar 2025", tickSize: 0.25 },
  CL: { price: 78.45, change: -0.52, changePercent: -0.66, high: 79.20, low: 77.85, volume: "520K", openInterest: "1.8M", expiry: "Feb 2025", tickSize: 0.01 },
  GC: { price: 2035.80, change: 6.50, changePercent: 0.32, high: 2042.00, low: 2028.50, volume: "180K", openInterest: "580K", expiry: "Feb 2025", tickSize: 0.10 },
  SI: { price: 23.15, change: -0.04, changePercent: -0.17, high: 23.35, low: 22.95, volume: "95K", openInterest: "320K", expiry: "Mar 2025", tickSize: 0.005 },
};

export const FuturesMarketStats = ({ selectedContract }: FuturesMarketStatsProps) => {
  const { t } = useTranslation();
  const stats = futuresStats[selectedContract] || futuresStats.ES;
  const isPositive = stats.change > 0;

  return (
    <div className="bg-card border border-border rounded-lg p-3 lg:p-4">
      <div className="flex flex-wrap items-center gap-3 lg:gap-6">
        {/* Contract Symbol and Price */}
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg lg:text-2xl font-bold">{selectedContract}</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{t('futures.futures')}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl lg:text-3xl font-bold">{stats.price.toFixed(2)}</span>
              <div className={`flex items-center gap-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
                {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="text-sm lg:text-base font-medium">
                  {isPositive ? '+' : ''}{stats.change.toFixed(2)} ({isPositive ? '+' : ''}{stats.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Expiry */}
        <div className="flex items-center gap-2 text-xs lg:text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-primary">{stats.expiry}</span>
        </div>

        {/* Market Status */}
        <div className="flex items-center gap-2 text-xs lg:text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-success">{t('futures.trading')}</span>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 lg:gap-6 text-xs lg:text-sm">
          <div>
            <span className="text-muted-foreground">{t('trade.high')}:</span>
            <span className="ml-1 font-medium">{stats.high.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('trade.low')}:</span>
            <span className="ml-1 font-medium">{stats.low.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('trade.volume')}:</span>
            <span className="ml-1 font-medium">{stats.volume}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('futures.open_interest')}:</span>
            <span className="ml-1 font-medium">{stats.openInterest}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('futures.tick_size')}:</span>
            <span className="ml-1 font-medium">{stats.tickSize}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
