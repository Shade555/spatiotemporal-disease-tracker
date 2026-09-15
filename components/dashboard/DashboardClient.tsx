"use client";

import { useEffect, useState } from "react";
import { initialDiseases, type DailyMetric, type Disease } from "@/lib/types";
import { TelemetryStream } from "@/components/ui/TelemetryStream";

type Article = {
  id: string;
  title: string;
  url: string;
  published_at: string;
  source_domain: string | null;
  snippet: string | null;
  extracted_entities?: Array<{ normalized_value: string; entity_type: string }>;
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

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ from: dateDaysAgo(6), to: dateDaysAgo(0) });

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
      } catch (error) {
        if ((error as Error).name !== "AbortError") setState("error");
      }
    }

    void loadDashboard();
    return () => controller.abort();
  }, []);

  const availableDiseases = [...new Set([...initialDiseases, ...allMetrics.map((metric) => metric.disease)])];
  const diseases: Array<"All" | Disease> = ["All", ...availableDiseases];
  const metrics = disease === "All" ? allMetrics : allMetrics.filter((metric) => metric.disease === disease);
  const articleCount = metrics.reduce((total, metric) => total + metric.articleCount, 0);
  const activeSignals = metrics.filter((metric) => metric.isAnomaly).length;
  const sourceCount = metrics.reduce((total, metric) => total + metric.uniqueSourceCount, 0);
  const maxArticleCount = Math.max(...metrics.map((metric) => metric.articleCount), 1);

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

      {state === "loading" && <div className="pixel-window bg-[#050807] p-6 text-xl text-[#f97316]">&gt; CONNECTING TO SURVEILLANCE DATA<span className="terminal-cursor" /></div>}
      {state === "error" && <div className="pixel-window border-[#f97316] bg-[#050807] p-6 text-xl text-[#f97316]">&gt; DATA LINK UNAVAILABLE // CHECK SUPABASE CONFIGURATION</div>}

      {state === "ready" && (
        <>
          <section className="grid gap-5 md:grid-cols-3">
            <MetricCard label="ARTICLES / 7D" value={String(articleCount)} note="News mentions" color="text-[#22c55e]" />
            <MetricCard label="ACTIVE SIGNALS" value={String(activeSignals).padStart(2, "0")} note="Research indicators" color="text-[#f97316]" />
            <MetricCard label="SOURCE NODES" value={String(sourceCount)} note="Mumbai region" color="text-[#a855f7]" />
          </section>

          <section className="mt-7 grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
            <article className="pixel-window bg-[#050807] p-5">
              <div className="mb-6 flex items-center justify-between border-b-2 border-[#22c55e] pb-3">
                <h2 className="font-(family-name:--font-pixel-display) text-[0.65rem] text-[#22c55e]">SIGNAL VOLUME / 07 DAY WINDOW</h2>
                <span className="text-xl text-[#f97316]">● LIVE</span>
              </div>
              {metrics.length === 0 ? <EmptyState label="NO METRICS IN SELECTED WINDOW" /> : <div className="flex h-64 items-end gap-2 border-b-2 border-l-2 border-[#536274] p-4">
                {metrics.map((metric, index) => (
                  <div className="group flex h-full flex-1 items-end" key={`${metric.metricDate}-${metric.disease}`} title={`${metric.metricDate}: ${metric.articleCount} articles`}>
                    <div className={`segmented-meter-bar w-full ${metric.isAnomaly ? "bg-[#f97316]" : "bg-[#22c55e]"} group-hover:bg-[#a855f7]`} style={{ height: `${Math.max((metric.articleCount / maxArticleCount) * 100, 4)}%`, animationDelay: `${index * 70}ms` }} />
                  </div>
                ))}
              </div>}
              <div className="mt-4 flex justify-between text-lg text-[#8da395]"><span>{metrics[0]?.metricDate ?? "-- SEP"}</span><span>{metrics.at(-1)?.metricDate ?? "-- SEP"}</span></div>
            </article>

            <article className="pixel-window bg-[#172235] p-5">
              <h2 className="mb-5 border-b-2 border-[#a855f7] pb-3 font-(family-name:--font-pixel-display) text-[0.65rem] text-[#a855f7]">TELEMETRY OUTPUT</h2>
              <TelemetryStream />
            </article>
          </section>

          <section className="mt-7 grid gap-5 md:grid-cols-2">
            <article className="pixel-window focus-window bg-[#172235] p-5" tabIndex={0}>
              <h2 className="mb-5 font-(family-name:--font-pixel-display) text-[0.65rem] text-[#f97316]">ARTICLE EVIDENCE</h2>
              {articles.length === 0 ? <EmptyState label="NO ARTICLES RETURNED" /> : <div className="space-y-4 text-xl">{articles.map((article) => <a className="block border-l-4 border-[#f97316] pl-4 hover:text-[#f97316]" href={article.url} key={article.id} rel="noreferrer" target="_blank"><b>{article.title}</b><br /><span className="text-[#8da395]">{article.source_domain ?? "unknown source"} {"//"} {new Date(article.published_at).toLocaleDateString("en-IN")}</span></a>)}</div>}
            </article>
            <article className="pixel-window focus-window bg-[#172235] p-5" tabIndex={0}>
              <h2 className="mb-5 font-(family-name:--font-pixel-display) text-[0.65rem] text-[#22c55e]">REGION MAP // MUMBAI</h2>
              <div className="flex min-h-28 items-center justify-center border-2 border-dashed border-[#536274] text-center text-xl text-[#8da395]">MAP MODULE STANDBY<br />Awaiting coordinate feed</div>
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
