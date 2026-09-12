import { NextRequest, NextResponse } from "next/server";
import { searchAddresses } from "@/lib/address-search";

const WINDOW_MS = 10_000;
const MAX_HITS = 12;
const hitsByIp = new Map<string, number[]>();

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local"
  );
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hitsByIp.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_HITS) {
    hitsByIp.set(ip, recent);
    return true;
  }
  recent.push(now);
  hitsByIp.set(ip, recent);
  return false;
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  const country = req.nextUrl.searchParams.get("country");

  if (q.length < 3 || q.length > 80) {
    return NextResponse.json({ suggestions: [] });
  }

  if (rateLimited(clientIp(req))) {
    return NextResponse.json({ suggestions: [], error: "too_many_requests" }, { status: 429 });
  }

  try {
    const suggestions = await searchAddresses(q, country);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("address search", error);
    return NextResponse.json({ suggestions: [] }, { status: 502 });
  }
}
