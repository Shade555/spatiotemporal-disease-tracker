import { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { POST as runIngest } from "../ingest/route";

export const dynamic = "force-dynamic";

/**
 * Public-facing endpoint for triggering ingestion from the dashboard.
 * This is a convenience wrapper around /api/ingest that automatically includes
 * the CRON_SECRET, so the client doesn't need to know it.
 */
export async function POST(request: NextRequest) {
  try {
    const env = getServerEnv();
    
    // Create a new request based on the original one but add the Authorization header
    const headers = new Headers(request.headers);
    headers.set("Authorization", `Bearer ${env.CRON_SECRET}`);

    const url = new URL(request.url);
    const source = url.searchParams.get("source");
    const targetUrl = new URL(request.url);
    targetUrl.pathname = "/api/ingest";
    if (source) {
      targetUrl.searchParams.set("source", source);
    } else {
      targetUrl.searchParams.delete("source");
    }

    const modifiedRequest = new NextRequest(targetUrl.toString(), {
      method: "POST",
      headers,
    });

    // Directly call the handler to avoid network loopback and Vercel header stripping
    const response = await runIngest(modifiedRequest);
    return response;
  } catch (error) {
    console.error("[trigger-ingest]", error);
    return NextResponse.json(
      { error: "Failed to trigger ingestion" },
      { status: 500 },
    );
  }
}
