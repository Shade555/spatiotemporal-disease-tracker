"use client";

export type MapPoint = {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  disease: string;
};

export function MumbaiHotspotMap({ points = [] }: { points?: MapPoint[] }) {
  return (
    <div className="relative min-h-56 overflow-hidden border-2 border-[#536274] bg-[#07121a] p-4">
      <div className="map-grid" aria-hidden="true" />
      {points.length === 0 ? (
        <div className="relative z-10 flex min-h-48 items-center justify-center text-center text-xl text-[#8da395]">
          MAP MODULE STANDBY<br />Awaiting validated coordinate feed
        </div>
      ) : (
        <div className="relative z-10 h-48">
          {points.map((point) => (
            <span className="map-point" key={point.id} style={{ left: `${Math.min(Math.max((point.longitude - 72.7) * 100, 4), 94)}%`, top: `${Math.min(Math.max((19.35 - point.latitude) * 100, 4), 94)}%` }} title={`${point.disease}: ${point.label}`} />
          ))}
        </div>
      )}
    </div>
  );
}
