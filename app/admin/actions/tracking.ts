"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { orders, profiles } from "@/db/schema";
import { getUser } from "@/lib/auth";
import {
  claimStatusEmail,
  releaseStatusEmail,
  sendOrderStatusUpdateEmail,
} from "@/lib/email";
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

function customerEmailFingerprint(parts: {
  status: string;
  trackingNumber?: string | null;
  supplierPreviewUrl?: string | null;
  graphicNote?: string | null;
  publicNote?: string | null;
  estimatedDelivery?: string | null;
}): string {
  return [
    parts.status,
    parts.trackingNumber?.trim() || "",
    parts.supplierPreviewUrl?.trim() || "",
    parts.graphicNote?.trim() || "",
    parts.publicNote?.trim() || "",
    parts.estimatedDelivery?.trim() || "",
  ].join("\u001f");
}

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
  if (!customerEmail && shipping?.email) customerEmail = shipping.email;
  if (!customerName && shipping?.name) customerName = shipping.name;
  if (!customerName && billing?.name) customerName = billing.name;

  const fingerprint = customerEmailFingerprint({
    status: updatedMeta.trackingStatus,
    trackingNumber: updatedMeta.carrierTrackingNumber || order.trackingNumber,
    supplierPreviewUrl: updatedMeta.supplierPreviewUrl,
    graphicNote: updatedMeta.graphicNote,
    publicNote: updatedMeta.publicNote,
    estimatedDelivery: updatedMeta.estimatedDelivery,
  });
  const previousFingerprint = prevMeta
    ? customerEmailFingerprint({
        status: prevMeta.trackingStatus,
        trackingNumber: prevMeta.carrierTrackingNumber || order.trackingNumber,
        supplierPreviewUrl: prevMeta.supplierPreviewUrl,
        graphicNote: prevMeta.graphicNote,
        publicNote: prevMeta.publicNote,
        estimatedDelivery: prevMeta.estimatedDelivery,
      })
    : null;
  const claimKey = `website:${input.orderId}:${fingerprint}`;
  const willEmail =
    input.notifyCustomer !== false &&
    !!customerEmail &&
    fingerprint !== previousFingerprint &&
    prevMeta?.lastEmailFingerprint !== fingerprint &&
    claimStatusEmail(claimKey);

  updatedMeta.lastEmailFingerprint = willEmail
    ? fingerprint
    : (prevMeta?.lastEmailFingerprint ?? null);
  updatedMeta.lastEmailedAt = willEmail ? nowIso : (prevMeta?.lastEmailedAt ?? null);

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

  if (willEmail) {
    const sendRes = await sendOrderStatusUpdateEmail({
      orderId: input.orderId,
      customerEmail,
      customerName: customerName || "Cliente",
      status: input.trackingStatus,
      trackingNumber: input.carrierTrackingNumber?.trim() || order.trackingNumber,
      supplierPreviewUrl: updatedMeta.supplierPreviewUrl,
      graphicNote: updatedMeta.graphicNote,
      publicNote: updatedMeta.publicNote,
      estimatedDelivery: updatedMeta.estimatedDelivery,
    });
    if (!sendRes.ok) {
      releaseStatusEmail(claimKey);
      updatedMeta.lastEmailFingerprint = prevMeta?.lastEmailFingerprint ?? null;
      updatedMeta.lastEmailedAt = prevMeta?.lastEmailedAt ?? null;
      metaMap[String(input.orderId)] = updatedMeta;
      await saveOrderTrackingMetaMap(metaMap);
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
  notifyCustomer?: boolean;
}) {
  const user = await getUser();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");

  const list = await getCustomTrackingsList();
  const nowIso = new Date().toISOString();
  const cleanCode = input.code?.trim().toUpperCase() || generateCustomTrackingCode();
  const existingIdx = list.findIndex((c) => c.code.toUpperCase() === cleanCode);
  const previousSnapshot = existingIdx >= 0 ? list[existingIdx] : null;
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

  let savedRecord: CustomTrackingRecord;

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
    savedRecord = updated;
  } else {
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
    savedRecord = created;
  }

  const fingerprint = customerEmailFingerprint({
    status: savedRecord.trackingStatus,
    trackingNumber: savedRecord.carrierTrackingNumber,
    supplierPreviewUrl: savedRecord.supplierPreviewUrl,
    graphicNote: savedRecord.graphicNote,
    publicNote: savedRecord.publicNote,
    estimatedDelivery: savedRecord.estimatedDelivery,
  });
  const previousFingerprint = previousSnapshot
    ? customerEmailFingerprint({
        status: previousSnapshot.trackingStatus,
        trackingNumber: previousSnapshot.carrierTrackingNumber,
        supplierPreviewUrl: previousSnapshot.supplierPreviewUrl,
        graphicNote: previousSnapshot.graphicNote,
        publicNote: previousSnapshot.publicNote,
        estimatedDelivery: previousSnapshot.estimatedDelivery,
      })
    : null;
  const claimKey = `custom:${savedRecord.code}:${fingerprint}`;
  const willEmail =
    input.notifyCustomer !== false &&
    !!savedRecord.customerEmail &&
    fingerprint !== previousFingerprint &&
    previousSnapshot?.lastEmailFingerprint !== fingerprint &&
    claimStatusEmail(claimKey);

  if (willEmail) {
    savedRecord.lastEmailFingerprint = fingerprint;
    savedRecord.lastEmailedAt = nowIso;
  }

  await saveCustomTrackingsList(list);

  if (willEmail && savedRecord.customerEmail) {
    const sendRes = await sendOrderStatusUpdateEmail({
      trackingCode: savedRecord.code,
      customerEmail: savedRecord.customerEmail,
      customerName: savedRecord.customerName,
      customerCompany: savedRecord.customerCompany,
      status: savedRecord.trackingStatus,
      trackingNumber: savedRecord.carrierTrackingNumber,
      itemsSummary: savedRecord.itemsSummary,
      totalAmount: savedRecord.totalAmount,
      supplierPreviewUrl: savedRecord.supplierPreviewUrl,
      graphicNote: savedRecord.graphicNote,
      publicNote: savedRecord.publicNote,
      estimatedDelivery: savedRecord.estimatedDelivery,
    });
    if (!sendRes.ok) {
      releaseStatusEmail(claimKey);
      savedRecord.lastEmailFingerprint = previousSnapshot?.lastEmailFingerprint ?? null;
      savedRecord.lastEmailedAt = previousSnapshot?.lastEmailedAt ?? null;
      await saveCustomTrackingsList(list);
    }
  }

  revalidatePath("/admin/tracking");
  revalidatePath("/tracking");
  return savedRecord;
}

export async function sendCustomTrackingEmail(code: string) {
  const user = await getUser();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");

  const list = await getCustomTrackingsList();
  const record = list.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
  if (!record) return { ok: false, error: "Tracking non trovato" };
  if (!record.customerEmail) return { ok: false, error: "Nessuna email associata al cliente" };

  return sendOrderStatusUpdateEmail({
    trackingCode: record.code,
    customerEmail: record.customerEmail,
    customerName: record.customerName,
    customerCompany: record.customerCompany,
    status: record.trackingStatus,
    trackingNumber: record.carrierTrackingNumber,
    itemsSummary: record.itemsSummary,
    totalAmount: record.totalAmount,
    supplierPreviewUrl: record.supplierPreviewUrl,
    graphicNote: record.graphicNote,
    publicNote: record.publicNote,
    estimatedDelivery: record.estimatedDelivery,
  });
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
