"use server";

import { desc, eq, and, inArray, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, orderItems, profiles, products } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@/lib/types";
import { sendOrderStatusUpdateEmail } from "@/lib/email";

export async function getOrders(filters?: {
  status?: string;
  daneaExported?: boolean;
}) {
  const user = await getUser();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");

  const db = getDb();
  const conds: SQL[] = [];
  if (filters?.status && filters.status !== "all") {
    conds.push(eq(orders.status, filters.status as OrderStatus));
  }
  if (filters?.daneaExported !== undefined) {
    conds.push(eq(orders.daneaExported, filters.daneaExported));
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
    total: Number(o.total),
    shipping_address: o.shippingAddress as Record<string, unknown>,
    billing_address: o.billingAddress as Record<string, unknown>,
    guest_email: o.guestEmail,
    user_id: o.userId,
    notes: o.notes,
    danea_exported: o.daneaExported,
    tracking_number: o.trackingNumber,
    bank_transfer_receipt_url: o.bankTransferReceiptUrl,
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

export async function updateOrderStatus(orderId: number, status: string) {
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
  }

  await db
    .update(orders)
    .set({ status: status as OrderStatus, updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  // Resolve customer email and name
  if (order) {
    let customerEmail = order.guestEmail ?? "";
    let customerName = "";

    const billing = order.billingAddress as Record<string, string> | null;
    const shipping = order.shippingAddress as Record<string, string> | null;

    if (order.userId) {
      const [prof] = await db.select().from(profiles).where(eq(profiles.id, order.userId)).limit(1);
      if (prof) {
        customerEmail = prof.email ?? customerEmail;
        customerName = [prof.firstName, prof.lastName].filter(Boolean).join(" ");
      }
    }

    if (!customerEmail && billing?.email) customerEmail = billing.email;
    if (!customerName && shipping?.name) customerName = shipping.name;

    if (customerEmail) {
      await sendOrderStatusUpdateEmail({
        orderId,
        customerEmail,
        customerName: customerName || "Cliente",
        status,
        trackingNumber: order.trackingNumber,
      });
    }
  }

  revalidatePath("/admin/orders");
}

export async function updateTrackingNumber(
  orderId: number,
  trackingNumber: string
) {
  const user = await getUser();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");

  const db = getDb();
  await db
    .update(orders)
    .set({ trackingNumber, updatedAt: new Date() })
    .where(eq(orders.id, orderId));
  revalidatePath("/admin/orders");
}

export async function resetDaneaExport(orderId: number) {
  const user = await getUser();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");

  const db = getDb();
  await db
    .update(orders)
    .set({ daneaExported: false, updatedAt: new Date() })
    .where(eq(orders.id, orderId));
  revalidatePath("/admin/orders");
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
  }

  // Delete order items first (foreign key constraint)
  await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
  // Delete the order
  await db.delete(orders).where(eq(orders.id, orderId));

  revalidatePath("/admin/orders");
}
