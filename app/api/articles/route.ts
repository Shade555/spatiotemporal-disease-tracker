import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { articleQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const parsed = articleQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const supabase = getSupabaseAdmin();
    const from = (parsed.page - 1) * parsed.pageSize;
    const to = from + parsed.pageSize - 1;
    const query = supabase.from("articles").select("*, extracted_entities(*)", { count: "exact" }).eq("location", parsed.location).order("published_at", { ascending: false }).range(from, to);
    const { data, error, count } = await query;
    if (error) throw error;
    return NextResponse.json({ data: data ?? [], page: parsed.page, pageSize: parsed.pageSize, total: count ?? 0 });
  } catch {
    return NextResponse.json({ error: "Unable to load articles." }, { status: 400 });
  }
}
