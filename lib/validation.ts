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

  // Dynamically extract any unknown emerging diseases or outbreaks
  const dynamicDiseaseRegex = /\b([a-z0-9-]+\s+(?:virus|fever|disease|syndrome|illness|infection|flu|outbreak))\b/g;
  let match;
  while ((match = dynamicDiseaseRegex.exec(normalizedText)) !== null) {
    const rawDisease = match[1];
    
    // Ignore generic stop words or highly generic matches
    const firstWord = rawDisease.split(" ")[0].toLowerCase();
    const stopWords = ["a", "the", "this", "that", "any", "some", "no", "rare", "new", "unknown", "mystery", "severe", "mild", "deadly", "viral", "bacterial", "infectious", "contagious", "respiratory", "heart", "lung", "kidney", "liver", "blood", "skin", "brain", "mental", "physical", "chronic", "acute", "had", "has", "have", "with", "from", "for", "of", "in", "on", "at", "to", "and", "or", "is", "was", "are", "were", "be", "been", "being", "it", "its", "their", "our", "my", "your", "his", "her", "he", "she", "they", "we", "i", "you", "not", "but", "by", "can", "could", "will", "would", "shall", "should", "may", "might", "must", "do", "does", "did", "as", "if", "then", "than", "so", "because", "while", "when", "where", "why", "how", "all", "every", "each", "both", "few", "many", "much", "more", "most", "other", "another", "such", "only", "just", "even", "also", "very", "too", "quite", "rather", "somewhat", "almost", "well", "good", "bad", "better", "best", "worse", "worst", "common", "frequent", "uncommon", "old", "recent", "past", "current", "future", "known", "fatal", "fungal", "parasitic", "cardiovascular", "sudden", "gradual", "progressive", "stable", "unstable", "battling", "preventing", "treating", "curing", "managing", "controlling", "spreading", "stopping", "causing", "getting", "catching", "having", "developing", "showing", "presenting", "experiencing", "suffering", "surviving", "dying", "killing", "contracted", "caught", "got", "developing", "developed", "diagnosed", "diagnosing", "treated", "treating", "curing", "cured", "survived", "surviving", "died", "dying", "killed", "killing", "battling", "battled", "preventing", "prevented", "managing", "managed", "controlling", "controlled", "spreading", "spread", "stopping", "stopped", "causing", "caused", "getting", "gotten", "catching", "caught", "having", "had", "showing", "showed", "presenting", "presented", "experiencing", "experienced", "suffering", "suffered"];
    
    // Also ignore if it's already caught by configuredDiseases
    const isConfigured = configuredDiseases.some(d => rawDisease.includes(d.toLowerCase()) || d.toLowerCase().includes(firstWord));
    
    if (!isConfigured && !stopWords.includes(firstWord)) {
      // Capitalize to match disease naming convention (e.g. "nipah virus" -> "Nipah Virus")
      const titleCaseDisease = rawDisease.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      
      entities.push({ disease: titleCaseDisease, entityType: "epidemiological_term", normalizedValue: titleCaseDisease, sourceText, confidence: 0.8 });
      
      for (const symptom of symptomRules) {
        if (normalizedText.includes(symptom)) {
          entities.push({ disease: titleCaseDisease, entityType: "symptom", normalizedValue: symptom, sourceText, confidence: 0.8 });
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
