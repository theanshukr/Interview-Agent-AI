import React from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";

export default function RadarScore({ scores = {}, height = 260 }) {
  const entries = Object.entries(scores || {});
  const data = entries.length
    ? entries.map(([key, val]) => ({
        metric: key.replace(/([A-Z])/g, " $1").trim(),
        value: Number(val) || 0,
      }))
    : [
        { metric: "Problem Solving", value: 80 },
        { metric: "Communication", value: 75 },
        { metric: "Systems Thinking", value: 85 },
        { metric: "Delivery", value: 70 },
        { metric: "Learning Agility", value: 90 },
      ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="70%">
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis
          dataKey="metric"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 500 }}
        />
        <Radar
          dataKey="value"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.25}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}