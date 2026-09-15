const mumbaiLocalities = [
  { name: "Andheri", latitude: 19.1197, longitude: 72.8468 },
  { name: "Bandra", latitude: 19.0607, longitude: 72.8362 },
  { name: "Borivali", latitude: 19.2307, longitude: 72.8567 },
  { name: "Dadar", latitude: 19.0178, longitude: 72.8478 },
  { name: "Kurla", latitude: 19.0726, longitude: 72.8794 },
  { name: "Malad", latitude: 19.1874, longitude: 72.8484 },
  { name: "Mumbai", latitude: 18.9766, longitude: 72.8147 },
  { name: "Powai", latitude: 19.1176, longitude: 72.9060 },
  { name: "Thane", latitude: 19.2183, longitude: 72.9781 },
  { name: "Vasai", latitude: 19.3919, longitude: 72.8397 },
] as const;

export type GeoPoint = {
  latitude: number;
  longitude: number;
  label: string;
};

export function findMumbaiLocality(text: string): GeoPoint | null {
  const normalized = text.toLowerCase();
  const locality = mumbaiLocalities.find((candidate) => normalized.includes(candidate.name.toLowerCase()));
  return locality ? { latitude: locality.latitude, longitude: locality.longitude, label: locality.name } : null;
}
