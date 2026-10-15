import { NextRequest, NextResponse } from "next/server";
import { fulfillStripeSessionById } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  const origin = process.env.AUTH_URL || "http://localhost:3000";
  const sessionId = req.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.redirect(`${origin}/checkout?error=stripe_failed`);
  }

  try {
    const { outcome, orderId } = await fulfillStripeSessionById(sessionId);
    const orderQuery = orderId ? `?order=${orderId}` : "";
    if (outcome === "confirmed" || outcome === "already_confirmed") {
      return NextResponse.redirect(`${origin}/checkout/success${orderQuery}`);
    }
    if (outcome === "pending") {
      return NextResponse.redirect(`${origin}/checkout/success${orderQuery}`);
    }
    if (outcome === "canceled") {
      return NextResponse.redirect(`${origin}/checkout?error=stripe_cancelled`);
    }
    return NextResponse.redirect(`${origin}/checkout?error=stripe_failed`);
  } catch (err) {
    console.error("Stripe return error:", err);
    return NextResponse.redirect(`${origin}/checkout?error=stripe_failed`);
  }
}
