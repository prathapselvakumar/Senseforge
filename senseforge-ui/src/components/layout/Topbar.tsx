"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTheme } from "next-themes";

export function Topbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  // Basic breadcrumb generation based on pathname
  const paths = pathname.split("/").filter(Boolean);
  const title = paths.length > 0 
    ? paths[0].split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : "Dashboard";

  return (
    <header className="h-12 border-b border-subtle bg-base flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center text-sm">
        <span className="text-secondary">SenseForge</span>
        <ChevronRight className="w-4 h-4 mx-2 text-tertiary" />
        <span className="text-primary font-medium">{title}</span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green" />
          <span className="text-xs font-medium text-secondary uppercase tracking-wider">ROS2 Active</span>
        </div>
        <Button 
          variant="icon" 
          size="icon" 
          className="text-secondary" 
          aria-label="Toggle Theme"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {mounted && theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
      </div>
    </header>
  );
}
