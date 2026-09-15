import { getConfiguredDiseases, getServerEnv } from "@/lib/env";
import { gdeltResponseSchema } from "@/lib/validation";
import { location, type NormalizedArticle } from "@/lib/types";

const requestTimeoutMs = 15_000;

export class GdeltRequestError extends Error {
  constructor(public readonly status: number, public readonly retryAfter: string | null) {
    super(`GDELT request failed with status ${status}.`);
    this.name = "GdeltRequestError";
  }
}

export function buildGdeltQuery(): string {
  const env = getServerEnv();
  const diseases = getConfiguredDiseases();
  if (env.GDELT_QUERY_LOCATION !== location || diseases.length === 0) {
    throw new Error("GDELT query configuration must target Mumbai and at least one disease.");
  }
  return `${location} (${diseases.join(" OR ")})`;
}

function parsePublishedAt(value: unknown): string {
  if (typeof value !== "string") return new Date().toISOString();
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
  if (match) {
    const [, year, month, day, hour, minute, second] = match;
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`).toISOString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function normalizeGdeltArticle(article: Record<string, unknown>, query: string): NormalizedArticle | null {
  const url = stringValue(article.url);
  const title = stringValue(article.title);
  if (!url || !title) return null;
  try {
    new URL(url);
  } catch {
    return null;
  }
  return {
    url,
    title,
    snippet: stringValue(article.snippet) ?? stringValue(article.description) ?? stringValue(article.content),
    sourceDomain: stringValue(article.domain),
    sourceCountry: stringValue(article.sourcecountry),
    language: stringValue(article.language),
    publishedAt: parsePublishedAt(article.seendate ?? article.published_at),
    query,
    location,
    rawPayload: article,
  };
}

export async function fetchGdeltArticles(): Promise<{ query: string; articles: NormalizedArticle[] }> {
  const env = getServerEnv();
  const query = buildGdeltQuery();
  const url = new URL(env.GDELT_API_URL);
  url.searchParams.set("query", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("mode", "artlist");
  url.searchParams.set("maxrecords", "250");
  url.searchParams.set("timespan", "1d");
  url.searchParams.set("sort", "datedesc");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
    if (!response.ok) throw new GdeltRequestError(response.status, response.headers.get("retry-after"));
    const parsed = gdeltResponseSchema.parse(await response.json());
    return { query, articles: parsed.articles.map((article) => normalizeGdeltArticle(article, query)).filter((article): article is NormalizedArticle => article !== null) };
  } finally {
    clearTimeout(timeout);
  }
}
