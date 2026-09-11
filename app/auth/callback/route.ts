import { NextResponse } from "next/server";

/**
 * I vecchi link email Supabase (exchangeCodeForSession) non sono più usati.
 * L'auth passa a NextAuth su /api/auth/*.
 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/login`);
}
