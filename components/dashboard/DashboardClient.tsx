"use client";

import { useEffect, useState } from "react";
import { initialDiseases, type DailyMetric, type Disease } from "@/lib/types";
import { TelemetryStream } from "@/components/ui/TelemetryStream";
import { SignalChart, type ChartMode } from "@/components/charts/SignalChart";
import { MumbaiHotspotMap } from "@/components/maps/MumbaiHotspotMap";

type Article = {
  id: string;
  title: string;
  url: string;
  published_at: string;
  source_domain: string | null;
  snippet: string | null;
  extracted_entities?: Array<{ normalized_value: string; entity_type: string }>;
  latitude: number | null;
  longitude: number | null;
  locality: string | null;
};

type ApiState = "loading" | "ready" | "error";

function dateDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export function DashboardClient() {
  const [disease, setDisease] = useState<"All" | Disease>("All");
  const [allMetrics, setAllMetrics] = useState<DailyMetric[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [state, setState] = useState<ApiState>("loading");
  const [days, setDays] = useState(7);
  const [chartMode, setChartMode] = useState<ChartMode>("line");
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ from: dateDaysAgo(days - 1), to: dateDaysAgo(0) });

    async function loadDashboard() {
      setState("loading");
      try {
        const [metricsResponse, articlesResponse] = await Promise.all([
          fetch(`/api/metrics?${params}`, { signal: controller.signal }),
          fetch(`/api/articles?page=1&pageSize=5`, { signal: controller.signal }),
        ]);
        if (!metricsResponse.ok || !articlesResponse.ok) throw new Error("Dashboard data unavailable");
        const metricsPayload = await metricsResponse.json() as { data: DailyMetric[] };
        const articlesPayload = await articlesResponse.json() as { data: Article[] };
        setAllMetrics(metricsPayload.data);
        setArticles(articlesPayload.data);
        setState("ready");
        setLastRefresh(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
      } catch (error) {
        if ((error as Error).name !== "AbortError") setState("error");
      }
    }

    void loadDashboard();
    return () => controller.abort();
  }, [days, reloadToken]);

  const availableDiseases = [...new Set([...initialDiseases, ...allMetrics.map((metric) => metric.disease)])];
  const diseases: Array<"All" | Disease> = ["All", ...availableDiseases];
  const metrics = disease === "All" ? allMetrics : allMetrics.filter((metric) => metric.disease === disease);
  const articleCount = metrics.reduce((total, metric) => total + metric.articleCount, 0);
  const activeSignals = metrics.filter((metric) => metric.isAnomaly).length;
  const sourceCount = metrics.reduce((total, metric) => total + metric.uniqueSourceCount, 0);
  const alerts = metrics.filter((metric) => metric.isAnomaly).sort((left, right) => right.metricDate.localeCompare(left.metricDate));
  const mapPoints = articles.flatMap((article) => article.latitude !== null && article.longitude !== null ? [{ id: article.id, latitude: article.latitude, longitude: article.longitude, label: article.locality ?? "Mumbai", disease: article.extracted_entities?.find((entity) => entity.entity_type === "epidemiological_term")?.normalized_value ?? "signal" }] : []);

  return (
    <>
      <section className="mb-6 flex flex-wrap items-center gap-3 border-2 border-[#536274] bg-[#050807] p-3">
        <span className="font-(family-name:--font-pixel-display) text-[0.55rem] text-[#8da395]">FILTER SIGNALS:</span>
        {diseases.map((option) => (
          <button className={`pixel-button px-3 py-2 ${disease === option ? "bg-[#22c55e] text-[#050807]" : "text-[#22c55e]"}`} key={option} onClick={() => setDisease(option)} type="button">
            {option}
          </button>
        ))}
      </section>

      <section className="mb-6 flex flex-wrap items-center gap-3 text-lg text-[#8da395]">
        <span className="font-(family-name:--font-pixel-display) text-[0.55rem]">WINDOW:</span>
        {[7, 14, 30].map((option) => <button className={`pixel-button px-3 py-2 ${days === option ? "bg-[#a855f7] text-[#050807]" : "text-[#a855f7]"}`} key={option} onClick={() => setDays(option)} type="button">{option}D</button>)}
        <span className="ml-auto">SYNC: {lastRefresh ?? "--:--"}</span>
        <button className="pixel-button px-3 py-2 text-[#f97316]" onClick={() => setReloadToken((token) => token + 1)} type="button">[ REFRESH ]</button>
      </section>

      {state === "loading" && <div className="pixel-window bg-[#050807] p-6 text-xl text-[#f97316]">&gt; CONNECTING TO SURVEILLANCE DATA<span className="terminal-cursor" /></div>}
      {state === "error" && <div className="pixel-window border-[#f97316] bg-[#050807] p-6 text-xl text-[#f97316]">&gt; DATA LINK UNAVAILABLE // CHECK SUPABASE CONFIGURATION</div>}

      {state === "ready" && (
        <>
          <section className="grid gap-5 md:grid-cols-3">
            <MetricCard label={`ARTICLES / ${days}D`} value={String(articleCount)} note="News mentions" color="text-[#22c55e]" />
            <MetricCard label="ACTIVE SIGNALS" value={String(activeSignals).padStart(2, "0")} note="Research indicators" color="text-[#f97316]" />
            <MetricCard label="SOURCE NODES" value={String(sourceCount)} note="Mumbai region" color="text-[#a855f7]" />
          </section>

          <section className="mt-7 grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
            <article className="pixel-window bg-[#050807] p-5">
              <div className="mb-6 flex items-center justify-between border-b-2 border-[#22c55e] pb-3">
                <h2 className="font-(family-name:--font-pixel-display) text-[0.65rem] text-[#22c55e]">SIGNAL VOLUME / 07 DAY WINDOW</h2>
                <div className="flex items-center gap-2"><div className="chart-mode-group" aria-label="Chart mode" role="group">{(["line", "bar", "area"] as ChartMode[]).map((mode) => <button aria-pressed={chartMode === mode} className={`chart-mode-button ${chartMode === mode ? "chart-mode-active" : ""}`} key={mode} onClick={() => setChartMode(mode)} type="button">{mode.toUpperCase()}</button>)}</div><span className="text-xl text-[#f97316]">● LIVE</span></div>
              </div>
              {metrics.length === 0 ? <EmptyState label="NO METRICS IN SELECTED WINDOW" /> : <SignalChart metrics={metrics} mode={chartMode} />}
              <div className="mt-4 flex justify-between text-lg text-[#8da395]"><span>{metrics[0]?.metricDate ?? "-- SEP"}</span><span>{metrics.at(-1)?.metricDate ?? "-- SEP"}</span></div>
            </article>

            <article className="pixel-window bg-[#172235] p-5">
              <h2 className="mb-5 border-b-2 border-[#a855f7] pb-3 font-(family-name:--font-pixel-display) text-[0.65rem] text-[#a855f7]">TELEMETRY OUTPUT</h2>
              <TelemetryStream />
            </article>
          </section>

          <section className="mt-7 grid gap-5 md:grid-cols-2">
            <article className="pixel-window focus-window bg-[#172235] p-5" tabIndex={0}>
              <h2 className="mb-5 font-(family-name:--font-pixel-display) text-[0.65rem] text-[#f97316]">ALERT QUEUE</h2>
              {alerts.length === 0 ? <EmptyState label="NO UNUSUAL NEWS SIGNALS" /> : <div className="space-y-4 text-xl">{alerts.map((alert) => <div className="border-l-4 border-[#f97316] pl-4" key={`${alert.metricDate}-${alert.disease}`}><b className="text-[#f97316]">{alert.disease.toUpperCase()}</b> {"// unusual article volume on "}{alert.metricDate}<br /><span className="text-[#8da395]">score {alert.anomalyScore?.toFixed(2)} {"// news signal only"}</span></div>)}</div>}
            </article>
            <article className="pixel-window focus-window bg-[#172235] p-5" tabIndex={0}>
              <h2 className="mb-5 font-(family-name:--font-pixel-display) text-[0.65rem] text-[#f97316]">ARTICLE EVIDENCE</h2>
              {articles.length === 0 ? <EmptyState label="NO ARTICLES RETURNED" /> : <div className="space-y-4 text-xl">{articles.map((article) => <a className="block border-l-4 border-[#f97316] pl-4 hover:text-[#f97316]" href={article.url} key={article.id} rel="noreferrer" target="_blank"><b>{article.title}</b><br /><span className="text-[#8da395]">{article.source_domain ?? "unknown source"} {"//"} {new Date(article.published_at).toLocaleDateString("en-IN")}</span></a>)}</div>}
            </article>
            <article className="pixel-window focus-window bg-[#172235] p-5" tabIndex={0}>
              <h2 className="mb-5 font-(family-name:--font-pixel-display) text-[0.65rem] text-[#22c55e]">REGION MAP // MUMBAI</h2>
              <MumbaiHotspotMap points={mapPoints} />
            </article>
          </section>
        </>
      )}
    </>
  );
}

function MetricCard({ label, value, note, color }: { label: string; value: string; note: string; color: string }) {
  return <article className="pixel-window focus-window bg-[#172235] p-5" tabIndex={0}><p className="font-(family-name:--font-pixel-display) text-[0.55rem] text-[#8da395]">{label}</p><p className={`mt-4 font-(family-name:--font-pixel-display) text-3xl ${color}`}>{value}</p><p className="mt-3 text-xl text-[#d2e7d8]">{note}</p></article>;
}

function EmptyState({ label }: { label: string }) {
  return <div className="flex min-h-28 items-center justify-center border-2 border-dashed border-[#536274] text-center text-xl text-[#8da395]">{label}</div>;
}
