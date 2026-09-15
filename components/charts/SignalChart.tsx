"use client";

import {
  CartesianGrid,
  Area,
  Bar,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyMetric } from "@/lib/types";

export type ChartMode = "line" | "bar" | "area";

export function SignalChart({ metrics, mode }: { metrics: DailyMetric[]; mode: ChartMode }) {
  const chartByDate = metrics.reduce((byDate, metric) => {
    const current = byDate.get(metric.metricDate) ?? { date: metric.metricDate.slice(5), articles: 0, baselineTotal: 0, baselineCount: 0 };
    current.articles += metric.articleCount;
    if (metric.rollingMean !== null) {
      current.baselineTotal += metric.rollingMean;
      current.baselineCount += 1;
    }
    byDate.set(metric.metricDate, current);
    return byDate;
  }, new Map<string, { date: string; articles: number; baselineTotal: number; baselineCount: number }>()).values();
  const chartData = [...chartByDate].map((point) => ({
    date: point.date,
    articles: point.articles,
    baseline: point.baselineCount > 0 ? point.baselineTotal / point.baselineCount : undefined,
  }));

  return (
    <div className="h-64 w-full" aria-label="News signal volume chart" role="img">
      <ResponsiveContainer height="100%" width="100%">
        <ComposedChart data={chartData} margin={{ top: 12, right: 8, bottom: 4, left: -24 }}>
          <CartesianGrid stroke="#536274" strokeDasharray="2 6" vertical={false} />
          <XAxis axisLine={{ stroke: "#536274" }} dataKey="date" tick={{ fill: "#8da395", fontFamily: "var(--font-terminal)", fontSize: 14 }} tickLine={false} />
          <YAxis axisLine={{ stroke: "#536274" }} allowDecimals={false} tick={{ fill: "#8da395", fontFamily: "var(--font-terminal)", fontSize: 14 }} tickLine={false} />
          <Tooltip contentStyle={{ background: "#050807", border: "2px solid #22c55e", borderRadius: 0, color: "#d2e7d8", fontFamily: "var(--font-terminal)" }} labelStyle={{ color: "#f97316" }} />
          {mode === "line" && <Line dataKey="articles" dot={{ fill: "#22c55e", r: 4, strokeWidth: 0 }} name="Article volume" stroke="#22c55e" strokeWidth={3} type="stepAfter" />}
          {mode === "line" && <Line dataKey="baseline" dot={false} name="Rolling baseline" stroke="#a855f7" strokeDasharray="4 5" strokeWidth={2} type="stepAfter" />}
          {mode === "bar" && <Bar dataKey="articles" fill="#22c55e" name="Article volume" />}
          {mode === "area" && <Area dataKey="articles" fill="#22c55e" fillOpacity={0.35} name="Article volume" stroke="#22c55e" type="stepAfter" />}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
