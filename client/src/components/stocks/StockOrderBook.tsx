import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

interface StockOrderBookProps {
  symbol: string;
}

export const StockOrderBook = ({ symbol }: StockOrderBookProps) => {
  const { t } = useTranslation();

  // 模擬訂單簿數據
  const asks = [
    { price: 179.50, quantity: 1500, total: 269250 },
    { price: 179.45, quantity: 2200, total: 394790 },
    { price: 179.40, quantity: 800, total: 143520 },
    { price: 179.35, quantity: 3100, total: 555985 },
    { price: 179.30, quantity: 1800, total: 322740 },
  ];

  const bids = [
    { price: 179.20, quantity: 2500, total: 448000 },
    { price: 179.15, quantity: 1900, total: 340385 },
    { price: 179.10, quantity: 3200, total: 573120 },
    { price: 179.05, quantity: 1100, total: 196955 },
    { price: 179.00, quantity: 4500, total: 805500 },
  ];

  const maxTotal = Math.max(
    ...asks.map(a => a.total),
    ...bids.map(b => b.total)
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 pt-3 px-3 lg:px-6 lg:pt-6">
        <CardTitle className="text-xs lg:text-sm font-medium">{t('trade.order_book')}</CardTitle>
      </CardHeader>
      <CardContent className="px-3 lg:px-6 pb-3">
        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-3 text-[8px] lg:text-xs text-muted-foreground mb-2">
            <span>{t('trade.price')} (USD)</span>
            <span className="text-center">{t('trade.quantity')}</span>
            <span className="text-right">{t('trade.total')}</span>
          </div>

          {/* Asks (Sell orders) */}
          {asks.reverse().map((ask, index) => (
            <div key={`ask-${index}`} className="relative">
              <div 
                className="absolute right-0 top-0 bottom-0 bg-destructive/10"
                style={{ width: `${(ask.total / maxTotal) * 100}%` }}
              />
              <div className="relative grid grid-cols-3 text-[8px] lg:text-xs py-0.5">
                <span className="text-destructive">${ask.price.toFixed(2)}</span>
                <span className="text-center">{ask.quantity.toLocaleString()}</span>
                <span className="text-right text-muted-foreground">${(ask.total / 1000).toFixed(1)}K</span>
              </div>
            </div>
          ))}

          {/* Spread */}
          <div className="text-center py-1 lg:py-2 border-y border-border">
            <span className="text-[10px] lg:text-sm font-medium text-primary">$179.35</span>
            <span className="text-[8px] lg:text-xs text-muted-foreground ml-2">≈ $179.35</span>
          </div>

          {/* Bids (Buy orders) */}
          {bids.map((bid, index) => (
            <div key={`bid-${index}`} className="relative">
              <div 
                className="absolute right-0 top-0 bottom-0 bg-success/10"
                style={{ width: `${(bid.total / maxTotal) * 100}%` }}
              />
              <div className="relative grid grid-cols-3 text-[8px] lg:text-xs py-0.5">
                <span className="text-success">${bid.price.toFixed(2)}</span>
                <span className="text-center">{bid.quantity.toLocaleString()}</span>
                <span className="text-right text-muted-foreground">${(bid.total / 1000).toFixed(1)}K</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
