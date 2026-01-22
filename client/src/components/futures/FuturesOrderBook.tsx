import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

interface FuturesOrderBookProps {
  symbol: string;
}

export const FuturesOrderBook = ({ symbol }: FuturesOrderBookProps) => {
  const { t } = useTranslation();

  // 模擬訂單簿數據
  const asks = [
    { price: 5286.50, quantity: 125, total: 660812 },
    { price: 5286.25, quantity: 89, total: 470476 },
    { price: 5286.00, quantity: 156, total: 824616 },
    { price: 5285.75, quantity: 234, total: 1236865 },
    { price: 5285.50, quantity: 178, total: 940819 },
  ];

  const bids = [
    { price: 5285.25, quantity: 145, total: 766361 },
    { price: 5285.00, quantity: 267, total: 1411095 },
    { price: 5284.75, quantity: 198, total: 1046380 },
    { price: 5284.50, quantity: 312, total: 1648764 },
    { price: 5284.25, quantity: 89, total: 470298 },
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
            <span>{t('trade.price')}</span>
            <span className="text-center">{t('futures.contracts')}</span>
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
                <span className="text-destructive">{ask.price.toFixed(2)}</span>
                <span className="text-center">{ask.quantity}</span>
                <span className="text-right text-muted-foreground">${(ask.total / 1000).toFixed(0)}K</span>
              </div>
            </div>
          ))}

          {/* Spread */}
          <div className="text-center py-1 lg:py-2 border-y border-border">
            <span className="text-[10px] lg:text-sm font-medium text-primary">5285.50</span>
            <span className="text-[8px] lg:text-xs text-muted-foreground ml-2">Spread: 0.25</span>
          </div>

          {/* Bids (Buy orders) */}
          {bids.map((bid, index) => (
            <div key={`bid-${index}`} className="relative">
              <div 
                className="absolute right-0 top-0 bottom-0 bg-success/10"
                style={{ width: `${(bid.total / maxTotal) * 100}%` }}
              />
              <div className="relative grid grid-cols-3 text-[8px] lg:text-xs py-0.5">
                <span className="text-success">{bid.price.toFixed(2)}</span>
                <span className="text-center">{bid.quantity}</span>
                <span className="text-right text-muted-foreground">${(bid.total / 1000).toFixed(0)}K</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
