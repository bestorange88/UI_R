import * as React from "react";
import { cn } from "@/lib/utils";

interface DeviceFrameProps {
  children: React.ReactNode;
  className?: string;
}

export function DeviceFrame({ children, className }: DeviceFrameProps) {
  return (
    <div className={cn("relative", className)}>
      {/* iPhone Pro Max Frame */}
      <div className="relative mx-auto w-[375px] h-[812px] bg-black rounded-[55px] border-[14px] border-gray-900 shadow-2xl shadow-black/50">
        {/* Dynamic Island */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[126px] h-[37px] bg-black rounded-b-[24px] z-50" />
        
        {/* Side Buttons - Left */}
        <div className="absolute -left-[17px] top-[120px] w-[3px] h-[32px] bg-gray-800 rounded-l-sm" />
        <div className="absolute -left-[17px] top-[175px] w-[3px] h-[64px] bg-gray-800 rounded-l-sm" />
        <div className="absolute -left-[17px] top-[255px] w-[3px] h-[64px] bg-gray-800 rounded-l-sm" />
        
        {/* Side Buttons - Right */}
        <div className="absolute -right-[17px] top-[195px] w-[3px] h-[96px] bg-gray-800 rounded-r-sm" />
        
        {/* Screen Container */}
        <div className="relative w-full h-full rounded-[41px] overflow-hidden bg-[#0d1117]">
          {/* Status Bar */}
          <div className="absolute top-0 left-0 right-0 h-[50px] flex items-end justify-between px-8 pb-1 z-40">
            <span className="text-white text-sm font-medium">01:19</span>
            <div className="flex items-center gap-1">
              <span className="text-white text-xs">5G</span>
              <span className="text-white text-xs">100%</span>
              <svg className="w-6 h-3 text-white" viewBox="0 0 25 12" fill="currentColor">
                <rect x="0" y="1" width="21" height="10" rx="2" stroke="currentColor" strokeWidth="1" fill="none"/>
                <rect x="2" y="3" width="17" height="6" rx="1" fill="currentColor"/>
                <rect x="22" y="4" width="2" height="4" rx="0.5" fill="currentColor"/>
              </svg>
            </div>
          </div>
          
          {/* Content Area */}
          <div className="w-full h-full pt-[50px] pb-[34px] overflow-y-auto scrollbar-hide">
            {children}
          </div>
          
          {/* Home Indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[134px] h-[5px] bg-white/30 rounded-full" />
        </div>
      </div>
    </div>
  );
}
