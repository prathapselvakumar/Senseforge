"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ToggleProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(
  ({ className, checked, onChange, ...props }, ref) => {
    return (
      <label className={cn("relative inline-flex items-center cursor-pointer", className)}>
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={onChange}
          ref={ref}
          {...props}
        />
        <div className="w-8 h-[18px] bg-overlay rounded-full peer peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-checked:after:translate-x-3.5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-accent"></div>
      </label>
    );
  }
);
Toggle.displayName = "Toggle";

export { Toggle };
