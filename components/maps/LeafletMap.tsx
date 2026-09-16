"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapPoint = {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  disease: string;
};

export default function LeafletMap({ points = [] }: { points?: MapPoint[] }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<Map<string, L.CircleMarker>>(new Map());

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    if (!map.current) {
      map.current = L.map(mapContainer.current).setView([19.076, 72.8776], 11);

      // Use a dark tile layer compatible with the theme
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map.current);
    }

    // Clear old markers
    markers.current.forEach((marker) => marker.remove());
    markers.current.clear();

    // Add new markers with theme colors
    points.forEach((point) => {
      const color =
        point.disease === "Dengue"
          ? "#f97316"
          : point.disease === "Malaria"
            ? "#a855f7"
            : "#22c55e";
      const marker = L.circleMarker([point.latitude, point.longitude], {
        radius: 8,
        fillColor: color,
        color: color,
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.6,
      })
        .bindPopup(
          `<div style="color: #d2e7d8; background: #050807; padding: 4px; border: 1px solid ${color}; font-family: monospace; font-size: 12px;"><b>${point.disease}</b><br/>${point.label}</div>`,
        )
        .addTo(map.current!);

      markers.current.set(point.id, marker);
    });
  }, [points]);

  return (
    <div className="relative min-h-56 overflow-hidden border-2 border-[#536274] bg-[#07121a] p-2">
      <div ref={mapContainer} className="h-96 w-full rounded-sm" />
      {points.length === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-center text-xl text-[#8da395]">
          MAP MODULE STANDBY<br />No validated locality coordinates in current articles
        </div>
      )}
    </div>
  );
}
