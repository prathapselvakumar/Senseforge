"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Grid3X3,
  SlidersHorizontal,
  Box,
  Camera,
  FolderCode,
  BrainCircuit,
  Terminal,
  Settings,
  Wifi,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/use-cases", label: "Use Cases", icon: Grid3X3 },
  { href: "/configuration", label: "Configuration", icon: SlidersHorizontal },
  { href: "/simulation", label: "Simulation", icon: Box, dot: "amber" },
  { href: "/live-view", label: "Live View", icon: Camera, dot: "green" },
  { href: "/workspace", label: "Workspace", icon: FolderCode },
  { href: "/training", label: "Training", icon: BrainCircuit, dot: "purple" },
  { href: "/logs", label: "Logs", icon: Terminal },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] shrink-0 border-r border-subtle bg-base flex flex-col h-full">
      {/* Logo Area */}
      <div className="h-12 flex items-center px-4 border-b border-subtle shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full border-2 border-accent flex items-center justify-center relative">
            <div className="w-2 h-2 rounded-full bg-accent" />
          </div>
          <span className="font-display font-medium text-lg tracking-wide">
            SenseForge
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 h-10 text-sm transition-colors border-l-2",
                isActive
                  ? "border-accent bg-elevated text-primary font-medium"
                  : "border-transparent text-secondary hover:bg-elevated hover:text-primary"
              )}
            >
              <item.icon className="w-[18px] h-[18px]" />
              <span className="flex-1">{item.label}</span>
              {item.dot && (
                <span
                  className={cn("w-1.5 h-1.5 rounded-full", {
                    "bg-amber animate-pulse": item.dot === "amber",
                    "bg-green": item.dot === "green",
                    "bg-purple animate-pulse": item.dot === "purple",
                  })}
                />
              )}
            </Link>
          );
        })}

        <div className="my-2 border-t border-subtle mx-4" />

        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-4 h-10 text-sm transition-colors border-l-2",
            pathname === "/settings"
              ? "border-accent bg-elevated text-primary font-medium"
              : "border-transparent text-secondary hover:bg-elevated hover:text-primary"
          )}
        >
          <Settings className="w-[18px] h-[18px]" />
          <span>Settings</span>
        </Link>
      </nav>

      {/* Status Footer */}
      <div className="p-4 border-t border-subtle bg-surface shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-secondary">System</span>
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green" />
            <span className="w-1.5 h-1.5 rounded-full bg-green" />
          </div>
        </div>
        <Badge variant="connected" className="w-full justify-center">
          <Wifi className="w-3 h-3 mr-1.5" />
          D435i Ready
        </Badge>
      </div>
    </aside>
  );
}
