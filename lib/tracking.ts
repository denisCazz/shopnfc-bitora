/**
 * Sistema di Tracking Ordini — Shop NFC Bitora
 *
 * Supporta:
 * 1) Stati dettagliati di ordine, verifica grafica del fornitore, produzione/programmazione NFC e corriere.
 * 2) Integrazione con corrieri (BRT, GLS, DHL, SDA/Poste Italiane, UPS, FedEx, TNT, InPost) e
 *    strumenti gratuiti universali di tracking (17TRACK, ParcelsApp, AfterShip).
 * 3) Sia ordini provenienti dal sito (tabella `orders`) sia ordini extra-sito
 *    creati manualmente dall'Admin (clienti WhatsApp, email, telefono).
 */

export type DetailedTrackingStatus =
  | "order_received"        // Ordine ricevuto
  | "awaiting_payment"      // In attesa di pagamento / verifica bonifico
  | "graphic_review"        // Grafica in revisione presso il fornitore
  | "graphic_accepted"      // Grafica accettata dal fornitore
  | "graphic_rejected"      // Grafica rifiutata (richiesto nuovo file)
  | "processing"            // In produzione / Stampa e programmazione NFC
  | "quality_check"         // Controllo qualità e collaudo chip NFC
  | "ready_to_ship"         // Pronto per la spedizione
  | "shipped"               // Affidato al corriere
  | "in_transit"            // In transito presso il corriere
  | "out_for_delivery"      // In consegna oggi
  | "delivered"             // Consegnato
  | "exception"             // Giacenza / Problema di consegna
  | "cancelled";            // Annullato

export type CarrierCode =
  | "auto"
  | "brt"
  | "gls"
  | "dhl"
  | "sda"
  | "poste"
  | "ups"
  | "fedex"
  | "tnt"
  | "inpost"
  | "other";

export interface TrackingHistoryEvent {
  id: string;
  status: DetailedTrackingStatus;
  title: string;
  description?: string;
  location?: string;
  timestamp: string; // ISO string
}

export interface OrderTrackingMeta {
  orderId: number;
  trackingStatus: DetailedTrackingStatus;
  carrier: CarrierCode;
  carrierTrackingNumber?: string | null;
  graphicStatus?: "not_required" | "pending_upload" | "in_review" | "accepted" | "rejected";
  graphicNote?: string | null;
  estimatedDelivery?: string | null;
  publicNote?: string | null;
  updatedAt: string;
  history: TrackingHistoryEvent[];
}

export interface CustomTrackingRecord {
  /** Codice univoco condivisibile col cliente, es. "BIT-2026-8492" */
  code: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerCompany?: string | null;
  /** canale di origine: whatsapp, email, telefono, fiera, b2b */
  channel: "whatsapp" | "email" | "phone" | "b2b" | "other";
  itemsSummary: string;
  totalAmount?: number | null;
  hasCustomPrint: boolean;
  trackingStatus: DetailedTrackingStatus;
  graphicStatus: "not_required" | "pending_upload" | "in_review" | "accepted" | "rejected";
  graphicNote?: string | null;
  carrier: CarrierCode;
  carrierTrackingNumber?: string | null;
  estimatedDelivery?: string | null;
  shippingCity?: string | null;
  shippingCountry?: string | null;
  publicNote?: string | null;
  internalNote?: string | null;
  createdAt: string;
  updatedAt: string;
  history: TrackingHistoryEvent[];
}

export interface UnifiedTrackingView {
  source: "website_order" | "custom_order";
  code: string;
  orderId?: number;
  customerName: string;
  customerCompany?: string | null;
  createdAt: string;
  updatedAt: string;
  trackingStatus: DetailedTrackingStatus;
  graphicStatus: "not_required" | "pending_upload" | "in_review" | "accepted" | "rejected";
  graphicNote?: string | null;
  hasCustomPrint: boolean;
  carrier: CarrierCode;
  carrierName: string;
  carrierTrackingNumber?: string | null;
  carrierDirectUrl?: string | null;
  externalTools: {
    track17Url: string;
    parcelsAppUrl: string;
    afterShipUrl: string;
  } | null;
  estimatedDelivery?: string | null;
  publicNote?: string | null;
  shippingDestination?: string | null;
  itemsSummary: {
    name: string;
    quantity: number;
  }[];
  totalAmount?: number | null;
  history: TrackingHistoryEvent[];
}

export interface TrackingStatusDefinition {
  value: DetailedTrackingStatus;
  label: string;
  shortLabel: string;
  description: string;
  category: "order" | "graphic" | "production" | "carrier" | "issue";
  badgeColor: string;
  stepIndex: number; // 0..5 per la barra di avanzamento
}

export const TRACKING_STATUSES: TrackingStatusDefinition[] = [
  {
    value: "order_received",
    label: "Ordine ricevuto",
    shortLabel: "Ricevuto",
    description: "Abbiamo ricevuto la tua richiesta d'ordine e registrato i dettagli nei nostri sistemi.",
    category: "order",
    badgeColor: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
    stepIndex: 1,
  },
  {
    value: "awaiting_payment",
    label: "In attesa di pagamento / verifica bonifico",
    shortLabel: "Attesa pagamento",
    description: "In attesa dell'accredito del pagamento o della verifica della contabile bancaria.",
    category: "order",
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    stepIndex: 1,
  },
  {
    value: "graphic_review",
    label: "Grafica in revisione (verifica fornitore)",
    shortLabel: "Grafica in revisione",
    description:
      "Il file grafico è in fase di verifica tecnica presso il nostro fornitore di stampa. Ricordiamo che l'accettazione definitiva dell'ordine è subordinata all'approvazione della grafica da parte del fornitore.",
    category: "graphic",
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    stepIndex: 2,
  },
  {
    value: "graphic_accepted",
    label: "Grafica accettata dal fornitore",
    shortLabel: "Grafica accettata",
    description:
      "Il nostro fornitore ha verificato e accettato il file grafico definitivo. L'ordine è confermato e pronto per la stampa.",
    category: "graphic",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    stepIndex: 2,
  },
  {
    value: "graphic_rejected",
    label: "Grafica rifiutata — richiesta modifica",
    shortLabel: "Grafica rifiutata",
    description:
      "Il fornitore di stampa ha riscontrato problemi tecnici sul file grafico (es. risoluzione insufficiente, margini o formato non idoneo). Invia un nuovo file conforme per sbloccare l'ordine.",
    category: "issue",
    badgeColor: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    stepIndex: 2,
  },
  {
    value: "processing",
    label: "In produzione (stampa e programmazione NFC)",
    shortLabel: "In produzione",
    description: "I tuoi supporti NFC sono in fase di stampa e codifica nel nostro laboratorio.",
    category: "production",
    badgeColor: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
    stepIndex: 3,
  },
  {
    value: "quality_check",
    label: "Controllo qualità e collaudo chip NFC",
    shortLabel: "Controllo qualità",
    description: "Ogni lotto viene testato per verificare la lettura dei chip NFC e la resa di stampa.",
    category: "production",
    badgeColor: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
    stepIndex: 3,
  },
  {
    value: "ready_to_ship",
    label: "Pronto per la spedizione",
    shortLabel: "Pronto a partire",
    description: "Il pacco è imballato ed etichettato, in attesa di presa in carico da parte del corriere.",
    category: "carrier",
    badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
    stepIndex: 4,
  },
  {
    value: "shipped",
    label: "Spedito / Affidato al corriere",
    shortLabel: "Spedito",
    description: "La spedizione è stata affidata al corriere espresso.",
    category: "carrier",
    badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
    stepIndex: 4,
  },
  {
    value: "in_transit",
    label: "In transito presso il corriere",
    shortLabel: "In transito",
    description: "Il pacco è in viaggio tra gli hub logistici del corriere verso la tua zona.",
    category: "carrier",
    badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
    stepIndex: 4,
  },
  {
    value: "out_for_delivery",
    label: "In consegna oggi",
    shortLabel: "In consegna",
    description: "Il corriere è in uscita per la consegna all'indirizzo indicato.",
    category: "carrier",
    badgeColor: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
    stepIndex: 4,
  },
  {
    value: "delivered",
    label: "Consegnato",
    shortLabel: "Consegnato",
    description: "La spedizione risulta consegnata al destinatario. Grazie per aver scelto Shop NFC Bitora!",
    category: "carrier",
    badgeColor: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    stepIndex: 5,
  },
  {
    value: "exception",
    label: "Giacenza / Eccezione corriere",
    shortLabel: "Giacenza / Avviso",
    description: "Il corriere ha segnalato un imprevisto (es. destinatario assente o indirizzo da verificare). Contattaci per assistenza.",
    category: "issue",
    badgeColor: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
    stepIndex: 4,
  },
  {
    value: "cancelled",
    label: "Ordine annullato",
    shortLabel: "Annullato",
    description: "L'ordine è stato annullato.",
    category: "issue",
    badgeColor: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    stepIndex: 0,
  },
];

export function getTrackingStatusDef(status: DetailedTrackingStatus | string): TrackingStatusDefinition {
  const found = TRACKING_STATUSES.find((s) => s.value === status);
  if (found) return found;
  // Map legacy OrderStatus to DetailedTrackingStatus
  switch (status) {
    case "pending":
      return TRACKING_STATUSES[0]; // order_received
    case "confirmed":
      return TRACKING_STATUSES[0];
    case "processing":
      return TRACKING_STATUSES.find((s) => s.value === "processing")!;
    case "shipped":
      return TRACKING_STATUSES.find((s) => s.value === "shipped")!;
    case "delivered":
      return TRACKING_STATUSES.find((s) => s.value === "delivered")!;
    case "cancelled":
      return TRACKING_STATUSES.find((s) => s.value === "cancelled")!;
    default:
      return TRACKING_STATUSES[0];
  }
}

export function mapDetailedToBaseOrderStatus(
  detailed: DetailedTrackingStatus
): "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" {
  switch (detailed) {
    case "order_received":
    case "awaiting_payment":
    case "graphic_review":
    case "graphic_rejected":
      return "pending";
    case "graphic_accepted":
      return "confirmed";
    case "processing":
    case "quality_check":
    case "ready_to_ship":
      return "processing";
    case "shipped":
    case "in_transit":
    case "out_for_delivery":
    case "exception":
      return "shipped";
    case "delivered":
      return "delivered";
    case "cancelled":
      return "cancelled";
  }
}

export const CARRIERS: {
  code: CarrierCode;
  name: string;
  buildUrl: (trackingNumber: string) => string | null;
}[] = [
  {
    code: "auto",
    name: "Rilevamento automatico corriere",
    buildUrl: () => null,
  },
  {
    code: "brt",
    name: "BRT Corriere Espresso",
    buildUrl: (n) =>
      `https://vas.brt.it/vas/sped_det_show.hsm?chisono=${encodeURIComponent(n.trim())}`,
  },
  {
    code: "gls",
    name: "GLS Italy",
    buildUrl: (n) =>
      `https://gls-group.com/IT/it/servizi-online/ricerca-spedizioni.html?match=${encodeURIComponent(n.trim())}&type=NAT`,
  },
  {
    code: "dhl",
    name: "DHL Express",
    buildUrl: (n) =>
      `https://www.dhl.com/it-it/home/tracciabilita.html?tracking-id=${encodeURIComponent(n.trim())}&submit=1`,
  },
  {
    code: "sda",
    name: "SDA Express Courier",
    buildUrl: (n) =>
      `https://www.sda.it/wps/portal/Servizi_online/dettaglio-spedizione?locale=it&tracing.letteraVettura=${encodeURIComponent(n.trim())}`,
  },
  {
    code: "poste",
    name: "Poste Italiane / Crono",
    buildUrl: (n) =>
      `https://www.poste.it/cerca/index.html#/risultati-spedizioni/${encodeURIComponent(n.trim())}`,
  },
  {
    code: "ups",
    name: "UPS",
    buildUrl: (n) =>
      `https://www.ups.com/track?loc=it_IT&tracknum=${encodeURIComponent(n.trim())}`,
  },
  {
    code: "fedex",
    name: "FedEx",
    buildUrl: (n) =>
      `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n.trim())}`,
  },
  {
    code: "tnt",
    name: "TNT Italy",
    buildUrl: (n) =>
      `https://www.tnt.it/tracking/Tracking.do?cons=${encodeURIComponent(n.trim())}`,
  },
  {
    code: "inpost",
    name: "InPost",
    buildUrl: (n) =>
      `https://inpost.it/trova-il-tuo-pacco?number=${encodeURIComponent(n.trim())}`,
  },
  {
    code: "other",
    name: "Altro Corriere",
    buildUrl: () => null,
  },
];

/**
 * Rileva automaticamente il corriere dal formato del codice di tracciamento
 */
export function detectCarrierFromNumber(raw?: string | null): CarrierCode {
  if (!raw) return "other";
  const clean = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (!clean) return "other";
  if (/^1Z[0-9A-Z]{16}$/.test(clean)) return "ups";
  if (/^[0-9]{10}$/.test(clean) || /^JJD[0-9]+$/.test(clean)) return "dhl";
  if (/^[0-9]{12}$/.test(clean) && clean.startsWith("0")) return "brt";
  if (/^[A-Z]{2}[0-9]{9}[A-Z]{2}$/.test(clean)) return "poste";
  if (/^[0-9]{13}$/.test(clean)) return "sda";
  if (/^[A-Z]{1,2}[0-9]{8,11}$/.test(clean)) return "gls";
  return "other";
}

export function resolveCarrierInfo(
  carrier: CarrierCode | undefined | null,
  trackingNumber?: string | null
): {
  resolvedCode: CarrierCode;
  carrierName: string;
  directUrl: string | null;
  externalTools: {
    track17Url: string;
    parcelsAppUrl: string;
    afterShipUrl: string;
  } | null;
} {
  const num = trackingNumber?.trim() || "";
  const effectiveCode: CarrierCode =
    !carrier || carrier === "auto"
      ? num
        ? detectCarrierFromNumber(num)
        : "auto"
      : carrier;

  const def = CARRIERS.find((c) => c.code === effectiveCode) || CARRIERS[0];

  if (!num) {
    return {
      resolvedCode: effectiveCode,
      carrierName: effectiveCode === "auto" ? "Corriere Espresso" : def.name,
      directUrl: null,
      externalTools: null,
    };
  }

  const encoded = encodeURIComponent(num);
  const externalTools = {
    track17Url: `https://t.17track.net/it#nums=${encoded}`,
    parcelsAppUrl: `https://parcelsapp.com/it/tracking/${encoded}`,
    afterShipUrl: `https://www.aftership.com/track/${encoded}`,
  };

  return {
    resolvedCode: effectiveCode,
    carrierName: effectiveCode === "auto" || effectiveCode === "other" ? "Corriere Espresso" : def.name,
    directUrl: def.buildUrl(num) || externalTools.track17Url,
    externalTools,
  };
}
