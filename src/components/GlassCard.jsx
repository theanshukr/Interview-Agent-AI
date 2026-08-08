import React from "react";
import { cn } from "@/lib/utils";

export default function GlassCard({ className, children, strong = false, ...props }) {
  return (
    <div
      className={cn(
        strong ? "glass-strong" : "glass",
        "rounded-3xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}