"use client";

import * as React from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Play, Pause, RotateCcw, Rocket, Globe } from "lucide-react";

export default function SimulationPage() {
  const [isPlaying, setIsPlaying] = React.useState(true);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <PageHeader
        title={
          <div className="flex items-center gap-4">
            <span>Simulation</span>
            <span className="text-sm font-normal text-secondary border-l border-subtle pl-4">
              World: qc_conveyor
            </span>
            <Badge variant="simulating">Simulating</Badge>
          </div>
        }
        actions={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-surface p-1 rounded-md border border-subtle">
              <Button
                variant={isPlaying ? "ghost" : "primary"}
                size="sm"
                onClick={() => setIsPlaying(true)}
              >
                <Play className="w-4 h-4 mr-1.5" />
                Play
              </Button>
              <Button
                variant={!isPlaying ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setIsPlaying(false)}
              >
                <Pause className="w-4 h-4 mr-1.5" />
                Pause
              </Button>
              <Button variant="ghost" size="sm">
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Reset
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-secondary">Speed:</span>
              <Select defaultValue="1x" className="w-[80px] h-8 text-sm">
                <option value="0.5x">0.5x</option>
                <option value="1x">1x</option>
                <option value="2x">2x</option>
                <option value="5x">5x</option>
              </Select>
            </div>
          </div>
        }
      />

      <div className="flex flex-1 gap-4 min-h-0 mb-4">
        {/* Gazebo Viewport */}
        <div className="flex-1 rounded-lg border border-subtle bg-black overflow-hidden relative flex flex-col items-center justify-center">
          {/* Placeholder for iframe / WebGL canvas */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
          <Globe className="w-16 h-16 text-subtle mb-4 opacity-50" />
          <span className="text-secondary font-mono text-sm opacity-50">
            [Gazebo WebClient Embedded Here]
          </span>
        </div>

        {/* Right Panel: RViz2 Topics & TF Tree */}
        <div className="w-[320px] flex flex-col gap-4 min-h-0">
          <Card className="flex-1 flex flex-col min-h-0">
            <div className="p-4 border-b border-subtle font-medium">RViz2 Topics</div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 font-mono text-[13px]">
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-accent mt-1 shrink-0" />
                <span className="text-primary break-all">/camera/color/image_raw</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-accent mt-1 shrink-0" />
                <span className="text-primary break-all">/camera/depth/image_rect_raw</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-accent mt-1 shrink-0" />
                <span className="text-primary">/tf</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-accent mt-1 shrink-0" />
                <span className="text-primary">/joint_states</span>
              </div>
            </div>
          </Card>

          <Card className="flex-1 flex flex-col min-h-0">
            <div className="p-4 border-b border-subtle font-medium">TF Tree</div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-[13px] text-primary whitespace-pre">
              {`world
 └─ base_link
    ├─ arm_base
    │  └─ link_1
    │     └─ link_2
    └─ camera_link
       ├─ color_frame
       └─ depth_frame`}
            </div>
          </Card>
        </div>
      </div>

      {/* Footer Status Bar */}
      <div className="h-14 shrink-0 rounded-lg border border-subtle bg-surface flex items-center justify-between px-6">
        <div className="flex items-center gap-8 font-mono text-sm">
          <div className="flex items-center gap-2">
            <span className="text-secondary">Sim time:</span>
            <span className="text-primary">00:02:34</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-secondary">RTF:</span>
            <span className="text-primary">0.98</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-secondary">Objects:</span>
            <span className="text-primary">12</span>
          </div>
        </div>
        
        <Button variant="primary">
          Deploy to Real Hardware
          <Rocket className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
