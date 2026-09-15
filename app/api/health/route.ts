import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    getServerEnv();
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("pipeline_runs").select("id").limit(1);

    if (error) {
      return NextResponse.json(
        { status: "error", service: "supabase", message: "Database health check failed." },
        { status: 503 },
      );
    }

    return NextResponse.json({ status: "ok", service: "api", database: "ok" });
  } catch {
    return NextResponse.json(
      { status: "error", service: "configuration", message: "Server configuration is incomplete." },
      { status: 503 },
    );
  }
}
