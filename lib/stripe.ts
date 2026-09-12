import { randomBytes } from "crypto";
import Stripe from "stripe";
import { and, eq, like, or } from "drizzle-orm";
import { getDb } from "@/db";
import { orderItems, orders } from "@/db/schema";
import {
  sendNewOrderAdminNotification,
  sendOrderConfirmationEmail,
} from "@/lib/email";
import { formatOrderNumber } from "@/lib/order-number";
import { redeemDiscountCode } from "@/lib/discount-codes";

export class StripeError extends Error {
  constructor(
    message: string,
    public readonly code: "missing_credentials" | "create_failed" | "auth_failed",
    public readonly details?: string
  ) {
    super(message);
    this.name = "StripeError";
  }
}

export type StripeFulfillOutcome =
  | "confirmed"
  | "already_confirmed"
  | "pending"
  | "canceled"
  | "not_found"
  | "mismatch";

let stripeClient: Stripe | null = null;

function siteUrl(): string {
  return process.env.AUTH_URL || "http://localhost:3000";
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new StripeError(
      "Stripe non configurato (STRIPE_SECRET_KEY)",
      "missing_credentials"
    );
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

function pendingStatus(sessionId: string): string {
  return `stripe_pending:${sessionId}`;
}

function paidStatus(sessionId: string): string {
  return `stripe:${sessionId}`;
}

function integrationIdentifier(): string {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const bytes = randomBytes(8);
  const suffix = Array.from(bytes, (b) => letters[b % 26]).join("");
  return `shopnfc_${suffix}`;
}

function toCents(amount: number): number {
  return Math.round(amount * 100);
}

function httpsImage(url: string | null | undefined): string | undefined {
  if (!url || !url.startsWith("https://")) return undefined;
  return url;
}

export function parseStripeSessionId(
  paymentStatus: string | null | undefined
): string | null {
  if (!paymentStatus) return null;
  const match = paymentStatus.match(/^stripe(?:_pending)?:(.+)$/);
  return match?.[1] ?? null;
}

export async function verifyStripeCredentials(): Promise<{
  ok: boolean;
  message: string;
}> {
  try {
    const stripe = getStripe();
    await stripe.balance.retrieve();
    const live = process.env.STRIPE_SECRET_KEY?.startsWith("sk_live") ||
      process.env.STRIPE_SECRET_KEY?.startsWith("rk_live");
    return {
      ok: true,
      message: `Autenticazione Stripe OK (modalità ${live ? "live" : "test"})`,
    };
  } catch (err) {
    if (err instanceof StripeError) {
      return { ok: false, message: err.message };
    }
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Errore di rete Stripe",
    };
  }
}

export async function cancelStalePendingStripeOrders(opts: {
  userId?: string | null;
  guestEmail?: string | null;
}): Promise<void> {
  const db = getDb();
  const owner = opts.userId
    ? eq(orders.userId, opts.userId)
    : opts.guestEmail?.trim()
      ? eq(orders.guestEmail, opts.guestEmail.trim())
      : null;
  if (!owner) return;

  await db
    .update(orders)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(
      and(
        owner,
        eq(orders.status, "pending"),
        eq(orders.paymentMethod, "stripe"),
        like(orders.paymentStatus, "stripe_pending%")
      )
    );
}

export async function createStripeCheckoutSession(opts: {
  orderId: number;
  totalEur: number;
  customerEmail: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    image?: string | null;
  }[];
  shippingCost: number;
  discountAmount?: number;
}): Promise<{ sessionId: string; url: string }> {
  const stripe = getStripe();
  const totalCents = toCents(opts.totalEur);
  if (totalCents < 50) {
    throw new StripeError(
      "Importo minimo Stripe non raggiunto",
      "create_failed"
    );
  }

  const productLines: Stripe.Checkout.SessionCreateParams.LineItem[] = opts.items
    .filter((item) => item.quantity > 0 && toCents(item.unitPrice) > 0)
    .map((item) => {
      const image = httpsImage(item.image);
      return {
        quantity: item.quantity,
        price_data: {
          currency: "eur",
          unit_amount: toCents(item.unitPrice),
          product_data: {
            name: item.name.replace(/\n+/g, " — ").slice(0, 250) || "Prodotto",
            ...(image ? { images: [image] } : {}),
          },
        },
      };
    });

  if (opts.shippingCost > 0) {
    productLines.push({
      quantity: 1,
      price_data: {
        currency: "eur",
        unit_amount: toCents(opts.shippingCost),
        product_data: { name: "Spedizione" },
      },
    });
  }

  const linesSum = productLines.reduce(
    (sum, line) =>
      sum + (line.price_data?.unit_amount ?? 0) * (line.quantity ?? 1),
    0
  );

  const lineItems =
    linesSum === totalCents && productLines.length > 0
      ? productLines
      : [
          {
            quantity: 1,
            price_data: {
              currency: "eur" as const,
              unit_amount: totalCents,
              product_data: {
                name: `Ordine ${formatOrderNumber(opts.orderId)} — Shop NFC`,
              },
            },
          },
        ];

  const origin = siteUrl();
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: opts.customerEmail,
      client_reference_id: String(opts.orderId),
      metadata: {
        orderId: String(opts.orderId),
        ...(opts.discountAmount
          ? { discountAmount: String(opts.discountAmount) }
          : {}),
      },
      payment_intent_data: {
        metadata: { orderId: String(opts.orderId) },
      },
      line_items: lineItems,
      success_url: `${origin}/api/stripe/return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?error=stripe_cancelled`,
      expires_at: Math.floor(Date.now() / 1000) + 3 * 60 * 60,
      integration_identifier: integrationIdentifier(),
      locale: "auto",
    });

    if (!session.url) {
      throw new StripeError(
        "Stripe non ha restituito un URL di checkout",
        "create_failed"
      );
    }

    return { sessionId: session.id, url: session.url };
  } catch (err) {
    if (err instanceof StripeError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    console.error("Stripe checkout session create failed:", message);
    throw new StripeError(
      "Impossibile creare la sessione di pagamento Stripe",
      "create_failed",
      message
    );
  }
}

export async function fulfillStripeCheckoutSession(
  session: Stripe.Checkout.Session,
  expectedOrderId?: number
): Promise<{ outcome: StripeFulfillOutcome; orderId?: number }> {
  const orderId = Number(session.metadata?.orderId || session.client_reference_id);
  if (!Number.isFinite(orderId) || orderId <= 0) {
    console.error("Stripe: metadata orderId mancante", session.id);
    return { outcome: "not_found" };
  }

  if (expectedOrderId != null && orderId !== expectedOrderId) {
    console.error("Stripe: order_id mismatch", expectedOrderId, "vs", orderId);
    return { outcome: "mismatch", orderId };
  }

  const db = getDb();
  const order = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)
    .then((r) => r[0]);

  if (!order) {
    console.error("Stripe: ordine non trovato", orderId, session.id);
    return { outcome: "not_found" };
  }

  if (order.paymentMethod !== "stripe") {
    console.error("Stripe: ordine", order.id, "non è un pagamento Stripe");
    return { outcome: "mismatch", orderId: order.id };
  }

  if (session.status === "expired" || (session.status === "complete" && session.payment_status === "unpaid")) {
    if (order.status === "pending") {
      await db
        .update(orders)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(and(eq(orders.id, order.id), eq(orders.status, "pending")));
    }
    return { outcome: "canceled", orderId: order.id };
  }

  if (session.payment_status !== "paid") {
    return { outcome: "pending", orderId: order.id };
  }

  const expectedCents = toCents(Number(order.total));
  if (session.amount_total != null && session.amount_total !== expectedCents) {
    console.error("CRITICAL: Stripe amount mismatch", {
      sessionId: session.id,
      orderId: order.id,
      expectedCents,
      got: session.amount_total,
    });
    return { outcome: "mismatch", orderId: order.id };
  }

  const paid = paidStatus(session.id);
  if (order.paymentStatus === paid || order.paymentStatus.startsWith("stripe:")) {
    return { outcome: "already_confirmed", orderId: order.id };
  }

  const updated = await db
    .update(orders)
    .set({
      status: "confirmed",
      paymentStatus: paid,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(orders.id, order.id),
        or(eq(orders.status, "pending"), eq(orders.status, "cancelled")),
        or(
          eq(orders.paymentStatus, pendingStatus(session.id)),
          like(orders.paymentStatus, "stripe_pending%")
        )
      )
    )
    .returning({ id: orders.id });

  if (!updated[0]) {
    return { outcome: "already_confirmed", orderId: order.id };
  }

  await redeemDiscountCode(order.id);

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  const shipping = (order.shippingAddress || {}) as Record<string, string>;
  const billing = (order.billingAddress || {}) as Record<string, string>;

  const emailData = {
    orderId: order.id,
    customerEmail: billing.email || order.guestEmail || session.customer_email || "",
    customerName: shipping.name || "",
    items: items.map((i) => ({
      product_name: i.productName,
      product_sku: i.productSku || null,
      quantity: i.quantity,
      unit_price: Number(i.unitPrice),
      discount_percent: i.discountPercent,
      line_total: Number(i.lineTotal),
    })),
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shippingCost),
    discountCode: order.discountCode,
    discountAmount: Number(order.discountAmount),
    total: Number(order.total),
    paymentMethod: "stripe" as const,
    shippingAddress: shipping,
    billingInfo: billing,
    customGraphicUrl: order.customGraphicUrl,
    customGraphicOriginalName: order.customGraphicOriginalName,
  };

  await Promise.allSettled([
    sendOrderConfirmationEmail(emailData),
    sendNewOrderAdminNotification(emailData),
  ]);

  return { outcome: "confirmed", orderId: order.id };
}

export async function fulfillStripeSessionById(
  sessionId: string
): Promise<{ outcome: StripeFulfillOutcome; orderId?: number }> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return fulfillStripeCheckoutSession(session);
}

export { paidStatus, pendingStatus };
