import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("pipeline_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(10);

    if (error) throw error;

    return NextResponse.json({
      data: (data ?? []).map((run) => ({
        id: run.id,
        status: run.status,
        started_at: run.started_at,
        completed_at: run.completed_at,
        articles_seen: run.articles_seen,
        articles_inserted: run.articles_inserted,
        entities_extracted: run.entities_extracted,
        error_message: run.error_message,
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to fetch ingestion status." },
      { status: 500 },
    );
  }
}
