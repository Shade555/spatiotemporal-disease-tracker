import { NextRequest, NextResponse } from "next/server";
import sampleResponse from "@/fixtures/gdelt/sample-response.json";
import { fetchGdeltArticles, normalizeGdeltArticle } from "@/lib/gdelt";
import { getConfiguredDiseases, getServerEnv } from "@/lib/env";
import { calculateDailyMetrics } from "@/lib/metrics";
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

  const useFixture = new URL(request.url).searchParams.get("source") === "fixture";
  const supabase = getSupabaseAdmin();
  const startedAt = new Date().toISOString();
  let query = "";
  let runId: string | null = null;

  try {
    const source = useFixture
      ? gdeltResponseSchema.parse(sampleResponse).articles.map((article) => normalizeGdeltArticle(article, `Mumbai (${configuredDiseases.join(" OR ")})`)).filter((article): article is NonNullable<typeof article> => article !== null)
      : (await fetchGdeltArticles()).articles;
    query = source[0]?.query ?? `Mumbai (${configuredDiseases.join(" OR ")})`;

    const run = await supabase.from("pipeline_runs").insert({ status: "running", query }).select("id").single();
    if (run.error) throw run.error;
    runId = run.data.id;

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
      articlesInserted += 1;

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

    const metrics = calculateDailyMetrics(source, configuredDiseases);
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
    return NextResponse.json({ status: "succeeded", source: useFixture ? "fixture" : "gdelt", query, articlesSeen: source.length, articlesInserted, entitiesExtracted, startedAt });
  } catch (error) {
    if (runId) {
      await supabase.from("pipeline_runs").update({ status: "failed", completed_at: new Date().toISOString(), error_message: error instanceof Error ? error.message : "Unknown ingestion failure" }).eq("id", runId);
    }
    return NextResponse.json({ status: "failed", message: "Ingestion failed." }, { status: 500 });
  }
}
