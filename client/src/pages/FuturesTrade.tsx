import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import AppLayout from "@/components/layout/AppLayout";
import { FuturesChart } from "@/components/futures/FuturesChart";
import { FuturesList } from "@/components/futures/FuturesList";
import { FuturesTradeForm } from "@/components/futures/FuturesTradeForm";
import { FuturesOrderBook } from "@/components/futures/FuturesOrderBook";
import { FuturesMarketStats } from "@/components/futures/FuturesMarketStats";
import { FuturesPositions } from "@/components/futures/FuturesPositions";

const FuturesTrade = () => {
  const [selectedContract, setSelectedContract] = useState("ES");
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
      <FuturesMarketStats selectedContract={selectedContract} />

      {/* Main Trading Interface */}
      <div className="mt-4 mb-20 lg:mb-4">
        {/* Mobile: Stacked Layout */}
        <div className="lg:hidden space-y-3">
          <FuturesChart symbol={selectedContract} />
          
          <div className="grid grid-cols-10 gap-3 h-[420px]">
            <div className="col-span-6 h-full">
              <FuturesTradeForm 
                symbol={selectedContract}
                orderType={orderType}
                onOrderTypeChange={setOrderType}
              />
            </div>
            <div className="col-span-4 h-full">
              <FuturesList 
                selectedContract={selectedContract}
                onSelectContract={setSelectedContract}
              />
            </div>
          </div>
          
          <FuturesPositions />
          <FuturesOrderBook symbol={selectedContract} />
        </div>

        {/* Desktop: Grid Layout */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-4">
          <div className="lg:col-span-2">
            <FuturesList 
              selectedContract={selectedContract}
              onSelectContract={setSelectedContract}
            />
          </div>

          <div className="lg:col-span-7 space-y-4">
            <FuturesChart symbol={selectedContract} />
            <FuturesPositions />
          </div>

          <div className="lg:col-span-3 space-y-4">
            <FuturesTradeForm 
              symbol={selectedContract}
              orderType={orderType}
              onOrderTypeChange={setOrderType}
            />
            <FuturesOrderBook symbol={selectedContract} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default FuturesTrade;
