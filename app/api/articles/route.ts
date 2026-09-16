import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { articleQuerySchema } from "@/lib/validation";
import { findMumbaiLocality } from "@/lib/geo";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const parsed = articleQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const supabase = getSupabaseAdmin();

    // Query: Get articles that have disease-related entities (epidemiological_term)
    // If a specific disease is selected, filter to that disease
    // If "All" is selected, show ALL disease-related articles (any epidemiological_term)
    
    let articleIds: string[] | null = null;
    
    if (parsed.disease) {
      // Specific disease selected
      const { data: entities } = await supabase
        .from("extracted_entities")
        .select("article_id")
        .eq("disease", parsed.disease)
        .eq("entity_type", "epidemiological_term");

      if (entities) {
        articleIds = [...new Set(entities.map((e) => e.article_id))];
      }
    } else {
      // "All" selected - show only articles that have ANY disease-related entities
      const { data: entities } = await supabase
        .from("extracted_entities")
        .select("article_id")
        .eq("entity_type", "epidemiological_term");

      if (entities && entities.length > 0) {
        articleIds = [...new Set(entities.map((e) => e.article_id))];
      }
    }

    const from = (parsed.page - 1) * parsed.pageSize;
    const to = from + parsed.pageSize - 1;

    let query = supabase
      .from("articles")
      .select("*, extracted_entities(*)", { count: "exact" })
      .eq("location", parsed.location);

    // If no disease-related articles found, return empty
    if (!articleIds || articleIds.length === 0) {
      return NextResponse.json({ data: [], page: parsed.page, pageSize: parsed.pageSize, total: 0 });
    }

    // Filter by article IDs (only disease-related articles)
    query = query.in("id", articleIds);

    const { data, error, count } = await query.order("published_at", { ascending: false }).range(from, to);

    if (error) throw error;

    return NextResponse.json({
      data: (data ?? []).map((article) => {
        const point = findMumbaiLocality(`${article.title} ${article.snippet ?? ""}`);
        return {
          ...article,
          latitude: point?.latitude ?? null,
          longitude: point?.longitude ?? null,
          locality: point?.label ?? null,
        };
      }),
      page: parsed.page,
      pageSize: parsed.pageSize,
      total: count ?? 0,
    });
  } catch (error) {
    console.error("[articles]", error);
    return NextResponse.json({ error: "Unable to load articles." }, { status: 400 });
  }
}
