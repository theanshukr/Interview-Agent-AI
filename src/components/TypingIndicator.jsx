import React from "react";

export default function TypingIndicator({ label = "Atlas is thinking" }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex gap-1">
        <span className="blink-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" style={{ animationDelay: "0s" }} />
        <span className="blink-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" style={{ animationDelay: "0.18s" }} />
        <span className="blink-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" style={{ animationDelay: "0.36s" }} />
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}