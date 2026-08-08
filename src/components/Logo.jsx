import React from "react";
import { cn } from "@/lib/utils";

// Monochrome "IA" monogram — a vertical I bar whose base merges with the left
// leg of an A. Designed to work as an app icon (tile variant) and inline mark.
export default function Logo({ size = 32, tile = false, className }) {
  const glyph = (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      style={{ width: size, height: size, display: "block" }}
      aria-label="Interview Agent"
      role="img"
    >
      {/* I — solid bar */}
      <rect x="6.4" y="6" width="2.5" height="20" rx="1.25" fill="currentColor" />
      {/* A — three strokes; left leg meets the I bar at the baseline */}
      <path
        d="M14.2 6 L9 26 M14.2 6 L22.4 26 M11 17.4 L18.6 17.4"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (tile) {
    return (
      <span
        className={cn(
          "inline-grid place-items-center rounded-[10px] bg-foreground text-background shadow-sm",
          className
        )}
        style={{ width: size, height: size }}
      >
        <span style={{ transform: "scale(0.78)" }}>{glyph}</span>
      </span>
    );
  }
  return <span className={cn("inline-block text-foreground", className)}>{glyph}</span>;
}