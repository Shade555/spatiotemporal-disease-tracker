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
    const appUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Call the protected /api/ingest endpoint with the server-side CRON_SECRET
    const response = await fetch(`${appUrl}/api/ingest`, {
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
