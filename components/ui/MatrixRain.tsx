"use client";

const streams = Array.from({ length: 22 }, (_, index) => ({
  content: Array.from({ length: 8 }, (_, bit) => ((index * 17 + bit * 7) % 2 ? "1" : "0")).join(" "),
  left: `${(index * 37) % 100}%`,
  delay: `${-((index * 1.7) % 12)}s`,
  duration: `${9 + (index % 6)}s`,
}));

export function MatrixRain() {
  return (
    <div className="matrix-rain" aria-hidden="true">
      {streams.map((stream, index) => (
        <span
          className="matrix-stream"
          key={`${stream.left}-${index}`}
          style={{ left: stream.left, animationDelay: stream.delay, animationDuration: stream.duration }}
        >
          {stream.content}
        </span>
      ))}
    </div>
  );
}
