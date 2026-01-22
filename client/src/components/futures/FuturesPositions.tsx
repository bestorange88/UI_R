import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export const FuturesPositions = () => {
  const { t } = useTranslation();

  // 模擬持倉數據
  const positions = [
    { symbol: "ES", side: "long", contracts: 5, entryPrice: 5275.00, markPrice: 5285.50, pnl: 525.00, pnlPercent: 1.99, leverage: 10, margin: 2637.50 },
    { symbol: "GC", side: "short", contracts: 2, entryPrice: 2040.00, markPrice: 2035.80, pnl: 840.00, pnlPercent: 0.41, leverage: 20, margin: 204.00 },
  ];

  return (
    <Card>
      <CardHeader className="pb-2 pt-3 px-3 lg:px-6 lg:pt-6">
        <CardTitle className="text-xs lg:text-sm font-medium">{t('futures.positions')}</CardTitle>
      </CardHeader>
      <CardContent className="px-3 lg:px-6 pb-3">
        {positions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {t('futures.no_positions')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] lg:text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-medium text-muted-foreground">{t('futures.contract')}</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">{t('futures.side')}</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">{t('futures.size')}</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">{t('futures.entry_price')}</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">{t('futures.mark_price')}</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">{t('futures.pnl')}</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((position, index) => (
                  <tr key={index} className="border-b border-border/50">
                    <td className="py-2 font-medium">{position.symbol}</td>
                    <td className="py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] lg:text-[10px] font-medium ${
                        position.side === 'long' 
                          ? 'bg-success/20 text-success' 
                          : 'bg-destructive/20 text-destructive'
                      }`}>
                        {position.side === 'long' ? t('futures.long') : t('futures.short')} {position.leverage}x
                      </span>
                    </td>
                    <td className="py-2 text-right">{position.contracts}</td>
                    <td className="py-2 text-right">{position.entryPrice.toFixed(2)}</td>
                    <td className="py-2 text-right">{position.markPrice.toFixed(2)}</td>
                    <td className={`py-2 text-right ${position.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                      <span className="text-muted-foreground ml-1">({position.pnl >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%)</span>
                    </td>
                    <td className="py-2 text-right">
                      <Button variant="outline" size="sm" className="h-6 text-[10px] lg:text-xs">
                        {t('futures.close')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
