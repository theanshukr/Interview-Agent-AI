import React from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";

// Deterministic initials avatar with a soft tinted background.
// Adapts to the active theme (Linear/Vercel style).
export default function Avatar({ name, size = 40, className, ring = true }) {
  const { isDark } = useTheme();

  const initials = React.useMemo(() => {
    if (!name) return "?";
    const parts = String(name).trim().split(/\s+/);
    const letters = parts.map((p) => p[0]).slice(0, 2);
    return letters.join("").toUpperCase();
  }, [name]);

  const hue = React.useMemo(() => {
    if (!name) return 221;
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
    return h;
  }, [name]);

  const fontSize = Math.max(11, Math.round(size * 0.4));

  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full font-semibold select-none",
        ring && (isDark ? "ring-1 ring-white/10" : "ring-1 ring-black/5"),
        className
      )}
      style={{
        width: size,
        height: size,
        fontSize,
        background: isDark ? `hsl(${hue} 42% 22%)` : `hsl(${hue} 65% 94%)`,
        color: isDark ? `hsl(${hue} 55% 82%)` : `hsl(${hue} 45% 38%)`,
      }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
