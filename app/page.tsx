"use client";

import { ModernSwapInterface } from "@/components/modern-swap-interface";
import { TradingChart } from "@/components/trading-chart";
import { useState } from "react";

export default function Home() {
  const [showChart, setShowChart] = useState(false);

  const handleToggleChart = () => {
    setShowChart(!showChart);
  };

  const handleRefreshData = () => {
    // 这里可以添加刷新数据的逻辑
    console.log("Refreshing data...");
  };
  return (
    <div className="min-h-screen w-full">
      {/* 移动端布局 */}
      <div className="lg:hidden w-full p-4 space-y-6">
        <ModernSwapInterface 
          onToggleChart={handleToggleChart}
          onRefreshData={handleRefreshData}
        />
        {showChart && <TradingChart />}
      </div>

      {/* PC端布局 */}
      <div className="hidden lg:flex w-full h-screen">
        <div className="max-w-1440 mx-auto w-full flex">
          {/* 左侧 K线图 */}
          {showChart && (
            <div className="flex-1 p-4 pt-8">
              <TradingChart />
            </div>
          )}
          
          {/* 右侧 Swap */}
          <div className={`${showChart ? 'w-[480px]' : 'flex-1 max-w-md mx-auto'} p-4 pt-6`}>
            <ModernSwapInterface 
              onToggleChart={handleToggleChart}
              onRefreshData={handleRefreshData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
