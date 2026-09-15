import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { metricQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const parsed = metricQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const supabase = getSupabaseAdmin();
    let query = supabase.from("daily_metrics").select("*").eq("location", parsed.location).order("metric_date", { ascending: true });
    if (parsed.disease) query = query.eq("disease", parsed.disease);
    if (parsed.from) query = query.gte("metric_date", parsed.from);
    if (parsed.to) query = query.lte("metric_date", parsed.to);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ data: (data ?? []).map((metric) => ({ metricDate: metric.metric_date, location: metric.location, disease: metric.disease, articleCount: metric.article_count, symptomCount: metric.symptom_count, uniqueSourceCount: metric.unique_source_count, rollingMean: metric.rolling_mean, rollingStddev: metric.rolling_stddev, anomalyScore: metric.anomaly_score, isAnomaly: metric.is_anomaly, forecastValue: metric.forecast_value })) });
  } catch {
    return NextResponse.json({ error: "Unable to load metrics." }, { status: 400 });
  }
}
