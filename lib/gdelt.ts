import { BigQuery } from "@google-cloud/bigquery";
import { getConfiguredDiseases, getServerEnv } from "@/lib/env";
import { gdeltResponseSchema } from "@/lib/validation";
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

  let lastError: GdeltRequestError | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    // Always pace requests — wait before every attempt, not just retries.
    // On the first attempt this respects the 5-second minimum interval.
    // On retries it applies exponential backoff on top.
    const delay = attempt === 0 ? MIN_REQUEST_INTERVAL_MS : backoffMs(attempt, lastError?.retryAfter ?? null);
    await sleep(delay);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal, cache: "no-store" });

      if (response.status === 429) {
        lastError = new GdeltRequestError(response.status, response.headers.get("retry-after"));
        console.warn(`GDELT 429 on attempt ${attempt + 1}/${MAX_RETRIES + 1}. Backing off.`);
        continue; // retry
      }

      if (!response.ok) {
        throw new GdeltRequestError(response.status, response.headers.get("retry-after"));
      }

      const parsed = gdeltResponseSchema.parse(await response.json());
      return {
        query,
        articles: parsed.articles
          .map((article) => normalizeGdeltArticle(article, query))
          .filter((article): article is NormalizedArticle => article !== null),
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  // All retries exhausted — surface the last 429 to the caller.
  throw lastError ?? new GdeltRequestError(429, null);
}

// ---------------------------------------------------------------------------
// BigQuery path — primary data source (replaces DOC 2.0 API)
// Queries the public GDELT GKG v2 table for Mumbai disease articles.
// Uses Application Default Credentials (gcloud auth application-default login).
// ---------------------------------------------------------------------------

// Raw row shape returned by the GKG query.
type GkgRow = {
  url: string;
  source_domain: string | null;
  seen_date: { value: string } | string | null;
  themes: string | null;
  locations: string | null;
  tone: string | null;
};

/**
 * Parse the GKG DATE column (YYYYMMDDHHMMSS string) into an ISO timestamp.
 * BigQuery returns DATE/DATETIME values as objects with a `value` property.
 */
function parseGkgDate(raw: GkgRow["seen_date"]): string {
  const value = raw !== null && typeof raw === "object" ? raw.value : raw;
  if (typeof value !== "string") return new Date().toISOString();
  // YYYYMMDDHHMMSS format
  const match = value.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (match) {
    const [, year, month, day, hour, minute, second] = match;
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`).toISOString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

/**
 * Derive a readable title from GKG fields.
 * GKG doesn't have a clean title column, so we construct one from
 * the source domain and the first matched theme.
 */
function deriveTitle(row: GkgRow, diseases: readonly string[]): string {
  const domain = row.source_domain ?? "unknown source";
  const matchedDisease = diseases.find(
    (d) => row.themes?.toLowerCase().includes(d.toLowerCase()),
  ) ?? diseases[0];
  return `${matchedDisease} report via ${domain}`;
}

/**
 * Convert a raw GKG row into the NormalizedArticle shape the rest of the
 * pipeline already understands.
 */
function normalizeGkgRow(row: GkgRow, query: string, diseases: readonly string[]): NormalizedArticle | null {
  const url = typeof row.url === "string" && row.url.trim() ? row.url.trim() : null;
  if (!url) return null;
  try { new URL(url); } catch { return null; }

  return {
    url,
    title: deriveTitle(row, diseases),
    snippet: row.themes ?? null,         // themes string is the best available summary
    sourceDomain: row.source_domain ?? null,
    sourceCountry: "India",              // we filter to India/Mumbai so this is safe
    language: null,                      // not available in GKG
    publishedAt: parseGkgDate(row.seen_date),
    query,
    location,
    rawPayload: row as unknown as Record<string, unknown>,
  };
}

export async function fetchGdeltArticlesBigQuery(): Promise<{ query: string; articles: NormalizedArticle[] }> {
  const env = getServerEnv();
  const diseases = getConfiguredDiseases();
  const query = buildGdeltQuery();

  const bigquery = new BigQuery({ projectId: env.GOOGLE_CLOUD_PROJECT });

  // Build per-disease LIKE conditions for the Themes column.
  // GKG Themes are semicolon-delimited strings, e.g. "HEALTH;DISEASE_DENGUE;..."
  const themeConditions = diseases
    .map((_, i) => `LOWER(Themes) LIKE CONCAT('%', @disease${i}, '%')`)
    .join(" OR ");

  const sql = `
    SELECT
      DocumentIdentifier   AS url,
      SourceCommonName     AS source_domain,
      DATE                 AS seen_date,
      Themes               AS themes,
      Locations            AS locations,
      Tone                 AS tone
    FROM \`gdelt-bq.gdeltv2.gkg\`
    WHERE
      _PARTITIONTIME >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 DAY)
      AND (${themeConditions})
      AND (
        LOWER(Locations) LIKE '%mumbai%'
        OR LOWER(Locations) LIKE '%india%'
      )
    LIMIT 250
  `;

  // Build the params array: one entry per disease.
  const params: Record<string, string> = {};
  diseases.forEach((disease, i) => { params[`disease${i}`] = disease.toLowerCase(); });

  const [rows] = await bigquery.query({ query: sql, params, location: "US" });

  const articles = (rows as GkgRow[])
    .map((row) => normalizeGkgRow(row, query, diseases))
    .filter((a): a is NormalizedArticle => a !== null);

  return { query, articles };
}
