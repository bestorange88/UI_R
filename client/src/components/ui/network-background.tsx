import * as React from "react";
import { cn } from "@/lib/utils";

interface NetworkBackgroundProps {
  className?: string;
}

export function NetworkBackground({ className }: NetworkBackgroundProps) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {/* Network Lines SVG */}
      <svg
        className="absolute inset-0 w-full h-full opacity-30"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Network Lines */}
        <g stroke="url(#lineGradient)" strokeWidth="1" fill="none" filter="url(#glow)">
          <path d="M0 200 Q100 150 200 180 T400 160" />
          <path d="M50 300 Q150 280 250 320 T450 290" />
          <path d="M0 400 Q120 350 240 380 T480 360" />
          <path d="M100 500 Q200 450 300 480 T500 460" />
          <path d="M0 600 Q80 550 180 580 T380 560" />
        </g>
        
        {/* Network Nodes */}
        <g fill="hsl(var(--accent))" filter="url(#glow)">
          <circle cx="100" cy="150" r="4" opacity="0.8" />
          <circle cx="200" cy="180" r="3" opacity="0.6" />
          <circle cx="320" cy="160" r="5" opacity="0.7" />
          <circle cx="150" cy="280" r="3" opacity="0.5" />
          <circle cx="250" cy="320" r="4" opacity="0.8" />
          <circle cx="50" cy="400" r="3" opacity="0.6" />
          <circle cx="180" cy="380" r="4" opacity="0.7" />
          <circle cx="280" cy="350" r="3" opacity="0.5" />
          <circle cx="380" cy="320" r="5" opacity="0.8" />
          <circle cx="120" cy="500" r="4" opacity="0.6" />
          <circle cx="220" cy="480" r="3" opacity="0.7" />
          <circle cx="350" cy="450" r="4" opacity="0.5" />
          <circle cx="80" cy="600" r="3" opacity="0.8" />
          <circle cx="180" cy="580" r="5" opacity="0.6" />
          <circle cx="300" cy="550" r="4" opacity="0.7" />
        </g>
        
        {/* Connecting Lines */}
        <g stroke="hsl(var(--accent))" strokeWidth="0.5" opacity="0.4">
          <line x1="100" y1="150" x2="200" y2="180" />
          <line x1="200" y1="180" x2="320" y2="160" />
          <line x1="150" y1="280" x2="250" y2="320" />
          <line x1="250" y1="320" x2="380" y2="320" />
          <line x1="50" y1="400" x2="180" y2="380" />
          <line x1="180" y1="380" x2="280" y2="350" />
          <line x1="120" y1="500" x2="220" y2="480" />
          <line x1="220" y1="480" x2="350" y2="450" />
          <line x1="80" y1="600" x2="180" y2="580" />
          <line x1="180" y1="580" x2="300" y2="550" />
          {/* Cross connections */}
          <line x1="200" y1="180" x2="150" y2="280" />
          <line x1="250" y1="320" x2="180" y2="380" />
          <line x1="280" y1="350" x2="220" y2="480" />
          <line x1="350" y1="450" x2="300" y2="550" />
        </g>
      </svg>
      
      {/* Gradient Overlays */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#0d1117] to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0d1117] to-transparent" />
    </div>
  );
}
