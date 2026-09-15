"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyMetric } from "@/lib/types";

export function SignalChart({ metrics }: { metrics: DailyMetric[] }) {
  const chartData = metrics.map((metric) => ({
    date: metric.metricDate.slice(5),
    articles: metric.articleCount,
    baseline: metric.rollingMean ?? undefined,
    disease: metric.disease,
  }));

  return (
    <div className="h-64 w-full" aria-label="News signal volume chart" role="img">
      <ResponsiveContainer height="100%" width="100%">
        <LineChart data={chartData} margin={{ top: 12, right: 8, bottom: 4, left: -24 }}>
          <CartesianGrid stroke="#536274" strokeDasharray="2 6" vertical={false} />
          <XAxis axisLine={{ stroke: "#536274" }} dataKey="date" tick={{ fill: "#8da395", fontFamily: "var(--font-terminal)", fontSize: 14 }} tickLine={false} />
          <YAxis axisLine={{ stroke: "#536274" }} allowDecimals={false} tick={{ fill: "#8da395", fontFamily: "var(--font-terminal)", fontSize: 14 }} tickLine={false} />
          <Tooltip contentStyle={{ background: "#050807", border: "2px solid #22c55e", borderRadius: 0, color: "#d2e7d8", fontFamily: "var(--font-terminal)" }} labelStyle={{ color: "#f97316" }} />
          <Line dataKey="articles" dot={{ fill: "#22c55e", r: 4, strokeWidth: 0 }} name="Article volume" stroke="#22c55e" strokeWidth={3} type="stepAfter" />
          <Line dataKey="baseline" dot={false} name="Rolling baseline" stroke="#a855f7" strokeDasharray="4 5" strokeWidth={2} type="stepAfter" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
