import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "icon";
  size?: "sm" | "md" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-accent text-white hover:bg-accent-hover": variant === "primary",
            "bg-elevated border border-default text-primary hover:border-strong": variant === "secondary",
            "bg-transparent text-secondary hover:bg-elevated": variant === "ghost",
            "bg-red-muted border border-red text-red": variant === "danger",
            "bg-transparent hover:bg-elevated": variant === "icon",
            "h-7 px-3 text-[13px]": size === "sm",
            "h-9 px-4 py-2 text-[14px]": size === "md",
            "h-11 px-5 py-2.5 text-[15px]": size === "lg",
            "h-8 w-8": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
