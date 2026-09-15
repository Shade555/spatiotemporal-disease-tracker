import { z } from "zod";
import { location, type Disease, type EntityType } from "@/lib/types";

export const gdeltResponseSchema = z.object({
  articles: z.array(z.record(z.string(), z.unknown())).default([]),
}).passthrough();

export const metricQuerySchema = z.object({
  disease: z.string().trim().min(1).optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  location: z.literal(location).default(location),
});

export const articleQuerySchema = metricQuerySchema.extend({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ExtractedEntity = {
  disease: Disease;
  entityType: EntityType;
  normalizedValue: string;
  sourceText: string;
  confidence: number;
};

const symptomRules = [
  "high fever",
  "fever",
  "headache",
  "muscle pain",
  "joint pain",
  "rash",
  "nausea",
  "vomiting",
  "chills",
  "fatigue",
] as const;

export function extractEntities(title: string, snippet: string | null, configuredDiseases: readonly string[]): ExtractedEntity[] {
  const sourceText = `${title} ${snippet ?? ""}`.replace(/\s+/g, " ").trim();
  const normalizedText = sourceText.toLowerCase();
  const entities: ExtractedEntity[] = [];

  for (const disease of configuredDiseases) {
    if (normalizedText.includes(disease.toLowerCase())) {
      entities.push({ disease, entityType: "epidemiological_term", normalizedValue: disease, sourceText, confidence: 1 });
      for (const symptom of symptomRules) {
        if (normalizedText.includes(symptom)) {
          entities.push({ disease, entityType: "symptom", normalizedValue: symptom, sourceText, confidence: 1 });
        }
      }
    }
  }

  if (normalizedText.includes(location.toLowerCase())) {
    for (const disease of configuredDiseases) {
      entities.push({ disease, entityType: "location", normalizedValue: location, sourceText, confidence: 1 });
    }
  }

  return entities.filter((entity, index, all) => all.findIndex((candidate) => candidate.disease === entity.disease && candidate.entityType === entity.entityType && candidate.normalizedValue === entity.normalizedValue) === index);
}
