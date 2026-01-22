import { useTranslation } from "react-i18next";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";

interface StockMarketStatsProps {
  selectedStock: string;
}

// 模擬股票市場數據
const stockStats: Record<string, any> = {
  AAPL: { price: 178.52, change: 2.35, changePercent: 1.33, high: 180.10, low: 176.80, volume: "52.3M", open: 177.20, prevClose: 174.17, marketCap: "2.78T" },
  GOOGL: { price: 141.80, change: -0.82, changePercent: -0.58, high: 143.50, low: 140.90, volume: "18.7M", open: 142.50, prevClose: 142.62, marketCap: "1.76T" },
  MSFT: { price: 378.91, change: 4.21, changePercent: 1.12, high: 380.50, low: 375.20, volume: "21.5M", open: 376.00, prevClose: 374.70, marketCap: "2.81T" },
  AMZN: { price: 178.25, change: 1.15, changePercent: 0.65, high: 179.80, low: 176.50, volume: "38.2M", open: 177.50, prevClose: 177.10, marketCap: "1.86T" },
  TSLA: { price: 248.50, change: -3.42, changePercent: -1.36, high: 253.20, low: 246.80, volume: "95.6M", open: 251.00, prevClose: 251.92, marketCap: "789B" },
};

export const StockMarketStats = ({ selectedStock }: StockMarketStatsProps) => {
  const { t } = useTranslation();
  const stats = stockStats[selectedStock] || stockStats.AAPL;
  const isPositive = stats.change > 0;

  return (
    <div className="bg-card border border-border rounded-lg p-3 lg:p-4">
      <div className="flex flex-wrap items-center gap-3 lg:gap-6">
        {/* Stock Symbol and Price */}
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg lg:text-2xl font-bold">{selectedStock}</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">NASDAQ</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl lg:text-3xl font-bold">${stats.price.toFixed(2)}</span>
              <div className={`flex items-center gap-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
                {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="text-sm lg:text-base font-medium">
                  {isPositive ? '+' : ''}{stats.change.toFixed(2)} ({isPositive ? '+' : ''}{stats.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Market Status */}
        <div className="flex items-center gap-2 text-xs lg:text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-success">{t('stocks.market_open')}</span>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 lg:gap-6 text-xs lg:text-sm">
          <div>
            <span className="text-muted-foreground">{t('trade.high')}:</span>
            <span className="ml-1 font-medium">${stats.high.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('trade.low')}:</span>
            <span className="ml-1 font-medium">${stats.low.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('trade.volume')}:</span>
            <span className="ml-1 font-medium">{stats.volume}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('stocks.open')}:</span>
            <span className="ml-1 font-medium">${stats.open.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('stocks.prev_close')}:</span>
            <span className="ml-1 font-medium">${stats.prevClose.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('stocks.market_cap')}:</span>
            <span className="ml-1 font-medium">${stats.marketCap}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
