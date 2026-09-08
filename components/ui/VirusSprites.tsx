"use client";

import { useEffect, useState } from "react";

const virusFrames = ["red", "blue", "yellow"] as const;
type VirusName = (typeof virusFrames)[number];

export function VirusSprites() {
  const [hitVirus, setHitVirus] = useState<VirusName | null>(null);

  useEffect(() => {
    if (!hitVirus) return;
    const resetTimer = window.setTimeout(() => setHitVirus(null), 980);
    return () => window.clearTimeout(resetTimer);
  }, [hitVirus]);

  return (
    <div className="virus-sprites">
      {virusFrames.map((virus) => (
        <button
          aria-label={`Hit ${virus} virus`}
          className={`virus-sprite virus-sprite-${virus} ${hitVirus === virus ? "virus-sprite-hit" : ""}`}
          key={virus}
          onClick={() => setHitVirus(virus)}
          type="button"
        />
      ))}
    </div>
  );
}
