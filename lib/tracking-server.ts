import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { appSettings, orders, orderItems, profiles } from "@/db/schema";
import { formatOrderNumber } from "@/lib/order-number";
import {
  type CarrierCode,
  type CustomTrackingRecord,
  type DetailedTrackingStatus,
  type OrderTrackingMeta,
  type TrackingHistoryEvent,
  type UnifiedTrackingView,
  getTrackingStatusDef,
  resolveCarrierInfo,
} from "@/lib/tracking";

const ORDER_META_KEY = "order_tracking_meta_map";
const CUSTOM_TRACKINGS_KEY = "custom_trackings_list";

export async function getOrderTrackingMetaMap(): Promise<Record<string, OrderTrackingMeta>> {
  try {
    const db = getDb();
    const [row] = await db
      .select({ value: appSettings.value })
      .from(appSettings)
      .where(eq(appSettings.key, ORDER_META_KEY))
      .limit(1);
    if (!row?.value || typeof row.value !== "object") return {};
    return row.value as Record<string, OrderTrackingMeta>;
  } catch {
    return {};
  }
}

export async function saveOrderTrackingMetaMap(
  map: Record<string, OrderTrackingMeta>
): Promise<void> {
  const db = getDb();
  await db
    .insert(appSettings)
    .values({
      key: ORDER_META_KEY,
      value: map,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: {
        value: map,
        updatedAt: new Date(),
      },
    });
}

export async function getCustomTrackingsList(): Promise<CustomTrackingRecord[]> {
  try {
    const db = getDb();
    const [row] = await db
      .select({ value: appSettings.value })
      .from(appSettings)
      .where(eq(appSettings.key, CUSTOM_TRACKINGS_KEY))
      .limit(1);
    const val = row?.value as unknown;
    if (Array.isArray(val)) return val as CustomTrackingRecord[];
    if (val && typeof val === "object" && Array.isArray((val as { items?: unknown }).items)) {
      return (val as { items: CustomTrackingRecord[] }).items;
    }
    return [];
  } catch {
    return [];
  }
}

export async function saveCustomTrackingsList(
  list: CustomTrackingRecord[]
): Promise<void> {
  const db = getDb();
  const payload: Record<string, unknown> = { items: list };
  await db
    .insert(appSettings)
    .values({
      key: CUSTOM_TRACKINGS_KEY,
      value: payload,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: {
        value: payload,
        updatedAt: new Date(),
      },
    });
}

/**
 * Ricava lo stato dettagliato predefinito di un ordine sito se non è ancora stato impostato dall'admin
 */
export function inferOrderDetailedStatus(order: {
  status: string;
  paymentMethod?: string | null;
  paymentStatus?: string;
  customGraphicUrl?: string | null;
  customGraphicDisclaimerAcceptedAt?: Date | string | null;
}): {
  trackingStatus: DetailedTrackingStatus;
  graphicStatus: "not_required" | "pending_upload" | "in_review" | "accepted" | "rejected";
} {
  const hasPrint = !!(order.customGraphicUrl || order.customGraphicDisclaimerAcceptedAt);

  if (order.status === "cancelled") {
    return {
      trackingStatus: "cancelled",
      graphicStatus: hasPrint ? "rejected" : "not_required",
    };
  }
  if (order.status === "delivered") {
    return {
      trackingStatus: "delivered",
      graphicStatus: hasPrint ? "accepted" : "not_required",
    };
  }
  if (order.status === "shipped") {
    return {
      trackingStatus: "shipped",
      graphicStatus: hasPrint ? "accepted" : "not_required",
    };
  }
  if (order.status === "processing") {
    return {
      trackingStatus: "processing",
      graphicStatus: hasPrint ? "accepted" : "not_required",
    };
  }
  if (order.status === "confirmed") {
    if (hasPrint) {
      return {
        trackingStatus: order.customGraphicUrl ? "graphic_review" : "order_received",
        graphicStatus: order.customGraphicUrl ? "in_review" : "pending_upload",
      };
    }
    return {
      trackingStatus: "order_received",
      graphicStatus: "not_required",
    };
  }

  // pending
  if (order.paymentMethod === "bank_transfer" && order.paymentStatus === "pending") {
    return {
      trackingStatus: "awaiting_payment",
      graphicStatus: hasPrint
        ? order.customGraphicUrl
          ? "in_review"
          : "pending_upload"
        : "not_required",
    };
  }

  if (hasPrint && order.customGraphicUrl) {
    return {
      trackingStatus: "graphic_review",
      graphicStatus: "in_review",
    };
  }

  return {
    trackingStatus: "order_received",
    graphicStatus: hasPrint ? "pending_upload" : "not_required",
  };
}

function maskCustomerName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "Cliente";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

/**
 * Cerca un ordine (da sito o extra-sito) tramite codice:
 * - Numero ordine sito: es. "15", "15/A", "#15/A", "ORD-15"
 * - Codice tracking custom extra-sito: es. "BIT-2026-1234", "TRK-..."
 * - Numero di lettera di vettura corriere: es. "1Z999...", "062..."
 */
export async function lookupUnifiedTracking(
  rawQuery: string
): Promise<UnifiedTrackingView | null> {
  const q = rawQuery.trim();
  if (!q) return null;

  const normalizedUpper = q.toUpperCase().replace(/^#/, "").trim();

  // 1) Controlla prima nei custom trackings (extra-sito) per codice o numero spedizione corriere
  const customList = await getCustomTrackingsList();
  const customMatch = customList.find(
    (c) =>
      c.code.toUpperCase() === normalizedUpper ||
      (c.carrierTrackingNumber &&
        c.carrierTrackingNumber.trim().toUpperCase() === normalizedUpper)
  );

  if (customMatch) {
    const carrierInfo = resolveCarrierInfo(
      customMatch.carrier,
      customMatch.carrierTrackingNumber
    );
    return {
      source: "custom_order",
      code: customMatch.code,
      customerName: maskCustomerName(customMatch.customerName),
      customerCompany: customMatch.customerCompany || null,
      createdAt: customMatch.createdAt,
      updatedAt: customMatch.updatedAt,
      trackingStatus: customMatch.trackingStatus,
      graphicStatus: customMatch.graphicStatus,
      graphicNote: customMatch.graphicNote || null,
      supplierPreviewUrl: customMatch.supplierPreviewUrl || null,
      hasCustomPrint: customMatch.hasCustomPrint,
      carrier: carrierInfo.resolvedCode,
      carrierName: carrierInfo.carrierName,
      carrierTrackingNumber: customMatch.carrierTrackingNumber || null,
      carrierDirectUrl: carrierInfo.directUrl,
      externalTools: carrierInfo.externalTools,
      estimatedDelivery: customMatch.estimatedDelivery || null,
      publicNote: customMatch.publicNote || null,
      shippingDestination:
        [customMatch.shippingCity, customMatch.shippingCountry]
          .filter(Boolean)
          .join(", ") || null,
      itemsSummary: customMatch.itemsSummary
        .split(/\n|;/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((line) => ({ name: line, quantity: 1 })),
      totalAmount: customMatch.totalAmount ?? null,
      history:
        customMatch.history && customMatch.history.length > 0
          ? customMatch.history
          : [
              {
                id: "init",
                status: customMatch.trackingStatus,
                title: getTrackingStatusDef(customMatch.trackingStatus).label,
                description: getTrackingStatusDef(customMatch.trackingStatus).description,
                timestamp: customMatch.updatedAt || customMatch.createdAt,
              },
            ],
    };
  }

  // 2) Cerca ordine sito per ID numerico (es. "11", "11/A", "#11/A", "ORD-11") o per trackingNumber corriere
  const db = getDb();
  const idMatch = normalizedUpper
    .replace(/^ORD[-_]?/, "")
    .replace(/\/A$/, "")
    .trim();

  let orderRow: typeof orders.$inferSelect | undefined;

  if (/^\d+$/.test(idMatch)) {
    const numericId = Number.parseInt(idMatch, 10);
    if (Number.isSafeInteger(numericId) && numericId > 0) {
      [orderRow] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, numericId))
        .limit(1);
    }
  }

  if (!orderRow) {
    // Prova a cercare per tracking_number corriere nella tabella orders
    const allOrders = await db.select().from(orders);
    const metaMap = await getOrderTrackingMetaMap();
    orderRow = allOrders.find((o) => {
      if (o.trackingNumber && o.trackingNumber.trim().toUpperCase() === normalizedUpper) {
        return true;
      }
      const m = metaMap[String(o.id)];
      if (
        m?.carrierTrackingNumber &&
        m.carrierTrackingNumber.trim().toUpperCase() === normalizedUpper
      ) {
        return true;
      }
      return false;
    });
  }

  if (!orderRow) return null;

  const metaMap = await getOrderTrackingMetaMap();
  const meta = metaMap[String(orderRow.id)];

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderRow.id));

  const shipping = (orderRow.shippingAddress || {}) as {
    name?: string;
    city?: string;
    province?: string;
    country?: string;
  };
  const billing = (orderRow.billingAddress || {}) as {
    company?: string;
  };

  let customerFullName = shipping.name || "";
  if (!customerFullName && orderRow.userId) {
    const [prof] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, orderRow.userId))
      .limit(1);
    if (prof) {
      customerFullName = [prof.firstName, prof.lastName].filter(Boolean).join(" ");
    }
  }

  const inferred = inferOrderDetailedStatus(orderRow);
  const trackingStatus: DetailedTrackingStatus =
    meta?.trackingStatus || inferred.trackingStatus;
  const graphicStatus = meta?.graphicStatus || inferred.graphicStatus;
  const hasCustomPrint =
    graphicStatus !== "not_required" ||
    !!orderRow.customGraphicUrl ||
    !!orderRow.customGraphicDisclaimerAcceptedAt ||
    items.some((i) => /stampa|print|impression|impresi/i.test(i.productName));

  const effectiveTrackingNumber =
    meta?.carrierTrackingNumber || orderRow.trackingNumber || null;
  const carrierInfo = resolveCarrierInfo(
    meta?.carrier || "auto",
    effectiveTrackingNumber
  );

  const defaultHistory: TrackingHistoryEvent[] = [
    {
      id: `ord-${orderRow.id}-created`,
      status: "order_received",
      title: "Ordine ricevuto",
      description: `Ordine #${formatOrderNumber(orderRow.id)} registrato su Shop NFC Bitora.`,
      timestamp: orderRow.createdAt.toISOString(),
    },
  ];

  if (trackingStatus !== "order_received") {
    const def = getTrackingStatusDef(trackingStatus);
    defaultHistory.unshift({
      id: `ord-${orderRow.id}-current`,
      status: trackingStatus,
      title: def.label,
      description: meta?.publicNote || meta?.graphicNote || def.description,
      timestamp: meta?.updatedAt || orderRow.updatedAt.toISOString(),
    });
  }

  return {
    source: "website_order",
    code: formatOrderNumber(orderRow.id),
    orderId: orderRow.id,
    customerName: maskCustomerName(customerFullName),
    customerCompany: billing.company || null,
    createdAt: orderRow.createdAt.toISOString(),
    updatedAt: meta?.updatedAt || orderRow.updatedAt.toISOString(),
    trackingStatus,
    graphicStatus: hasCustomPrint && graphicStatus === "not_required" ? "in_review" : graphicStatus,
    graphicNote: meta?.graphicNote || orderRow.graphicNote || null,
    supplierPreviewUrl: meta?.supplierPreviewUrl || orderRow.supplierPreviewUrl || null,
    hasCustomPrint,
    carrier: carrierInfo.resolvedCode,
    carrierName: carrierInfo.carrierName,
    carrierTrackingNumber: effectiveTrackingNumber,
    carrierDirectUrl: carrierInfo.directUrl,
    externalTools: carrierInfo.externalTools,
    estimatedDelivery: meta?.estimatedDelivery || null,
    publicNote: meta?.publicNote || null,
    shippingDestination:
      [shipping.city, shipping.province ? `(${shipping.province})` : null, shipping.country]
        .filter(Boolean)
        .join(" ") || null,
    itemsSummary: items.map((i) => ({
      name: i.productName.split("\n")[0],
      quantity: i.quantity,
    })),
    totalAmount: Number(orderRow.total),
    history: meta?.history && meta.history.length > 0 ? meta.history : defaultHistory,
  };
}

export function generateCustomTrackingCode(): string {
  const year = new Date().getFullYear();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 5; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `BIT-${year}-${suffix}`;
}

export type { CarrierCode };
