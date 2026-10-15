"use server";

import { desc, eq, and, inArray, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, orderItems, profiles, products, appUsers } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@/lib/types";
import { sendOrderStatusUpdateEmail } from "@/lib/email";
import { unredeemDiscountCode } from "@/lib/discount-codes";

export type OrderEmailActionResult = {
  ok: boolean;
  emailSent: boolean;
  emailTo?: string;
  emailError?: string;
};

async function resolveOrderCustomer(
  db: ReturnType<typeof getDb>,
  order: typeof orders.$inferSelect
): Promise<{ customerEmail: string; customerName: string }> {
  let customerEmail = order.guestEmail?.trim() ?? "";
  let customerName = "";

  const billing = order.billingAddress as Record<string, string> | null;
  const shipping = order.shippingAddress as Record<string, string> | null;

  if (order.userId) {
    const [prof] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, order.userId))
      .limit(1);
    if (prof) {
      if (prof.email?.trim()) customerEmail = prof.email.trim();
      customerName = [prof.firstName, prof.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
    }
    if (!customerEmail || !customerName) {
      const [u] = await db
        .select({ email: appUsers.email, name: appUsers.name })
        .from(appUsers)
        .where(eq(appUsers.id, order.userId))
        .limit(1);
      if (u) {
        if (!customerEmail && u.email?.trim()) customerEmail = u.email.trim();
        if (!customerName && u.name?.trim()) customerName = u.name.trim();
      }
    }
  }

  if (!customerEmail && billing?.email?.trim()) {
    customerEmail = billing.email.trim();
  }
  if (!customerEmail && shipping?.email?.trim()) {
    customerEmail = shipping.email.trim();
  }
  if (!customerName && shipping?.name?.trim()) {
    customerName = shipping.name.trim();
  }
  if (!customerName && billing?.company?.trim()) {
    customerName = billing.company.trim();
  }

  return {
    customerEmail,
    customerName: customerName || "Cliente",
  };
}

export async function getOrders(filters?: {
  status?: string;
}) {
  const user = await getUser();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");

  const db = getDb();
  const conds: SQL[] = [];
  if (filters?.status && filters.status !== "all") {
    conds.push(eq(orders.status, filters.status as OrderStatus));
  }
  const whereClause = conds.length ? and(...conds) : undefined;

  const orderRows = whereClause
    ? await db
        .select()
        .from(orders)
        .where(whereClause)
        .orderBy(desc(orders.id))
    : await db.select().from(orders).orderBy(desc(orders.id));

  const orderIds = orderRows.map((o) => o.id);
  const itemRows =
    orderIds.length > 0
      ? await db
          .select()
          .from(orderItems)
          .where(inArray(orderItems.orderId, orderIds))
      : [];

  const itemsByOrder = new Map<number, typeof itemRows>();
  for (const it of itemRows) {
    const list = itemsByOrder.get(it.orderId) || [];
    list.push(it);
    itemsByOrder.set(it.orderId, list);
  }

  const userIds = orderRows
    .map((o) => o.userId)
    .filter((id): id is string => !!id);

  let profileMap: Record<
    string,
    { email: string; first_name: string | null; last_name: string | null }
  > = {};

  if (userIds.length > 0) {
    const profs = await db
      .select({
        id: profiles.id,
        email: profiles.email,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
      })
      .from(profiles)
      .where(inArray(profiles.id, userIds));
    profileMap = Object.fromEntries(
      profs.map((p) => [
        p.id,
        {
          email: p.email,
          first_name: p.firstName,
          last_name: p.lastName,
        },
      ])
    );
  }

  const data = orderRows.map((o) => ({
    id: o.id,
    created_at: o.createdAt.toISOString(),
    status: o.status,
    payment_method: o.paymentMethod,
    payment_status: o.paymentStatus,
    subtotal: Number(o.subtotal),
    shipping_cost: Number(o.shippingCost),
    discount_code: o.discountCode,
    discount_amount: Number(o.discountAmount),
    total: Number(o.total),
    shipping_address: o.shippingAddress as Record<string, unknown>,
    billing_address: o.billingAddress as Record<string, unknown>,
    guest_email: o.guestEmail,
    user_id: o.userId,
    notes: o.notes,
    tracking_number: o.trackingNumber,
    bank_transfer_receipt_url: o.bankTransferReceiptUrl,
    custom_graphic_url: o.customGraphicUrl,
    custom_graphic_original_name: o.customGraphicOriginalName,
    order_items: (itemsByOrder.get(o.id) || []).map((it) => ({
      id: it.id,
      product_name: it.productName,
      product_sku: it.productSku,
      quantity: it.quantity,
      unit_price: Number(it.unitPrice),
      discount_percent: it.discountPercent,
      line_total: Number(it.lineTotal),
    })),
  }));

  return { orders: data, profileMap };
}

export async function updateOrderStatus(
  orderId: number,
  status: string
): Promise<OrderEmailActionResult> {
  const user = await getUser();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");

  const db = getDb();

  // Fetch order + customer info before updating (needed for email)
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

  // If cancelling, restore stock for all order items
  if (status === "cancelled" && order && order.status !== "cancelled") {
    const items = await db
      .select({ productId: orderItems.productId, quantity: orderItems.quantity })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
    for (const item of items) {
      await db
        .update(products)
        .set({ stockQuantity: sql`${products.stockQuantity} + ${item.quantity}`, updatedAt: new Date() })
        .where(eq(products.id, item.productId));
    }
    await unredeemDiscountCode(orderId);
  }

  await db
    .update(orders)
    .set({ status: status as OrderStatus, updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  let emailResult: OrderEmailActionResult = {
    ok: true,
    emailSent: false,
    emailError: "Ordine non trovato",
  };

  if (order) {
    const { customerEmail, customerName } = await resolveOrderCustomer(db, order);

    if (customerEmail) {
      const sendRes = await sendOrderStatusUpdateEmail({
        orderId,
        customerEmail,
        customerName,
        status,
        trackingNumber: order.trackingNumber,
      });
      emailResult = {
        ok: true,
        emailSent: sendRes.ok,
        emailTo: customerEmail,
        emailError: sendRes.error,
      };
    } else {
      emailResult = {
        ok: true,
        emailSent: false,
        emailError: "Nessuna email cliente associata all'ordine",
      };
    }
  }

  revalidatePath("/admin/orders");
  return emailResult;
}

export async function updateTrackingNumber(
  orderId: number,
  trackingNumber: string
): Promise<OrderEmailActionResult> {
  const user = await getUser();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");

  const db = getDb();
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const trimmed = trackingNumber.trim();
  const previousTracking = (order?.trackingNumber ?? "").trim();

  await db
    .update(orders)
    .set({ trackingNumber: trimmed || null, updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  let emailResult: OrderEmailActionResult = {
    ok: true,
    emailSent: false,
  };

  if (order && trimmed && trimmed !== previousTracking && order.status !== "cancelled") {
    const { customerEmail, customerName } = await resolveOrderCustomer(db, order);
    if (customerEmail) {
      const sendRes = await sendOrderStatusUpdateEmail({
        orderId,
        customerEmail,
        customerName,
        status: order.status,
        trackingNumber: trimmed,
      });
      emailResult = {
        ok: true,
        emailSent: sendRes.ok,
        emailTo: customerEmail,
        emailError: sendRes.error,
      };
    } else {
      emailResult = {
        ok: true,
        emailSent: false,
        emailError: "Nessuna email cliente associata all'ordine",
      };
    }
  }

  revalidatePath("/admin/orders");
  return emailResult;
}

export async function deleteOrder(orderId: number) {
  const user = await getUser();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");

  const db = getDb();

  // Restore stock for all order items before deleting
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (order && order.status !== "cancelled") {
    const items = await db
      .select({ productId: orderItems.productId, quantity: orderItems.quantity })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
    for (const item of items) {
      await db
        .update(products)
        .set({ stockQuantity: sql`${products.stockQuantity} + ${item.quantity}`, updatedAt: new Date() })
        .where(eq(products.id, item.productId));
    }
    await unredeemDiscountCode(orderId);
  }

  // Delete order items first (foreign key constraint)
  await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
  // Delete the order
  await db.delete(orders).where(eq(orders.id, orderId));

  revalidatePath("/admin/orders");
}
