import { redirect } from "next/navigation";
import { desc, eq, inArray } from "drizzle-orm";
import { getUser } from "@/lib/auth";
import { getDb } from "@/db";
import { orders, orderItems } from "@/db/schema";
import OrdersListClient from "./OrdersListClient";

import { SITE } from "@/lib/site";

export const metadata = {
  title: `I miei ordini | ${SITE.name}`,
};

export default async function MyOrdersPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const db = getDb();
  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt));

  const oids = userOrders.map((o) => o.id);
  const itemRows =
    oids.length > 0
      ? await db
          .select()
          .from(orderItems)
          .where(inArray(orderItems.orderId, oids))
      : [];
  const byOrder = new Map<number, typeof itemRows>();
  for (const it of itemRows) {
    const list = byOrder.get(it.orderId) || [];
    list.push(it);
    byOrder.set(it.orderId, list);
  }

  const orderPayload = userOrders.map((o) => {
    const sa = o.shippingAddress as Record<string, unknown>;
    const shippingAddress: Record<string, string> = {};
    for (const [k, v] of Object.entries(sa)) {
      if (v != null) shippingAddress[k] = String(v);
    }
    return {
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
    shipping_address: shippingAddress,
    tracking_number: o.trackingNumber,
    bank_transfer_receipt_url: o.bankTransferReceiptUrl,
    custom_graphic_url: o.customGraphicUrl,
    custom_graphic_original_name: o.customGraphicOriginalName,
    order_items: (byOrder.get(o.id) || []).map((it) => ({
      id: it.id,
      product_name: it.productName,
      product_sku: it.productSku,
      quantity: it.quantity,
      unit_price: Number(it.unitPrice),
      discount_percent: it.discountPercent,
      line_total: Number(it.lineTotal),
    })),
  };
  });

  return <OrdersListClient orders={orderPayload} />;
}
