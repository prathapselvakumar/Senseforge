import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "connected" | "disconnected" | "simulating" | "training" | "ready" | "error";
  children: React.ReactNode;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "ready", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center h-[22px] px-2 rounded-full text-[11px] font-medium uppercase tracking-wider",
          {
            "bg-green-muted text-text-primary": variant === "connected",
            "bg-red-muted text-text-primary": variant === "disconnected" || variant === "error",
            "bg-amber-muted text-text-primary": variant === "simulating",
            "bg-purple-muted text-text-primary": variant === "training",
            "bg-accent-muted text-text-primary": variant === "ready",
          },
          className
        )}
        {...props}
      >
        <span
          className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", {
            "bg-green": variant === "connected",
            "bg-red": variant === "disconnected" || variant === "error",
            "bg-amber animate-pulse": variant === "simulating",
            "bg-purple animate-pulse": variant === "training",
            "bg-accent": variant === "ready",
          })}
        />
        {children}
      </div>
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
