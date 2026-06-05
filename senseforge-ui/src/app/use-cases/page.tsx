"use client";

import * as React from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Search, Package, Map, Bot, Brain, Ruler } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const USE_CASES = [
  {
    id: "qc",
    title: "Quality Control",
    description: "Inspect parts for defects on a conveyor line.",
    icon: Search,
    cameras: ["D405", "D415", "D435i"],
    requiresArm: false,
  },
  {
    id: "detection",
    title: "Object Detection",
    description: "Detect and classify objects in real-time.",
    icon: Package,
    cameras: ["D415", "D435i", "D455", "D555"],
    requiresArm: false,
  },
  {
    id: "slam",
    title: "SLAM / Mapping",
    description: "Generate 3D maps and track camera pose.",
    icon: Map,
    cameras: ["D435i", "D455", "T265"],
    requiresArm: false,
  },
  {
    id: "pick-place",
    title: "Pick & Place",
    description: "Coordinate robot arm to grasp objects.",
    icon: Bot,
    cameras: ["D415", "D435i"],
    requiresArm: true,
  },
  {
    id: "rl-training",
    title: "RL Arm Training",
    description: "Train policies in simulation before deployment.",
    icon: Brain,
    cameras: ["D435i"],
    requiresArm: true,
  },
  {
    id: "measurement",
    title: "Dimension Measurement",
    description: "Measure bounding boxes of physical objects.",
    icon: Ruler,
    cameras: ["D405", "D415"],
    requiresArm: false,
  },
];

export default function UseCasesPage() {
  const router = useRouter();
  const [selectedCamera, setSelectedCamera] = React.useState("Any");
  const [selectedArm, setSelectedArm] = React.useState("Any");

  const filteredCases = USE_CASES.filter((uc) => {
    if (selectedCamera !== "Any" && !uc.cameras.includes(selectedCamera)) return false;
    if (selectedArm === "None" && uc.requiresArm) return false;
    if (selectedArm !== "Any" && selectedArm !== "None" && !uc.requiresArm) return true; // simplified logic
    return true;
  });

  const handleSelect = (id: string) => {
    // Navigate to configuration pre-filled with this use case
    router.push(`/configuration?useCase=${id}`);
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <PageHeader title="Select a use case" />

      <div className="flex items-center gap-4 mb-8 bg-surface p-4 rounded-lg border border-subtle">
        <div className="flex items-center gap-3 flex-1 max-w-[240px]">
          <span className="text-sm font-medium text-secondary whitespace-nowrap">Camera:</span>
          <Select value={selectedCamera} onChange={(e) => setSelectedCamera(e.target.value)}>
            <option value="Any">Any Camera</option>
            <option value="D405">D405</option>
            <option value="D415">D415</option>
            <option value="D435i">D435i</option>
            <option value="D455">D455</option>
            <option value="T265">T265</option>
          </Select>
        </div>
        <div className="flex items-center gap-3 flex-1 max-w-[240px]">
          <span className="text-sm font-medium text-secondary whitespace-nowrap">Arm:</span>
          <Select value={selectedArm} onChange={(e) => setSelectedArm(e.target.value)}>
            <option value="Any">Any Arm</option>
            <option value="None">None</option>
            <option value="UR5e">UR5e</option>
            <option value="Franka">Franka Emika</option>
          </Select>
        </div>
        <Button variant="ghost" onClick={() => { setSelectedCamera("Any"); setSelectedArm("Any"); }}>
          Clear Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {USE_CASES.map((uc) => {
          const isCompatible = filteredCases.includes(uc);
          
          return (
            <Card
              key={uc.id}
              onClick={() => isCompatible && handleSelect(uc.id)}
              className={cn(
                "h-[180px] w-full max-w-[320px] relative cursor-pointer group flex flex-col",
                isCompatible ? "hover:scale-[1.02] hover:bg-elevated hover:border-default transition-all" : "opacity-40 cursor-not-allowed"
              )}
            >
              <div className="mb-3">
                <uc.icon className={cn("w-8 h-8", isCompatible ? "text-accent" : "text-secondary")} />
              </div>
              <h3 className="text-sm font-semibold mb-1">{uc.title}</h3>
              <p className="text-[13px] text-secondary leading-relaxed line-clamp-2">
                {uc.description}
              </p>

              <div className="mt-auto pt-4 flex flex-wrap gap-2">
                {uc.requiresArm ? (
                  <Badge variant="simulating" className="text-[10px]">Requires Arm</Badge>
                ) : (
                  <div className="flex gap-1 flex-wrap">
                    {uc.cameras.slice(0, 3).map(cam => (
                      <span key={cam} className="text-[11px] font-medium text-tertiary bg-base px-1.5 py-0.5 rounded border border-subtle">
                        {cam}
                      </span>
                    ))}
                    {uc.cameras.length > 3 && <span className="text-[11px] text-tertiary">+{uc.cameras.length - 3}</span>}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
