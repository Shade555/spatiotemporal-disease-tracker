import { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Public-facing endpoint for triggering ingestion from the dashboard.
 * This is a convenience wrapper around /api/ingest that automatically includes
 * the CRON_SECRET, so the client doesn't need to know it.
 */
export async function POST(request: NextRequest) {
  try {
    const env = getServerEnv();
    
    // Always trust the incoming request's origin first, to avoid Vercel env vars 
    // (like NEXT_PUBLIC_APP_URL=http://localhost:3000) from breaking the app.
    // If somehow missing, fallback to env.NEXT_PUBLIC_APP_URL.
    let appUrl = request.nextUrl.origin;
    if (appUrl === "http://localhost:3000" && process.env.VERCEL_URL) {
       // Edge case: Vercel serverless function with weird host header
       appUrl = `https://${process.env.VERCEL_URL}`;
    } else if (appUrl === "http://localhost:3000" && env.NEXT_PUBLIC_APP_URL && env.NEXT_PUBLIC_APP_URL !== "http://localhost:3000") {
       appUrl = env.NEXT_PUBLIC_APP_URL;
    }

    const searchParams = request.nextUrl.searchParams;
    const source = searchParams.get("source");
    const targetUrl = new URL(`${appUrl}/api/ingest`);
    if (source) {
      targetUrl.searchParams.set("source", source);
    }

    // Call the protected /api/ingest endpoint with the server-side CRON_SECRET
    const response = await fetch(targetUrl.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.CRON_SECRET}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("[trigger-ingest]", error);
    return NextResponse.json(
      { error: "Failed to trigger ingestion" },
      { status: 500 },
    );
  }
}
