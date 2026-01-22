import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";

interface StockChartProps {
  symbol: string;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

export const StockChart = ({ symbol }: StockChartProps) => {
  const { i18n, t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const containerIdRef = useRef<string>(`stock_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  const widgetRef = useRef<any>(null);
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);
  
  const getTradingViewLocale = (lang: string) => {
    const localeMap: Record<string, string> = {
      'zh-TW': 'zh_TW',
      'zh-CN': 'zh_CN',
      'en': 'en',
      'es': 'es',
      'fr': 'fr',
      'de': 'de',
      'ja': 'ja',
      'ko': 'ko',
      'ar': 'ar'
    };
    return localeMap[lang] || 'en';
  };

  useEffect(() => {
    const checkLibrary = () => {
      if (window.TradingView) {
        setIsLibraryLoaded(true);
        return true;
      }
      return false;
    };

    if (checkLibrary()) return;

    const interval = setInterval(() => {
      if (checkLibrary()) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !isLibraryLoaded || !window.TradingView) {
      return;
    }

    if (widgetRef.current) {
      try {
        const activeId = containerIdRef.current;
        const containerPresent = activeId ? document.getElementById(activeId) : null;
        if (containerPresent && widgetRef.current.remove && typeof widgetRef.current.remove === 'function') {
          widgetRef.current.remove();
        }
      } catch (e) {
        console.warn('TradingView widget cleanup skipped:', e);
      }
      widgetRef.current = null;
    }

    try {
      widgetRef.current = new window.TradingView.widget({
        width: containerRef.current.offsetWidth || 800,
        height: 400,
        symbol: `NASDAQ:${symbol}`,
        interval: "D",
        timezone: "America/New_York",
        theme: "dark",
        style: "1",
        locale: getTradingViewLocale(i18n.language),
        toolbar_bg: "#131722",
        enable_publishing: false,
        allow_symbol_change: true,
        container_id: containerIdRef.current,
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: true,
        studies: [
          "MASimple@tv-basicstudies",
          "Volume@tv-basicstudies"
        ],
        overrides: {
          "paneProperties.background": "#131722",
          "paneProperties.backgroundType": "solid",
          "paneProperties.vertGridProperties.color": "#1e222d",
          "paneProperties.horzGridProperties.color": "#1e222d",
          "scalesProperties.textColor": "#d1d4dc",
          "scalesProperties.lineColor": "#1e222d",
          "mainSeriesProperties.candleStyle.upColor": "#26a69a",
          "mainSeriesProperties.candleStyle.downColor": "#ef5350",
          "mainSeriesProperties.candleStyle.borderUpColor": "#26a69a",
          "mainSeriesProperties.candleStyle.borderDownColor": "#ef5350",
          "mainSeriesProperties.candleStyle.wickUpColor": "#26a69a",
          "mainSeriesProperties.candleStyle.wickDownColor": "#ef5350",
        }
      });
    } catch (error) {
      console.error('Error creating TradingView widget:', error);
    }

    return () => {
      if (widgetRef.current) {
        try {
          const activeId = containerIdRef.current;
          const containerPresent = activeId ? document.getElementById(activeId) : null;
          if (containerPresent && widgetRef.current.remove && typeof widgetRef.current.remove === 'function') {
            widgetRef.current.remove();
          }
        } catch (e) {
          console.warn('TradingView widget cleanup skipped:', e);
        } finally {
          widgetRef.current = null;
        }
      }
    };
  }, [symbol, isLibraryLoaded, i18n.language]);

  if (!isLibraryLoaded) {
    return (
      <Card className="p-0 overflow-hidden">
        <div className="w-full h-[400px] flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">{t('trade.loading_chart')}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div 
        ref={containerRef}
        id={containerIdRef.current}
        className="w-full h-[400px]"
      />
    </Card>
  );
};
