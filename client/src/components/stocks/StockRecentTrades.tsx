import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

interface StockRecentTradesProps {
  symbol: string;
}

export const StockRecentTrades = ({ symbol }: StockRecentTradesProps) => {
  const { t } = useTranslation();

  // 模擬最近交易數據
  const trades = [
    { price: 178.52, quantity: 500, time: "14:35:22", type: "buy" },
    { price: 178.50, quantity: 1200, time: "14:35:18", type: "sell" },
    { price: 178.55, quantity: 800, time: "14:35:15", type: "buy" },
    { price: 178.48, quantity: 350, time: "14:35:12", type: "sell" },
    { price: 178.52, quantity: 2000, time: "14:35:08", type: "buy" },
    { price: 178.45, quantity: 650, time: "14:35:05", type: "sell" },
    { price: 178.50, quantity: 1100, time: "14:35:02", type: "buy" },
    { price: 178.48, quantity: 900, time: "14:34:58", type: "sell" },
    { price: 178.55, quantity: 450, time: "14:34:55", type: "buy" },
    { price: 178.52, quantity: 1500, time: "14:34:52", type: "buy" },
  ];

  return (
    <Card>
      <CardHeader className="pb-2 pt-3 px-3 lg:px-6 lg:pt-6">
        <CardTitle className="text-xs lg:text-sm font-medium">{t('trade.recent_trades')}</CardTitle>
      </CardHeader>
      <CardContent className="px-3 lg:px-6 pb-3">
        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-3 text-[8px] lg:text-xs text-muted-foreground mb-2">
            <span>{t('trade.price')} (USD)</span>
            <span className="text-center">{t('trade.quantity')}</span>
            <span className="text-right">{t('trade.time')}</span>
          </div>

          {/* Trades */}
          {trades.map((trade, index) => (
            <div key={index} className="grid grid-cols-3 text-[8px] lg:text-xs py-0.5">
              <span className={trade.type === 'buy' ? 'text-success' : 'text-destructive'}>
                ${trade.price.toFixed(2)}
              </span>
              <span className="text-center">{trade.quantity.toLocaleString()}</span>
              <span className="text-right text-muted-foreground">{trade.time}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
