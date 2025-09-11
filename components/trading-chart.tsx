"use client";

import { FC, useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Tabs, Tab } from "@heroui/tabs";

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const generateMockData = (days: number = 30): CandleData[] => {
  const data: CandleData[] = [];
  let price = 2800; // Starting price for ETH
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const open = price;
    const change = (Math.random() - 0.5) * 200; // Price change up to ±100
    const close = Math.max(open + change, 100); // Minimum price of 100
    const high = Math.max(open, close) + Math.random() * 50;
    const low = Math.min(open, close) - Math.random() * 50;
    const volume = Math.random() * 1000000 + 500000;
    
    data.push({
      time: date.toLocaleDateString(),
      open,
      high,
      low,
      close,
      volume
    });
    
    price = close;
  }
  
  return data;
};

export const TradingChart: FC = () => {
  const [data, setData] = useState<CandleData[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState("1D");
  const [currentPrice, setCurrentPrice] = useState(2800);
  const [priceChange, setPriceChange] = useState(0);
  const [priceChangePercent, setPriceChangePercent] = useState(0);

  useEffect(() => {
    const mockData = generateMockData(30);
    setData(mockData);
    
    if (mockData.length > 0) {
      const latest = mockData[mockData.length - 1];
      const previous = mockData[mockData.length - 2];
      
      setCurrentPrice(latest.close);
      const change = latest.close - previous.close;
      setPriceChange(change);
      setPriceChangePercent((change / previous.close) * 100);
    }
  }, []);

  const timeframes = [
    { key: "15m", label: "15分" },
    { key: "1h", label: "1时" },
    { key: "4h", label: "4时" },
    { key: "1D", label: "1日" },
    { key: "1W", label: "1周" },
  ];

  const isPositive = priceChange >= 0;

  return (
    <Card className="w-full h-fit max-h-full shadow-lg border border-default-200">
      <CardHeader className="flex flex-col gap-4 pb-4">
        {/* 价格信息 */}
        <div className="w-full">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-2xl font-bold">ETH/USDT</span>
            <Chip
              variant="flat"
              className={`${isPositive ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}
            >
              {isPositive ? '↗' : '↘'} {Math.abs(priceChangePercent).toFixed(2)}%
            </Chip>
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">
              ${currentPrice.toFixed(2)}
            </span>
            <span className={`text-lg ${isPositive ? 'text-success' : 'text-danger'}`}>
              {isPositive ? '+' : ''}${priceChange.toFixed(2)}
            </span>
          </div>
          
          <div className="text-sm text-default-500 mt-1">
            24小时价格变化
          </div>
        </div>

        {/* 时间框架选择 */}
        <Tabs
          selectedKey={selectedTimeframe}
          onSelectionChange={(key) => setSelectedTimeframe(key as string)}
          variant="bordered"
          size="sm"
        >
          {timeframes.map((timeframe) => (
            <Tab key={timeframe.key} title={timeframe.label} />
          ))}
        </Tabs>
      </CardHeader>

      <CardBody className="p-6">
        {/* 简化的K线图 */}
        <div className="relative w-full h-64 lg:h-80 bg-default-50 rounded-lg overflow-hidden">
          <svg className="w-full h-full">
            {/* 网格线 */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgb(var(--nextui-default-300))" strokeWidth="0.5" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* K线图绘制 */}
            {data.slice(-20).map((candle, index) => {
              const x = (index / 19) * 100;
              const maxPrice = Math.max(...data.slice(-20).map(d => d.high));
              const minPrice = Math.min(...data.slice(-20).map(d => d.low));
              const priceRange = maxPrice - minPrice;
              
              const openY = ((maxPrice - candle.open) / priceRange) * 80 + 10;
              const closeY = ((maxPrice - candle.close) / priceRange) * 80 + 10;
              const highY = ((maxPrice - candle.high) / priceRange) * 80 + 10;
              const lowY = ((maxPrice - candle.low) / priceRange) * 80 + 10;
              
              const isGreen = candle.close > candle.open;
              const color = isGreen ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)";
              
              return (
                <g key={index}>
                  {/* 影线 */}
                  <line
                    x1={`${x}%`}
                    y1={`${highY}%`}
                    x2={`${x}%`}
                    y2={`${lowY}%`}
                    stroke={color}
                    strokeWidth="1"
                  />
                  {/* 实体 */}
                  <rect
                    x={`${x - 1}%`}
                    y={`${Math.min(openY, closeY)}%`}
                    width="2%"
                    height={`${Math.abs(openY - closeY)}%`}
                    fill={color}
                    opacity="0.8"
                  />
                </g>
              );
            })}
          </svg>
          
          {/* 价格标签 */}
          <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded px-2 py-1">
            <span className="text-xs text-default-600">
              最高: ${Math.max(...data.slice(-20).map(d => d.high)).toFixed(2)}
            </span>
          </div>
          <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm rounded px-2 py-1">
            <span className="text-xs text-default-600">
              最低: ${Math.min(...data.slice(-20).map(d => d.low)).toFixed(2)}
            </span>
          </div>
        </div>

        {/* 交易量 */}
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-2">成交量</h4>
          <div className="flex items-end gap-1 h-16">
            {data.slice(-20).map((candle, index) => {
              const maxVolume = Math.max(...data.slice(-20).map(d => d.volume));
              const height = (candle.volume / maxVolume) * 100;
              const isGreen = candle.close > candle.open;
              
              return (
                <div
                  key={index}
                  className={`flex-1 rounded-t ${
                    isGreen ? 'bg-success/30' : 'bg-danger/30'
                  }`}
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};