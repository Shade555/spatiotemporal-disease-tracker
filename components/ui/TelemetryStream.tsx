"use client";

import { useEffect, useRef, useState } from "react";

type PipelineRun = {
  id: string;
  status: "running" | "succeeded" | "failed";
  started_at: string;
  completed_at: string | null;
  articles_seen: number;
  articles_inserted: number;
  entities_extracted: number;
  error_message: string | null;
};

export function TelemetryStream() {
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchLatestRuns() {
      try {
        const response = await fetch("/api/ingest-status", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to fetch runs");
        const { data } = (await response.json()) as { data: PipelineRun[] };

        const newLogs = data
          .slice(-5)
          .reverse()
          .map((run) => {
            const startTime = new Date(run.started_at).toLocaleTimeString("en-IN", { hour12: false });
            if (run.status === "running") {
              return `[${startTime}] Ingestion started...`;
            } else if (run.status === "succeeded") {
              return `[${startTime}] ✓ Success: ${run.articles_seen} articles, ${run.articles_inserted} new, ${run.entities_extracted} entities`;
            } else {
              return `[${startTime}] ✗ Failed: ${run.error_message ?? "unknown error"}`;
            }
          });

        setLogs(newLogs);
      } catch (e) {
        setLogs(["[--:--:--] Unable to fetch ingestion status"]);
      }
    }

    fetchLatestRuns();
    const interval = window.setInterval(fetchLatestRuns, 10000); // Refresh every 10s
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [logs]);

  return (
    <div className="telemetry-stream" ref={scrollRef} aria-live="polite">
      {logs.length === 0 ? (
        <p className="telemetry-line text-[#8da395]">
          <span className="text-[#22c55e]">&gt;</span> Awaiting pipeline status...
        </p>
      ) : (
        logs.map((line, i) => (
          <p className="telemetry-line" key={i}>
            <span className="text-[#22c55e]">&gt;</span> {line}
          </p>
        ))
      )}
      <p className="telemetry-line text-[#a855f7]">
        <span className="text-[#22c55e]">&gt;</span> monitoring...
        <span className="terminal-cursor" aria-hidden="true" />
      </p>
    </div>
  );
}
