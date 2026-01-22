import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import AppLayout from "@/components/layout/AppLayout";
import { StockChart } from "@/components/stocks/StockChart";
import { StockList } from "@/components/stocks/StockList";
import { StockTradeForm } from "@/components/stocks/StockTradeForm";
import { StockOrderBook } from "@/components/stocks/StockOrderBook";
import { StockMarketStats } from "@/components/stocks/StockMarketStats";
import { StockRecentTrades } from "@/components/stocks/StockRecentTrades";

const StockTrade = () => {
  const [selectedStock, setSelectedStock] = useState("AAPL");
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy");
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return null;
  }

  return (
    <AppLayout>
      {/* Market Stats Bar */}
      <StockMarketStats selectedStock={selectedStock} />

      {/* Main Trading Interface */}
      <div className="mt-4 mb-20 lg:mb-4">
        {/* Mobile: Stacked Layout */}
        <div className="lg:hidden space-y-3">
          <StockChart symbol={selectedStock} />
          
          <div className="grid grid-cols-10 gap-3 h-[420px]">
            <div className="col-span-6 h-full">
              <StockTradeForm 
                symbol={selectedStock}
                orderType={orderType}
                onOrderTypeChange={setOrderType}
              />
            </div>
            <div className="col-span-4 h-full">
              <StockList 
                selectedStock={selectedStock}
                onSelectStock={setSelectedStock}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <StockOrderBook symbol={selectedStock} />
            <StockRecentTrades symbol={selectedStock} />
          </div>
        </div>

        {/* Desktop: Grid Layout */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-4">
          <div className="lg:col-span-2">
            <StockList 
              selectedStock={selectedStock}
              onSelectStock={setSelectedStock}
            />
          </div>

          <div className="lg:col-span-7 space-y-4">
            <StockChart symbol={selectedStock} />
            <StockRecentTrades symbol={selectedStock} />
          </div>

          <div className="lg:col-span-3 space-y-4">
            <StockTradeForm 
              symbol={selectedStock}
              orderType={orderType}
              onOrderTypeChange={setOrderType}
            />
            <StockOrderBook symbol={selectedStock} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default StockTrade;
