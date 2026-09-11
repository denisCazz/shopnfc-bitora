import { NextResponse } from "next/server";

/**
 * Liveness/readiness probe for Docker, nginx, and load balancers.
 * Does not hit the database — use only for process-level health.
 */
export async function GET() {
  return NextResponse.json(
    { status: "ok", timestamp: new Date().toISOString() },
    { status: 200 }
  );
}
