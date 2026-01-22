import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { createChart, ColorType, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FuturesChartProps {
  symbol: string;
}

// 期貨基準價格 (用於 fallback)
const futuresBasePrice: Record<string, number> = {
  "ES": 5285.50,
  "NQ": 18450.25,
  "CL": 71.85,
  "GC": 2045.30,
  "SI": 23.45,
  "NG": 2.85,
  "ZB": 118.50,
  "ZN": 109.25,
};

// 生成模擬K線數據 (作為 fallback)
const generateFallbackData = (symbol: string, count: number = 100) => {
  const basePrice = futuresBasePrice[symbol] || 100;
  const data = [];
  const volumeData = [];
  let currentPrice = basePrice;
  const now = Math.floor(Date.now() / 1000);
  const interval = 15 * 60;

  for (let i = count; i >= 0; i--) {
    const time = now - i * interval;
    const volatility = basePrice * 0.002;
    const change = (Math.random() - 0.5) * volatility * 2;
    
    const open = currentPrice;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    
    currentPrice = close;

    data.push({
      time: time as any,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
    });

    volumeData.push({
      time: time as any,
      value: Math.floor(Math.random() * 50000 + 10000),
      color: close >= open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
    });
  }

  return { candlestickData: data, volumeData };
};

export const FuturesChart = ({ symbol }: FuturesChartProps) => {
  const { t } = useTranslation();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<{
    candlestickData: any[];
    volumeData: any[];
  } | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase.functions.invoke('futures-market-data', {
        body: { symbol, interval: '15m', range: '5d' }
      });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (data?.success && data.candlestickData?.length > 0) {
        setChartData({
          candlestickData: data.candlestickData,
          volumeData: data.volumeData,
        });
      } else {
        // 使用 fallback 數據
        console.log('Using fallback data for', symbol);
        setChartData(generateFallbackData(symbol));
      }
    } catch (err) {
      console.error('Failed to fetch futures data:', err);
      // 使用 fallback 數據
      setChartData(generateFallbackData(symbol));
    } finally {
      setIsLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!chartContainerRef.current || !chartData || isLoading) return;

    // 清除舊圖表
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#131722' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#1e222d' },
        horzLines: { color: '#1e222d' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#1e222d',
      },
      timeScale: {
        borderColor: '#1e222d',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // 添加K線
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderDownColor: '#ef5350',
      borderUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      wickUpColor: '#26a69a',
    });
    candlestickSeries.setData(chartData.candlestickData);

    // 添加成交量
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
    });
    
    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
    
    volumeSeries.setData(chartData.volumeData);

    chart.timeScale().fitContent();

    // 響應式調整
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [chartData, isLoading]);

  if (isLoading) {
    return (
      <Card className="p-0 overflow-hidden">
        <div className="w-full h-[400px] flex items-center justify-center bg-[#131722]">
          <div className="text-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">{t('trade.loading_chart')}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 z-10 h-8 w-8 bg-background/50 hover:bg-background/80"
        onClick={fetchData}
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
      <div 
        ref={chartContainerRef}
        className="w-full h-[400px]"
      />
    </Card>
  );
};
