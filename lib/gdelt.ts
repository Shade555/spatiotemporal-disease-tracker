import { getConfiguredDiseases, getServerEnv } from "@/lib/env";
import { location, type NormalizedArticle } from "@/lib/types";

const requestTimeoutMs = 15_000;

// GDELT enforces 1 request per 5 seconds per IP.
// We wait at least 6 seconds before the first attempt, then back off exponentially on 429.
const MIN_REQUEST_INTERVAL_MS = 6_000;
const MAX_RETRIES = 3;

export class GdeltRequestError extends Error {
  constructor(public readonly status: number, public readonly retryAfter: string | null) {
    super(`GDELT request failed with status ${status}.`);
    this.name = "GdeltRequestError";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Returns how long to wait before the next attempt.
 * If the server sent a Retry-After header, honour it.
 * Otherwise use exponential backoff: 6s, 12s, 24s, ...
 */
function backoffMs(attempt: number, retryAfter: string | null): number {
  if (retryAfter !== null) {
    const seconds = Number(retryAfter);
    if (!Number.isNaN(seconds) && seconds > 0) return seconds * 1_000;
  }
  return MIN_REQUEST_INTERVAL_MS * 2 ** attempt;
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

type GdeltCloudStory = {
  story_date: string;
  first_published_at: string;
  title: string;
  summary?: string;
  top_articles: Array<{
    url: string;
    title: string;
    domain: string;
  }>;
};

export async function fetchGdeltArticles(): Promise<{ query: string; articles: NormalizedArticle[] }> {
  const env = getServerEnv();
  const query = "admin1=Maharashtra&category=HEALTH&days=14";
  // We use the new GDELT Cloud API endpoint explicitly instead of env.GDELT_API_URL
  // to avoid hitting the legacy API if it's still configured in .env
  const url = new URL("https://gdeltcloud.com/api/v2/stories");
  url.searchParams.set("admin1", "Maharashtra");
  url.searchParams.set("category", "HEALTH");
  url.searchParams.set("days", "14"); // Go back 14 days to catch rich health news
  url.searchParams.set("limit", "100");

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

    if (!env.GDELT_CLOUD_API_KEY) {
      throw new Error("Missing GDELT_CLOUD_API_KEY in environment variables. Please add it to Vercel.");
    }

    if (attempt > 0) {
      console.log(`[gdelt] Retrying GDELT Cloud API (attempt ${attempt + 1}/${MAX_RETRIES + 1})...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    try {
      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${env.GDELT_CLOUD_API_KEY}`,
        },
        signal: controller.signal,
        cache: "no-store",
      });

      if (response.status === 429) {
        lastError = new GdeltRequestError(response.status, response.headers.get("retry-after"));
        continue;
      }

      if (!response.ok) {
        throw new GdeltRequestError(response.status, response.headers.get("retry-after"));
      }

      const json = await response.json();
      if (!json.success || !json.data) {
        throw new Error("Invalid GDELT Cloud API response format");
      }

      const stories = json.data as GdeltCloudStory[];
      const articles: NormalizedArticle[] = [];

      for (const story of stories) {
        if (!story.top_articles || story.top_articles.length === 0) continue;
        const top = story.top_articles[0];
        
        try {
          new URL(top.url);
        } catch {
          continue; // Invalid URL
        }

        articles.push({
          url: top.url,
          title: top.title,
          snippet: story.summary || story.title,
          sourceDomain: top.domain,
          sourceCountry: "India",
          language: "English",
          publishedAt: story.first_published_at || new Date().toISOString(),
          query: "admin1=Maharashtra&category=HEALTH",
          location: "Mumbai",
          rawPayload: story as unknown as Record<string, unknown>,
        });
      }

      return { query, articles };
    } catch (error) {
      console.error("[gdelt] Fetch attempt failed:", error);
      lastError = error instanceof GdeltRequestError ? error : new GdeltRequestError(500, null);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError ?? new GdeltRequestError(429, null);
}
