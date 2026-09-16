import { z } from "zod";

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  CRON_SECRET: z.string().min(1),
  GDELT_API_URL: z.string().url().default("https://api.gdeltproject.org/api/v2/doc/doc"),
  GDELT_QUERY_LOCATION: z.literal("Mumbai").default("Mumbai"),
  GDELT_QUERY_DISEASES: z.string().default("Dengue,Malaria"),
  GOOGLE_CLOUD_PROJECT: z.string().min(1),
  NEWSAPI_KEY: z.string().min(1),
});

export function getServerEnv() {
  return serverEnvSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    CRON_SECRET: process.env.CRON_SECRET,
    GDELT_API_URL: process.env.GDELT_API_URL,
    GDELT_QUERY_LOCATION: process.env.GDELT_QUERY_LOCATION,
    GDELT_QUERY_DISEASES: process.env.GDELT_QUERY_DISEASES,
    GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT,
    NEWSAPI_KEY: process.env.NEWSAPI_KEY,
  });
}

export function getConfiguredDiseases(): string[] {
  const diseases = getServerEnv().GDELT_QUERY_DISEASES
    .split(",")
    .map((disease) => disease.trim())
    .filter(Boolean);
  if (diseases.length === 0) throw new Error("At least one disease must be configured.");
  return [...new Set(diseases)];
}
