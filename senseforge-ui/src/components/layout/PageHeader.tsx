import * as React from "react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({ title, actions, className, ...props }: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between h-12 mb-6", className)} {...props}>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
