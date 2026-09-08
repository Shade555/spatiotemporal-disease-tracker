"use client";

import { useEffect, useRef, useState } from "react";

const sourceLines = [
  "[08:42:11] GDELT feed synchronized",
  "[08:42:13] 128 article records indexed",
  "[08:42:14] Dengue volume crossed baseline",
  "[08:42:14] Signal confidence: MODERATE",
  "[08:42:15] Awaiting analyst review...",
];

export function TelemetryStream() {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setVisibleLines((lines) => {
        if (lines.length >= sourceLines.length) {
          return [];
        }
        return [...lines, sourceLines[lines.length]];
      });
    }, 850);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [visibleLines]);

  return (
    <div className="telemetry-stream" ref={scrollRef} aria-live="polite">
      {visibleLines.map((line) => (
        <p className="telemetry-line" key={line}>
          <span className="text-[#22c55e]">&gt;</span> {line}
        </p>
      ))}
      <p className="telemetry-line text-[#a855f7]">
        <span className="text-[#22c55e]">&gt;</span> {visibleLines.length < sourceLines.length ? "processing packet..." : "awaiting next packet"}<span className="terminal-cursor" aria-hidden="true" />
      </p>
    </div>
  );
}
