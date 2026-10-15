"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { orders, profiles } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { sendOrderStatusUpdateEmail } from "@/lib/email";
import {
  type CarrierCode,
  type CustomTrackingRecord,
  type DetailedTrackingStatus,
  type OrderTrackingMeta,
  getTrackingStatusDef,
  mapDetailedToBaseOrderStatus,
} from "@/lib/tracking";
import {
  generateCustomTrackingCode,
  getCustomTrackingsList,
  getOrderTrackingMetaMap,
  saveCustomTrackingsList,
  saveOrderTrackingMetaMap,
} from "@/lib/tracking-server";

export async function updateWebsiteOrderTracking(input: {
  orderId: number;
  trackingStatus: DetailedTrackingStatus;
  carrier: CarrierCode;
  carrierTrackingNumber?: string | null;
  graphicStatus?: "not_required" | "pending_upload" | "in_review" | "preview_sent" | "accepted" | "rejected";
  graphicNote?: string | null;
  supplierPreviewUrl?: string | null;
  estimatedDelivery?: string | null;
  publicNote?: string | null;
  notifyCustomer?: boolean;
}) {
  const user = await getUser();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");

  const db = getDb();
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, input.orderId))
    .limit(1);

  if (!order) throw new Error("Ordine non trovato");

  const metaMap = await getOrderTrackingMetaMap();
  const prevMeta = metaMap[String(input.orderId)];
  const nowIso = new Date().toISOString();
  const statusDef = getTrackingStatusDef(input.trackingStatus);

  const prevHistory = prevMeta?.history || [
    {
      id: `ord-${input.orderId}-init`,
      status: "order_received" as DetailedTrackingStatus,
      title: "Ordine ricevuto",
      description: "Ordine registrato su Shop NFC Bitora.",
      timestamp: order.createdAt.toISOString(),
    },
  ];

  const statusChanged = !prevMeta || prevMeta.trackingStatus !== input.trackingStatus;
  const noteChanged =
    (input.publicNote && input.publicNote !== prevMeta?.publicNote) ||
    (input.graphicNote && input.graphicNote !== prevMeta?.graphicNote) ||
    (input.supplierPreviewUrl && input.supplierPreviewUrl !== prevMeta?.supplierPreviewUrl);

  const nextHistory =
    statusChanged || noteChanged
      ? [
          {
            id: `ev-${Date.now()}`,
            status: input.trackingStatus,
            title: statusDef.label,
            description:
              input.publicNote?.trim() ||
              input.graphicNote?.trim() ||
              statusDef.description,
            timestamp: nowIso,
          },
          ...prevHistory,
        ]
      : prevHistory;

  const autoGraphicStatus: OrderTrackingMeta["graphicStatus"] =
    input.trackingStatus === "graphic_review"
      ? "in_review"
      : input.trackingStatus === "preview_sent"
        ? "preview_sent"
        : input.trackingStatus === "graphic_accepted"
          ? "accepted"
          : input.trackingStatus === "graphic_rejected"
            ? "rejected"
            : input.graphicStatus || prevMeta?.graphicStatus || "not_required";

  const updatedMeta: OrderTrackingMeta = {
    orderId: input.orderId,
    trackingStatus: input.trackingStatus,
    carrier: input.carrier,
    carrierTrackingNumber: input.carrierTrackingNumber?.trim() || null,
    graphicStatus: autoGraphicStatus,
    graphicNote: input.graphicNote?.trim() || null,
    supplierPreviewUrl: input.supplierPreviewUrl?.trim() || prevMeta?.supplierPreviewUrl || null,
    estimatedDelivery: input.estimatedDelivery?.trim() || null,
    publicNote: input.publicNote?.trim() || null,
    updatedAt: nowIso,
    history: nextHistory,
  };

  metaMap[String(input.orderId)] = updatedMeta;
  await saveOrderTrackingMetaMap(metaMap);

  const baseOrderStatus = mapDetailedToBaseOrderStatus(input.trackingStatus);
  await db
    .update(orders)
    .set({
      status: baseOrderStatus,
      trackingNumber: input.carrierTrackingNumber?.trim() || order.trackingNumber,
      trackingStatus: input.trackingStatus,
      trackingCarrier: input.carrier,
      graphicStatus: autoGraphicStatus,
      graphicNote: updatedMeta.graphicNote,
      supplierPreviewUrl: updatedMeta.supplierPreviewUrl,
      estimatedDelivery: updatedMeta.estimatedDelivery,
      publicTrackingNote: updatedMeta.publicNote,
      trackingHistory: nextHistory as unknown as Record<string, unknown>[],
      updatedAt: new Date(),
    })
    .where(eq(orders.id, input.orderId));

  if (input.notifyCustomer !== false && statusChanged) {
    let customerEmail = order.guestEmail ?? "";
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
        customerEmail = prof.email ?? customerEmail;
        customerName = [prof.firstName, prof.lastName].filter(Boolean).join(" ");
      }
    }
    if (!customerEmail && billing?.email) customerEmail = billing.email;
    if (!customerName && shipping?.name) customerName = shipping.name;

    if (customerEmail) {
      await sendOrderStatusUpdateEmail({
        orderId: input.orderId,
        customerEmail,
        customerName: customerName || "Cliente",
        status: input.trackingStatus,
        trackingNumber: input.carrierTrackingNumber?.trim() || order.trackingNumber,
      });
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin/tracking");
  revalidatePath("/tracking");
  return updatedMeta;
}

export async function createOrUpdateCustomTracking(input: {
  code?: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerCompany?: string | null;
  channel: "whatsapp" | "email" | "phone" | "b2b" | "other";
  itemsSummary: string;
  totalAmount?: number | null;
  hasCustomPrint: boolean;
  trackingStatus: DetailedTrackingStatus;
  graphicStatus?: "not_required" | "pending_upload" | "in_review" | "preview_sent" | "accepted" | "rejected";
  graphicNote?: string | null;
  supplierPreviewUrl?: string | null;
  carrier: CarrierCode;
  carrierTrackingNumber?: string | null;
  estimatedDelivery?: string | null;
  shippingCity?: string | null;
  shippingCountry?: string | null;
  publicNote?: string | null;
  internalNote?: string | null;
}) {
  const user = await getUser();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");

  const list = await getCustomTrackingsList();
  const nowIso = new Date().toISOString();
  const cleanCode = input.code?.trim().toUpperCase() || generateCustomTrackingCode();
  const existingIdx = list.findIndex((c) => c.code.toUpperCase() === cleanCode);
  const statusDef = getTrackingStatusDef(input.trackingStatus);

  const autoGraphicStatus: CustomTrackingRecord["graphicStatus"] =
    input.trackingStatus === "graphic_review"
      ? "in_review"
      : input.trackingStatus === "preview_sent"
        ? "preview_sent"
        : input.trackingStatus === "graphic_accepted"
          ? "accepted"
          : input.trackingStatus === "graphic_rejected"
            ? "rejected"
            : input.graphicStatus ||
              (input.hasCustomPrint ? "in_review" : "not_required");

  if (existingIdx >= 0) {
    const prev = list[existingIdx];
    const statusChanged = prev.trackingStatus !== input.trackingStatus;
    const noteChanged =
      (input.publicNote && input.publicNote !== prev.publicNote) ||
      (input.graphicNote && input.graphicNote !== prev.graphicNote) ||
      (input.supplierPreviewUrl && input.supplierPreviewUrl !== prev.supplierPreviewUrl);

    const nextHistory =
      statusChanged || noteChanged
        ? [
            {
              id: `ev-${Date.now()}`,
              status: input.trackingStatus,
              title: statusDef.label,
              description:
                input.publicNote?.trim() ||
                input.graphicNote?.trim() ||
                statusDef.description,
              timestamp: nowIso,
            },
            ...(prev.history || []),
          ]
        : prev.history || [];

    const updated: CustomTrackingRecord = {
      ...prev,
      customerName: input.customerName.trim(),
      customerEmail: input.customerEmail?.trim() || null,
      customerPhone: input.customerPhone?.trim() || null,
      customerCompany: input.customerCompany?.trim() || null,
      channel: input.channel,
      itemsSummary: input.itemsSummary.trim(),
      totalAmount: input.totalAmount ?? null,
      hasCustomPrint: input.hasCustomPrint,
      trackingStatus: input.trackingStatus,
      graphicStatus: autoGraphicStatus,
      graphicNote: input.graphicNote?.trim() || null,
      supplierPreviewUrl: input.supplierPreviewUrl?.trim() || null,
      carrier: input.carrier,
      carrierTrackingNumber: input.carrierTrackingNumber?.trim() || null,
      estimatedDelivery: input.estimatedDelivery?.trim() || null,
      shippingCity: input.shippingCity?.trim() || null,
      shippingCountry: input.shippingCountry?.trim() || "Italia",
      publicNote: input.publicNote?.trim() || null,
      internalNote: input.internalNote?.trim() || null,
      updatedAt: nowIso,
      history: nextHistory,
    };

    list[existingIdx] = updated;
    await saveCustomTrackingsList(list);
    revalidatePath("/admin/tracking");
    revalidatePath("/tracking");
    return updated;
  }

  const created: CustomTrackingRecord = {
    code: cleanCode,
    customerName: input.customerName.trim(),
    customerEmail: input.customerEmail?.trim() || null,
    customerPhone: input.customerPhone?.trim() || null,
    customerCompany: input.customerCompany?.trim() || null,
    channel: input.channel,
    itemsSummary: input.itemsSummary.trim() || "Fornitura Tag / Tessere NFC",
    totalAmount: input.totalAmount ?? null,
    hasCustomPrint: input.hasCustomPrint,
    trackingStatus: input.trackingStatus,
    graphicStatus: autoGraphicStatus,
    graphicNote: input.graphicNote?.trim() || null,
    supplierPreviewUrl: input.supplierPreviewUrl?.trim() || null,
    carrier: input.carrier,
    carrierTrackingNumber: input.carrierTrackingNumber?.trim() || null,
    estimatedDelivery: input.estimatedDelivery?.trim() || null,
    shippingCity: input.shippingCity?.trim() || null,
    shippingCountry: input.shippingCountry?.trim() || "Italia",
    publicNote: input.publicNote?.trim() || null,
    internalNote: input.internalNote?.trim() || null,
    createdAt: nowIso,
    updatedAt: nowIso,
    history: [
      {
        id: `ev-${Date.now()}`,
        status: input.trackingStatus,
        title: statusDef.label,
        description:
          input.publicNote?.trim() ||
          input.graphicNote?.trim() ||
          statusDef.description,
        timestamp: nowIso,
      },
    ],
  };

  list.unshift(created);
  await saveCustomTrackingsList(list);
  revalidatePath("/admin/tracking");
  revalidatePath("/tracking");
  return created;
}

export async function deleteCustomTracking(code: string) {
  const user = await getUser();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");

  const list = await getCustomTrackingsList();
  const next = list.filter((c) => c.code.toUpperCase() !== code.trim().toUpperCase());
  await saveCustomTrackingsList(next);
  revalidatePath("/admin/tracking");
  revalidatePath("/tracking");
}
