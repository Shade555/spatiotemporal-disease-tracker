import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import sampleResponse from "@/fixtures/gdelt/sample-response.json";
import { fetchGdeltArticles, fetchGdeltArticlesBigQuery, fetchNewsApiArticles, GdeltRequestError, normalizeGdeltArticle } from "@/lib/gdelt";
import { getConfiguredDiseases, getServerEnv } from "@/lib/env";
import { applyRollingAnomalies, calculateDailyMetrics } from "@/lib/metrics";
import { getSupabaseAdmin } from "@/lib/supabase";
import { extractEntities, gdeltResponseSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest, secret: string): boolean {
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(request: NextRequest) {
  const env = getServerEnv();
  const configuredDiseases = getConfiguredDiseases();
  if (!isAuthorized(request, env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = new URL(request.url).searchParams;
  const sourceParam = searchParams.get("source"); // "fixture" | "doc2" | null (default: bigquery)
  const useFixture = sourceParam === "fixture";
  const useLegacyApi = sourceParam === "doc2";
  const supabase = getSupabaseAdmin();
  const startedAt = new Date().toISOString();
  let query = "";
  let runId: string | null = null;

  try {
    let sourceLabel: string;
    let source: NonNullable<ReturnType<typeof normalizeGdeltArticle>>[];

    if (useFixture) {
      sourceLabel = "fixture";
      source = gdeltResponseSchema.parse(sampleResponse).articles
        .map((article) => normalizeGdeltArticle(article, `Mumbai (${configuredDiseases.join(" OR ")})`))
        .filter((article): article is NonNullable<typeof article> => article !== null);
    } else if (useLegacyApi) {
      sourceLabel = "gdelt-doc2";
      source = (await fetchGdeltArticles()).articles;
    } else if (sourceParam === "bigquery") {
      sourceLabel = "bigquery";
      console.log("[ingest] Starting BigQuery fetch...");
      try {
        source = (await fetchGdeltArticlesBigQuery()).articles;
        console.log("[ingest] BigQuery returned", source.length, "articles");
      } catch (bqError) {
        console.error("[ingest] BigQuery error:", bqError instanceof Error ? bqError.message : String(bqError));
        throw bqError;
      }
    } else {
      sourceLabel = "newsapi";
      console.log("[ingest] Starting NewsAPI fetch...");
      try {
        source = (await fetchNewsApiArticles()).articles;
        console.log("[ingest] NewsAPI returned", source.length, "articles");
      } catch (newsError) {
        console.error("[ingest] NewsAPI error:", newsError instanceof Error ? newsError.message : String(newsError));
        throw newsError;
      }
    }
    query = source[0]?.query ?? `Mumbai (${configuredDiseases.join(" OR ")})`;
    console.log("[ingest] Processing", source.length, "articles from", sourceLabel);
    const run = await supabase.from("pipeline_runs").insert({ status: "running", query }).select("id").single();
    if (run.error) throw run.error;
    runId = run.data.id;

    const sourceUrls = [...new Set(source.map((article) => article.url))];
    const existingArticles = sourceUrls.length === 0
      ? { data: [], error: null }
      : await supabase.from("articles").select("url").in("url", sourceUrls);
    if (existingArticles.error) throw existingArticles.error;
    const existingUrls = new Set((existingArticles.data ?? []).map((article) => article.url));
    let articlesInserted = 0;
    let entitiesExtracted = 0;
    for (const article of source) {
      const stored = await supabase.from("articles").upsert({
        url: article.url,
        title: article.title,
        snippet: article.snippet,
        source_domain: article.sourceDomain,
        source_country: article.sourceCountry,
        language: article.language,
        published_at: article.publishedAt,
        query: article.query,
        location: article.location,
        raw_payload: article.rawPayload,
      }, { onConflict: "url", ignoreDuplicates: false }).select("id").single();
      if (stored.error) throw stored.error;
      if (!existingUrls.has(article.url)) articlesInserted += 1;

      const entities = extractEntities(article.title, article.snippet, configuredDiseases).map((entity) => ({
        article_id: stored.data.id,
        disease: entity.disease,
        entity_type: entity.entityType,
        normalized_value: entity.normalizedValue,
        source_text: entity.sourceText,
        confidence: entity.confidence,
      }));
      if (entities.length > 0) {
        const entityResult = await supabase.from("extracted_entities").upsert(entities, { onConflict: "article_id,disease,entity_type,normalized_value" });
        if (entityResult.error) throw entityResult.error;
        entitiesExtracted += entities.length;
      }
    }

    const incomingMetrics = calculateDailyMetrics(source, configuredDiseases);
    const existingMetrics = await supabase.from("daily_metrics").select("*").eq("location", "Mumbai");
    if (existingMetrics.error) throw existingMetrics.error;
    const historicalMetrics = (existingMetrics.data ?? []).map((metric) => ({
      metricDate: metric.metric_date,
      location: metric.location,
      disease: metric.disease,
      articleCount: metric.article_count,
      symptomCount: metric.symptom_count,
      uniqueSourceCount: metric.unique_source_count,
      rollingMean: metric.rolling_mean,
      rollingStddev: metric.rolling_stddev,
      anomalyScore: metric.anomaly_score,
      isAnomaly: metric.is_anomaly,
      forecastValue: metric.forecast_value,
    }));
    const metrics = applyRollingAnomalies(
      [...historicalMetrics.filter((historical) => !incomingMetrics.some((incoming) => incoming.metricDate === historical.metricDate && incoming.disease === historical.disease)), ...incomingMetrics],
    ).filter((metric) => incomingMetrics.some((incoming) => incoming.metricDate === metric.metricDate && incoming.disease === metric.disease));
    for (const metric of metrics) {
      const result = await supabase.from("daily_metrics").upsert({
        metric_date: metric.metricDate,
        location: metric.location,
        disease: metric.disease,
        article_count: metric.articleCount,
        symptom_count: metric.symptomCount,
        unique_source_count: metric.uniqueSourceCount,
        rolling_mean: metric.rollingMean,
        rolling_stddev: metric.rollingStddev,
        anomaly_score: metric.anomalyScore,
        is_anomaly: metric.isAnomaly,
        forecast_value: metric.forecastValue,
      });
      if (result.error) throw result.error;
    }

    if (runId) {
      await supabase.from("pipeline_runs").update({ status: "succeeded", completed_at: new Date().toISOString(), articles_seen: source.length, articles_inserted: articlesInserted, entities_extracted: entitiesExtracted }).eq("id", runId);
    }
    return NextResponse.json({ status: "succeeded", source: sourceLabel, query, articlesSeen: source.length, articlesInserted, entitiesExtracted, startedAt });
  } catch (error) {
    console.error("[ingest] Caught error:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error) console.error("[ingest] Stack:", error.stack);
    if (runId) {
      await supabase.from("pipeline_runs").update({ status: "failed", completed_at: new Date().toISOString(), error_message: error instanceof Error ? error.message : "Unknown ingestion failure" }).eq("id", runId);
    }
    if (error instanceof GdeltRequestError) {
      const retryAfter = error.retryAfter ?? "60";
      return NextResponse.json({ status: "failed", message: "GDELT is temporarily rate-limiting requests.", retryAfterSeconds: retryAfter }, { status: error.status === 429 ? 429 : 502, headers: { "Retry-After": retryAfter } });
    }
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ status: "failed", message: "GDELT request timed out." }, { status: 504 });
    }
    if (error instanceof SyntaxError || error instanceof ZodError) {
      return NextResponse.json({ status: "failed", message: "GDELT returned an invalid payload." }, { status: 502 });
    }
    return NextResponse.json({ status: "failed", message: "Ingestion failed." }, { status: 500 });
  }
}
