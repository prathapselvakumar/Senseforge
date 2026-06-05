"use client";

import * as React from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const TABS = ["RGB", "Depth", "IR", "Detection"] as const;
type Tab = typeof TABS[number];

export default function LiveViewPage() {
  const [activeTab, setActiveTab] = React.useState<Tab>("RGB");

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <PageHeader
        title={
          <div className="flex items-center gap-4">
            <span>Live View</span>
            <span className="text-sm font-normal text-secondary border-l border-subtle pl-4">
              D435i
            </span>
            <Badge variant="connected">Streaming</Badge>
            <span className="text-sm font-mono text-tertiary ml-2">30 FPS · 1280×720</span>
          </div>
        }
      />

      <div className="flex flex-col flex-1 min-h-0 gap-4">
        {/* Tab Bar */}
        <div className="flex items-center gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                activeTab === tab
                  ? "bg-accent text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                  : "bg-surface border border-subtle text-secondary hover:text-primary hover:border-default"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Camera Feed Container */}
        <div className="flex-1 bg-black rounded-lg border border-subtle overflow-hidden relative flex items-center justify-center min-h-0 shadow-xl">
          {/* Mock Feed Content based on active tab */}
          <div 
            className={cn(
              "w-full max-w-[1280px] aspect-video relative flex items-center justify-center transition-colors duration-500",
              {
                "bg-[#111]": activeTab === "RGB" || activeTab === "Detection",
                "bg-gradient-to-r from-blue-900 via-green-600 to-red-600": activeTab === "Depth",
                "bg-[#222] grayscale": activeTab === "IR",
              }
            )}
          >
            <span className="text-white/20 font-mono text-xl tracking-widest absolute">
              [ {activeTab.toUpperCase()} FEED ]
            </span>

            {/* Bounding Box Mock (Detection mode only) */}
            {activeTab === "Detection" && (
              <div className="absolute top-[30%] left-[40%] w-[120px] h-[120px] border-2 border-[#22C55E] bg-[#22C55E]/10">
                <div className="absolute -top-[22px] -left-0.5 bg-[#22C55E] text-black text-[11px] font-bold px-1.5 py-0.5">
                  Widget 0.94
                </div>
              </div>
            )}
            
            {activeTab === "Detection" && (
              <div className="absolute top-[45%] left-[60%] w-[180px] h-[140px] border-2 border-[#3B82F6] bg-[#3B82F6]/10">
                <div className="absolute -top-[22px] -left-0.5 bg-[#3B82F6] text-white text-[11px] font-bold px-1.5 py-0.5">
                  Gear 0.82
                </div>
              </div>
            )}
          </div>

          {/* Overlay Chips */}
          <div className="absolute top-4 right-4 bg-black/60 text-white text-[11px] font-mono px-2 py-1 rounded backdrop-blur-sm border border-white/10">
            30 FPS • 1280×720
          </div>
          <div className="absolute bottom-4 left-4 bg-black/60 text-white text-[11px] font-mono px-2 py-1 rounded backdrop-blur-sm border border-white/10">
            Intel RealSense D435i
          </div>
          <div className="absolute bottom-4 right-4 bg-black/60 text-white text-[11px] font-mono px-2 py-1 rounded backdrop-blur-sm border border-white/10 uppercase tracking-wider">
            {activeTab} MODE
          </div>
        </div>

        {/* Stats Bar */}
        <div className="h-14 shrink-0 rounded-lg border border-subtle bg-surface flex items-center justify-between px-6">
          {activeTab === "Depth" ? (
            <div className="flex items-center gap-4 w-full max-w-[600px]">
              <span className="text-secondary text-sm font-mono">Min: 0.3m</span>
              <div className="flex-1 h-3 rounded-full bg-gradient-to-r from-blue-600 via-green-500 to-red-500 opacity-80" />
              <span className="text-secondary text-sm font-mono">Max: 3.0m</span>
            </div>
          ) : activeTab === "Detection" ? (
            <div className="flex items-center gap-8 font-mono text-sm">
              <div className="flex items-center gap-2">
                <span className="text-secondary">Objects detected:</span>
                <span className="text-primary font-bold text-green">3</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-secondary">Avg confidence:</span>
                <span className="text-primary">0.87</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-tertiary">Standard stream telemetry active.</div>
          )}
        </div>
      </div>
    </div>
  );
}
