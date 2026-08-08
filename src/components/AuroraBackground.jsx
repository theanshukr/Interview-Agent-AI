import React from "react";

// Animated aurora gradient background + floating orbs. Fixed, sits behind all content.
export default function AuroraBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* base wash */}
      <div className="absolute inset-0 bg-background" />
      {/* aurora blobs */}
      <div
        className="absolute -top-32 -left-24 h-[42rem] w-[42rem] rounded-full blur-3xl float-slow"
        style={{
          background:
            "radial-gradient(circle at center, hsl(250 80% 55% / 0.35), transparent 62%)",
        }}
      />
      <div
        className="absolute top-1/4 -right-32 h-[38rem] w-[38rem] rounded-full blur-3xl float-slow"
        style={{
          animationDelay: "-3s",
          background:
            "radial-gradient(circle at center, hsl(190 90% 50% / 0.28), transparent 62%)",
        }}
      />
      <div
        className="absolute -bottom-40 left-1/3 h-[40rem] w-[40rem] rounded-full blur-3xl float-slow"
        style={{
          animationDelay: "-6s",
          background:
            "radial-gradient(circle at center, hsl(232 90% 60% / 0.30), transparent 62%)",
        }}
      />
      {/* subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(220 30% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(220 30% 100%) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent 75%)",
        }}
      />
    </div>
  );
}