import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface StockListProps {
  selectedStock: string;
  onSelectStock: (symbol: string) => void;
}

// 模擬股票數據
const stockData = [
  { symbol: "AAPL", name: "蘋果公司", price: 178.52, change: 2.35 },
  { symbol: "GOOGL", name: "Alphabet", price: 141.80, change: -0.82 },
  { symbol: "MSFT", name: "微軟", price: 378.91, change: 4.21 },
  { symbol: "AMZN", name: "亞馬遜", price: 178.25, change: 1.15 },
  { symbol: "TSLA", name: "特斯拉", price: 248.50, change: -3.42 },
  { symbol: "META", name: "Meta", price: 505.75, change: 8.32 },
  { symbol: "NVDA", name: "輝達", price: 875.35, change: 15.20 },
  { symbol: "AMD", name: "超微", price: 156.80, change: 2.10 },
  { symbol: "NFLX", name: "網飛", price: 628.40, change: 5.60 },
  { symbol: "DIS", name: "迪士尼", price: 112.35, change: -1.25 },
  { symbol: "BA", name: "波音", price: 178.90, change: 0.85 },
  { symbol: "JPM", name: "摩根大通", price: 198.45, change: 1.20 },
];

export const StockList = ({ selectedStock, onSelectStock }: StockListProps) => {
  const [search, setSearch] = useState("");
  const { t } = useTranslation();

  const filteredStocks = stockData.filter(stock => 
    stock.symbol.toLowerCase().includes(search.toLowerCase()) ||
    stock.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-card border border-border rounded-lg p-1.5 lg:p-3 h-full flex flex-col overflow-hidden">
      <div className="mb-1 lg:mb-3">
        <div className="relative">
          <Search className="absolute left-1.5 top-1.5 lg:top-2.5 h-2.5 w-2.5 lg:h-4 lg:w-4 text-muted-foreground" />
          <Input 
            placeholder={t('common.search')}
            className="pl-6 lg:pl-8 h-6 lg:h-9 text-[9px] lg:text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-px lg:space-y-1 scrollbar-hide">
        {filteredStocks.map((stock) => {
          const isPositive = stock.change > 0;
          const isSelected = stock.symbol === selectedStock;
          
          return (
            <button
              key={stock.symbol}
              onClick={() => onSelectStock(stock.symbol)}
              className={`w-full text-left px-1.5 py-0.5 lg:p-2 rounded transition-colors ${
                isSelected 
                  ? 'bg-primary/10 border border-primary' 
                  : 'hover:bg-accent'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-[9px] lg:text-sm overflow-hidden text-ellipsis whitespace-nowrap">{stock.symbol}</span>
                <span className={`text-[8px] lg:text-xs font-medium flex-shrink-0 ml-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
                  {isPositive ? '+' : ''}{stock.change.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[8px] lg:text-xs text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">{stock.name}</span>
                <span className="text-[8px] lg:text-xs text-muted-foreground">${stock.price.toFixed(2)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
