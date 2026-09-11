import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { appUsers } from "@/db/schema";
import { verifyPayload } from "@/lib/signed-payload";

interface VerificationPayload {
  sub: string;
  exp: number;
  purpose: "email-verify";
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?verify_error=missing", req.nextUrl.origin));
  }

  const payload = verifyPayload<VerificationPayload>(token);
  if (!payload || payload.purpose !== "email-verify") {
    return NextResponse.redirect(new URL("/login?verify_error=invalid", req.nextUrl.origin));
  }

  if (Date.now() > payload.exp) {
    return NextResponse.redirect(new URL("/login?verify_error=expired", req.nextUrl.origin));
  }

  const db = getDb();
  const user = await db
    .select({ id: appUsers.id, emailVerifiedAt: appUsers.emailVerifiedAt })
    .from(appUsers)
    .where(eq(appUsers.id, payload.sub))
    .limit(1)
    .then((r) => r[0]);

  if (!user) {
    return NextResponse.redirect(new URL("/login?verify_error=invalid", req.nextUrl.origin));
  }

  if (!user.emailVerifiedAt) {
    await db
      .update(appUsers)
      .set({ emailVerifiedAt: new Date() })
      .where(eq(appUsers.id, payload.sub));
  }

  return NextResponse.redirect(new URL("/login?verified=true", req.nextUrl.origin));
}
