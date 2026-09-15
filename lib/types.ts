export const initialDiseases = ["Dengue", "Malaria"] as const;
export type Disease = string;

export const location = "Mumbai" as const;
export type EntityType = "symptom" | "location" | "epidemiological_term";

export type DailyMetric = {
  metricDate: string;
  location: typeof location;
  disease: Disease;
  articleCount: number;
  symptomCount: number;
  uniqueSourceCount: number;
  rollingMean: number | null;
  rollingStddev: number | null;
  anomalyScore: number | null;
  isAnomaly: boolean;
  forecastValue: number | null;
};

export type NormalizedArticle = {
  url: string;
  title: string;
  snippet: string | null;
  sourceDomain: string | null;
  sourceCountry: string | null;
  language: string | null;
  publishedAt: string;
  query: string;
  location: typeof location;
  rawPayload: Record<string, unknown>;
};
