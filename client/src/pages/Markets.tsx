import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import { MarketList } from "@/components/market/MarketList";
import { Bitcoin, TrendingUp, BarChart3 } from "lucide-react";

type MarketCategory = "crypto" | "futures" | "stocks";

export default function Markets() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [category, setCategory] = useState<MarketCategory>("crypto");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return null;
  }

  const getCategoryTitle = () => {
    switch (category) {
      case "crypto":
        return t('markets.crypto_title', '加密行情');
      case "stocks":
        return t('markets.stocks_title', '股票行情');
      case "futures":
        return t('markets.futures_title', '期貨行情');
      default:
        return t('markets.crypto_title', '加密行情');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 lg:space-y-6 mb-20 lg:mb-0 px-2 lg:px-0">
        {/* 標題 + 三大類選項卡 */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl lg:text-2xl font-bold">{getCategoryTitle()}</h1>
          
          {/* 三大類選項卡 - 縮小版放右側 */}
          <div className="flex gap-1 p-0.5 bg-secondary/30 rounded-xl border border-border/50">
            <button
              onClick={() => setCategory("crypto")}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                category === "crypto" 
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <Bitcoin className="h-3 w-3" />
              <span className="hidden sm:inline">{t('markets.crypto', '加密貨幣')}</span>
            </button>
            <button
              onClick={() => setCategory("stocks")}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                category === "stocks" 
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <BarChart3 className="h-3 w-3" />
              <span className="hidden sm:inline">{t('markets.stocks', '股票')}</span>
            </button>
            <button
              onClick={() => setCategory("futures")}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                category === "futures" 
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <TrendingUp className="h-3 w-3" />
              <span className="hidden sm:inline">{t('markets.futures', '期貨')}</span>
            </button>
          </div>
        </div>

        <MarketList category={category} />
      </div>
    </AppLayout>
  );
}
