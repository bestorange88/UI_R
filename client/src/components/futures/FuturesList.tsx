import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface FuturesListProps {
  selectedContract: string;
  onSelectContract: (symbol: string) => void;
}

// 模擬期貨數據
const futuresData = [
  { symbol: "ES", name: "E-mini S&P 500", price: 5285.50, change: 0.85, expiry: "Mar 2025" },
  { symbol: "NQ", name: "E-mini NASDAQ", price: 18520.25, change: 1.12, expiry: "Mar 2025" },
  { symbol: "CL", name: "原油期貨", price: 78.45, change: -0.65, expiry: "Feb 2025" },
  { symbol: "GC", name: "黃金期貨", price: 2035.80, change: 0.32, expiry: "Feb 2025" },
  { symbol: "SI", name: "白銀期貨", price: 23.15, change: -0.18, expiry: "Mar 2025" },
  { symbol: "NG", name: "天然氣期貨", price: 2.85, change: 2.45, expiry: "Feb 2025" },
  { symbol: "ZB", name: "30年國債", price: 119.50, change: -0.12, expiry: "Mar 2025" },
  { symbol: "ZN", name: "10年國債", price: 110.25, change: -0.08, expiry: "Mar 2025" },
  { symbol: "YM", name: "E-mini 道瓊斯", price: 38950.00, change: 0.45, expiry: "Mar 2025" },
  { symbol: "RTY", name: "E-mini 羅素2000", price: 2015.30, change: 0.78, expiry: "Mar 2025" },
];

export const FuturesList = ({ selectedContract, onSelectContract }: FuturesListProps) => {
  const [search, setSearch] = useState("");
  const { t } = useTranslation();

  const filteredContracts = futuresData.filter(contract => 
    contract.symbol.toLowerCase().includes(search.toLowerCase()) ||
    contract.name.toLowerCase().includes(search.toLowerCase())
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
        {filteredContracts.map((contract) => {
          const isPositive = contract.change > 0;
          const isSelected = contract.symbol === selectedContract;
          
          return (
            <button
              key={contract.symbol}
              onClick={() => onSelectContract(contract.symbol)}
              className={`w-full text-left px-1.5 py-0.5 lg:p-2 rounded transition-colors ${
                isSelected 
                  ? 'bg-primary/10 border border-primary' 
                  : 'hover:bg-accent'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-[9px] lg:text-sm overflow-hidden text-ellipsis whitespace-nowrap">{contract.symbol}</span>
                <span className={`text-[8px] lg:text-xs font-medium flex-shrink-0 ml-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
                  {isPositive ? '+' : ''}{contract.change.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[8px] lg:text-xs text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">{contract.name}</span>
                <span className="text-[8px] lg:text-xs text-muted-foreground">{contract.expiry}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
