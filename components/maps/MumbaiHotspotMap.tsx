"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

export type MapPoint = {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  disease: string;
};

// Dynamically import Leaflet map only on client side
const LeafletMapComponent = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="h-56 w-full rounded-sm border-2 border-[#536274] bg-[#07121a] flex items-center justify-center text-[#8da395]">
      Loading map...
    </div>
  ),
});

export function MumbaiHotspotMap({ points = [] }: { points?: MapPoint[] }) {
  return (
    <Suspense fallback={<div className="h-56 bg-[#07121a]">Loading...</div>}>
      <LeafletMapComponent points={points} />
    </Suspense>
  );
}
