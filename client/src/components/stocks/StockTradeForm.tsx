import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { TrendingUp, TrendingDown, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useWebSocketPrice } from "@/hooks/useWebSocketPrice";

interface StockTradeFormProps {
  symbol: string;
  orderType: "buy" | "sell";
  onOrderTypeChange: (type: "buy" | "sell") => void;
}

export const StockTradeForm = ({ symbol, orderType, onOrderTypeChange }: StockTradeFormProps) => {
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [total, setTotal] = useState("");
  const { t } = useTranslation();

  // 使用WebSocket实时价格 - 股票使用HTTP轮询
  const {
    price: realtimePrice,
    priceChangePercent,
    connected: wsConnected,
    priceDirection,
    refresh: refreshPrice,
    loading: priceLoading
  } = useWebSocketPrice(symbol, {
    enabled: true,
    fallbackToPolling: true,
    pollingInterval: 3000
  });

  // 当实时价格更新时，同步更新价格输入框
  useEffect(() => {
    if (realtimePrice) {
      setPrice(realtimePrice.toFixed(2));
      if (quantity) {
        setTotal((realtimePrice * parseFloat(quantity)).toFixed(2));
      }
    }
  }, [realtimePrice, quantity]);

  const handlePriceChange = (value: string) => {
    setPrice(value);
    if (quantity) {
      setTotal((parseFloat(value) * parseFloat(quantity)).toFixed(2));
    }
  };

  const handleQuantityChange = (value: string) => {
    setQuantity(value);
    if (price) {
      setTotal((parseFloat(price) * parseFloat(value)).toFixed(2));
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 lg:pb-3 pt-3 lg:pt-6 px-3 lg:px-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold transition-colors duration-300 ${
              priceDirection === 'up' ? 'text-green-500' : 
              priceDirection === 'down' ? 'text-red-500' : ''
            }`}>
              ${realtimePrice ? realtimePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '--'}
            </span>
            {priceChangePercent !== undefined && (
              <span className={`flex items-center gap-1 text-xs ${priceChangePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {priceChangePercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 text-[10px] ${wsConnected ? 'text-green-500' : 'text-muted-foreground'}`}>
              {wsConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              <span>{wsConnected ? 'Live' : 'Polling'}</span>
            </span>
            <button
              onClick={refreshPrice}
              className="p-1 hover:bg-accent rounded transition-colors"
              disabled={priceLoading}
            >
              <RefreshCw className={`h-3 w-3 text-muted-foreground ${priceLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        <Tabs value={orderType} onValueChange={(v) => onOrderTypeChange(v as "buy" | "sell")}>
          <TabsList className="grid w-full grid-cols-2 h-8 lg:h-10">
            <TabsTrigger value="buy" className="text-xs lg:text-sm data-[state=active]:bg-success data-[state=active]:text-success-foreground">
              {t('trade.buy')}
            </TabsTrigger>
            <TabsTrigger value="sell" className="text-xs lg:text-sm data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground">
              {t('trade.sell')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="space-y-2 lg:space-y-4 px-3 lg:px-6 pb-0 lg:pb-6 flex-1 overflow-y-auto">
        <div className="space-y-1 lg:space-y-2">
          <label className="text-[10px] lg:text-xs text-muted-foreground">{t('trade.price')}</label>
          <div className="relative">
            <Input 
              type="number" 
              placeholder="0.00"
              value={price}
              onChange={(e) => handlePriceChange(e.target.value)}
              className="h-8 lg:h-10 text-xs lg:text-sm pr-12"
            />
            <span className="absolute right-2 lg:right-3 top-2 lg:top-2.5 text-[10px] lg:text-xs text-muted-foreground">USD</span>
          </div>
        </div>

        <div className="space-y-1 lg:space-y-2">
          <label className="text-[10px] lg:text-xs text-muted-foreground">{t('trade.quantity')}</label>
          <div className="relative">
            <Input 
              type="number" 
              placeholder="0"
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              className="h-8 lg:h-10 text-xs lg:text-sm pr-12"
            />
            <span className="absolute right-2 lg:right-3 top-2 lg:top-2.5 text-[10px] lg:text-xs text-muted-foreground">{t('trade.shares')}</span>
          </div>
          <div className="flex gap-1 lg:gap-2">
            {[25, 50, 75, 100].map((percent) => (
              <button
                key={percent}
                className="flex-1 px-1 lg:px-2 py-0.5 lg:py-1 text-[10px] lg:text-xs border border-border rounded hover:bg-accent transition-colors"
              >
                {percent}%
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1 lg:space-y-2">
          <label className="text-[10px] lg:text-xs text-muted-foreground">{t('trade.total')}</label>
          <div className="relative">
            <Input 
              type="number" 
              placeholder="0.00"
              value={total}
              readOnly
              className="bg-muted h-8 lg:h-10 text-xs lg:text-sm pr-12"
            />
            <span className="absolute right-2 lg:right-3 top-2 lg:top-2.5 text-[10px] lg:text-xs text-muted-foreground">USD</span>
          </div>
        </div>

        <div className="pt-1 lg:pt-2 space-y-1 lg:space-y-2">
          <div className="flex justify-between text-[10px] lg:text-xs">
            <span className="text-muted-foreground">{t('trade.available')}:</span>
            <span>$0.00 USD</span>
          </div>
          <Button 
            className={`w-full h-8 lg:h-10 text-xs lg:text-sm ${
              orderType === 'buy' 
                ? 'bg-success hover:bg-success/90' 
                : 'bg-destructive hover:bg-destructive/90'
            }`}
          >
            {orderType === 'buy' ? t('trade.buy') : t('trade.sell')} {symbol}
          </Button>
        </div>

        <div className="text-[10px] lg:text-xs text-center text-muted-foreground pt-1 pb-2 lg:pt-2 lg:pb-0">
          <span className="text-primary/70">{t('stocks.market_hours')}: 09:30 - 16:00 EST</span>
        </div>
      </CardContent>
    </Card>
  );
};
