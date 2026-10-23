"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  Truck,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Edit3,
  MessageCircle,
  Package,
  FileCheck2,
  FileWarning,
  Clock,
  CheckCircle2,
  Search,
  Sparkles,
  ImageIcon,
  Save,
  X,
  Mail,
} from "lucide-react";
import {
  CARRIERS,
  TRACKING_STATUSES,
  type CarrierCode,
  type CustomTrackingRecord,
  type DetailedTrackingStatus,
  type OrderTrackingMeta,
  getTrackingStatusDef,
  resolveCarrierInfo,
} from "@/lib/tracking";
import {
  createOrUpdateCustomTracking,
  deleteCustomTracking,
  sendCustomTrackingEmail,
  updateWebsiteOrderTracking,
} from "@/app/admin/actions/tracking";
import { formatOrderNumber } from "@/lib/order-number";

interface WebsiteOrderRow {
  id: number;
  created_at: string;
  status: string;
  payment_method: string | null;
  payment_status: string;
  total: number;
  shipping_address: Record<string, unknown>;
  billing_address: Record<string, unknown>;
  guest_email: string | null;
  user_id: string | null;
  tracking_number: string | null;
  custom_graphic_url: string | null;
  custom_graphic_original_name: string | null;
}

interface ProfileInfo {
  email: string;
  first_name: string | null;
  last_name: string | null;
}

const QUICK_STATUSES: {
  key: DetailedTrackingStatus;
  shortLabel: string;
  className: string;
}[] = [
  {
    key: "order_received",
    shortLabel: "Ordine ricevuto",
    className: "border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100",
  },
  {
    key: "graphic_review",
    shortLabel: "Grafica in revisione",
    className: "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100",
  },
  {
    key: "preview_sent",
    shortLabel: "Preview inviata al cliente",
    className: "border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100",
  },
  {
    key: "graphic_accepted",
    shortLabel: "Preview accettata ✓",
    className: "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
  },
  {
    key: "graphic_rejected",
    shortLabel: "STOP · Rifare grafica ✕",
    className: "border-red-300 bg-red-50 text-red-800 hover:bg-red-100",
  },
  {
    key: "processing",
    shortLabel: "In produzione NFC",
    className: "border-indigo-300 bg-indigo-50 text-indigo-800 hover:bg-indigo-100",
  },
  {
    key: "quality_check",
    shortLabel: "Collaudo chip NFC",
    className: "border-indigo-300 bg-indigo-50 text-indigo-800 hover:bg-indigo-100",
  },
  {
    key: "shipped",
    shortLabel: "Spedito corriere",
    className: "border-purple-300 bg-purple-50 text-purple-800 hover:bg-purple-100",
  },
  {
    key: "in_transit",
    shortLabel: "In transito",
    className: "border-purple-300 bg-purple-50 text-purple-800 hover:bg-purple-100",
  },
  {
    key: "out_for_delivery",
    shortLabel: "In consegna oggi",
    className: "border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-100",
  },
  {
    key: "delivered",
    shortLabel: "Consegnato",
    className: "border-green-300 bg-green-50 text-green-800 hover:bg-green-100",
  },
];

export default function TrackingAdminClient({
  initialOrders,
  profileMap,
  initialMetaMap,
  initialCustomTrackings,
}: {
  initialOrders: WebsiteOrderRow[];
  profileMap: Record<string, ProfileInfo>;
  initialMetaMap: Record<string, OrderTrackingMeta>;
  initialCustomTrackings: CustomTrackingRecord[];
}) {
  const [activeTab, setActiveTab] = useState<"custom" | "website">("custom");
  const [customList, setCustomList] = useState<CustomTrackingRecord[]>(
    initialCustomTrackings
  );
  const [metaMap, setMetaMap] =
    useState<Record<string, OrderTrackingMeta>>(initialMetaMap);
  const [search, setSearch] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [emailSentCode, setEmailSentCode] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const notifyLock = useRef(false);

  // Form state for creating/editing off-site custom tracking
  const [showForm, setShowForm] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [formCode, setFormCode] = useState("");
  const [formCustomerName, setFormCustomerName] = useState("");
  const [formCustomerCompany, setFormCustomerCompany] = useState("");
  const [formCustomerEmail, setFormCustomerEmail] = useState("");
  const [formCustomerPhone, setFormCustomerPhone] = useState("");
  const [formChannel, setFormChannel] = useState<
    "whatsapp" | "email" | "phone" | "b2b" | "other"
  >("whatsapp");
  const [formItemsSummary, setFormItemsSummary] = useState("");
  const [formTotalAmount, setFormTotalAmount] = useState("");
  const [formHasCustomPrint, setFormHasCustomPrint] = useState(true);
  const [formStatus, setFormStatus] =
    useState<DetailedTrackingStatus>("order_received");
  const [formGraphicNote, setFormGraphicNote] = useState("");
  const [formSupplierPreviewUrl, setFormSupplierPreviewUrl] = useState("");
  const [formCarrier, setFormCarrier] = useState<CarrierCode>("auto");
  const [formCarrierNumber, setFormCarrierNumber] = useState("");
  const [formEstimatedDelivery, setFormEstimatedDelivery] = useState("");
  const [formShippingCity, setFormShippingCity] = useState("");
  const [formShippingCountry, setFormShippingCountry] = useState("Italia");
  const [formPublicNote, setFormPublicNote] = useState("");
  const [formInternalNote, setFormInternalNote] = useState("");

  function resetForm() {
    setEditingCode(null);
    setFormCode("");
    setFormCustomerName("");
    setFormCustomerCompany("");
    setFormCustomerEmail("");
    setFormCustomerPhone("");
    setFormChannel("whatsapp");
    setFormItemsSummary("");
    setFormTotalAmount("");
    setFormHasCustomPrint(true);
    setFormStatus("order_received");
    setFormGraphicNote("");
    setFormSupplierPreviewUrl("");
    setFormCarrier("auto");
    setFormCarrierNumber("");
    setFormEstimatedDelivery("");
    setFormShippingCity("");
    setFormShippingCountry("Italia");
    setFormPublicNote("");
    setFormInternalNote("");
  }

  function openNewForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditForm(item: CustomTrackingRecord) {
    setEditingCode(item.code);
    setFormCode(item.code);
    setFormCustomerName(item.customerName);
    setFormCustomerCompany(item.customerCompany || "");
    setFormCustomerEmail(item.customerEmail || "");
    setFormCustomerPhone(item.customerPhone || "");
    setFormChannel(item.channel);
    setFormItemsSummary(item.itemsSummary);
    setFormTotalAmount(
      item.totalAmount != null ? String(item.totalAmount) : ""
    );
    setFormHasCustomPrint(item.hasCustomPrint);
    setFormStatus(item.trackingStatus);
    setFormGraphicNote(item.graphicNote || "");
    setFormSupplierPreviewUrl(item.supplierPreviewUrl || "");
    setFormCarrier(item.carrier || "auto");
    setFormCarrierNumber(item.carrierTrackingNumber || "");
    setFormEstimatedDelivery(item.estimatedDelivery || "");
    setFormShippingCity(item.shippingCity || "");
    setFormShippingCountry(item.shippingCountry || "Italia");
    setFormPublicNote(item.publicNote || "");
    setFormInternalNote(item.internalNote || "");
    setShowForm(true);
  }

  function handleSaveCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!formCustomerName.trim()) return;

    startTransition(async () => {
      const saved = await createOrUpdateCustomTracking({
        code: formCode.trim() || undefined,
        customerName: formCustomerName,
        customerCompany: formCustomerCompany || null,
        customerEmail: formCustomerEmail || null,
        customerPhone: formCustomerPhone || null,
        channel: formChannel,
        itemsSummary:
          formItemsSummary.trim() || "Fornitura Tag / Tessere NFC personalizzate",
        totalAmount: formTotalAmount ? Number(formTotalAmount) : null,
        hasCustomPrint: formHasCustomPrint,
        trackingStatus: formStatus,
        graphicNote: formGraphicNote || null,
        supplierPreviewUrl: formSupplierPreviewUrl || null,
        carrier: formCarrier,
        carrierTrackingNumber: formCarrierNumber || null,
        estimatedDelivery: formEstimatedDelivery || null,
        shippingCity: formShippingCity || null,
        shippingCountry: formShippingCountry || "Italia",
        publicNote: formPublicNote || null,
        internalNote: formInternalNote || null,
      });

      setCustomList((prev) => {
        const exists = prev.some((c) => c.code === saved.code);
        if (exists) {
          return prev.map((c) => (c.code === saved.code ? saved : c));
        }
        return [saved, ...prev];
      });
      setShowForm(false);
      resetForm();
    });
  }

  function handleQuickCustomStatus(
    item: CustomTrackingRecord,
    newStatus: DetailedTrackingStatus
  ) {
    if (item.trackingStatus === newStatus || notifyLock.current) return;
    notifyLock.current = true;
    startTransition(async () => {
      try {
      const saved = await createOrUpdateCustomTracking({
        code: item.code,
        customerName: item.customerName,
        customerCompany: item.customerCompany,
        customerEmail: item.customerEmail,
        customerPhone: item.customerPhone,
        channel: item.channel,
        itemsSummary: item.itemsSummary,
        totalAmount: item.totalAmount,
        hasCustomPrint: item.hasCustomPrint,
        trackingStatus: newStatus,
        graphicNote: item.graphicNote,
        supplierPreviewUrl: item.supplierPreviewUrl,
        carrier: item.carrier,
        carrierTrackingNumber: item.carrierTrackingNumber,
        estimatedDelivery: item.estimatedDelivery,
        shippingCity: item.shippingCity,
        shippingCountry: item.shippingCountry,
        publicNote: item.publicNote,
        internalNote: item.internalNote,
      });
      setCustomList((prev) =>
        prev.map((c) => (c.code === saved.code ? saved : c))
      );
      } finally {
        notifyLock.current = false;
      }
    });
  }

  function handleDeleteCustom(code: string) {
    if (!window.confirm(`Eliminare il tracking ${code}?`)) return;
    startTransition(async () => {
      await deleteCustomTracking(code);
      setCustomList((prev) => prev.filter((c) => c.code !== code));
    });
  }

  function handleSendCustomEmail(code: string) {
    startTransition(async () => {
      const res = await sendCustomTrackingEmail(code);
      if (res.ok) {
        setEmailSentCode(code);
        setTimeout(() => setEmailSentCode(null), 2500);
      } else {
        window.alert(res.error || "Errore durante l'invio dell'email");
      }
    });
  }

  function copyTrackingUrl(code: string) {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/tracking?code=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  function buildCustomerWhatsAppLink(
    phone: string | null | undefined,
    customerName: string,
    code: string,
    statusLabel: string
  ) {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://shopnfc.bitora.it";
    const trackUrl = `${origin}/tracking?code=${encodeURIComponent(code)}`;
    const text = `Ciao ${customerName}, ecco il link per seguire in tempo reale lo stato del tuo ordine (${code} — ${statusLabel}): ${trackUrl}`;
    const digits = (phone || "").replace(/\D/g, "").replace(/^00/, "");
    const cleanPhone =
      digits.length > 0 && digits.length <= 10 ? `39${digits}` : digits;
    return cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  function getCustomerInfo(order: WebsiteOrderRow) {
    if (order.user_id && profileMap[order.user_id]) {
      const p = profileMap[order.user_id];
      return {
        name: `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.email,
        email: p.email,
      };
    }
    const ship = order.shipping_address as { name?: string; phone?: string } | null;
    const bill = order.billing_address as { email?: string } | null;
    return {
      name: ship?.name || "Ospite",
      email: order.guest_email || bill?.email || "N/A",
      phone: ship?.phone || null,
    };
  }

  const filteredCustom = customList.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.code.toLowerCase().includes(q) ||
      c.customerName.toLowerCase().includes(q) ||
      (c.customerCompany || "").toLowerCase().includes(q) ||
      (c.carrierTrackingNumber || "").toLowerCase().includes(q) ||
      c.itemsSummary.toLowerCase().includes(q)
    );
  });

  const filteredWebsite = initialOrders.filter((o) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const cust = getCustomerInfo(o);
    const ordCode = formatOrderNumber(o.id).toLowerCase();
    return (
      ordCode.includes(q) ||
      String(o.id).includes(q) ||
      cust.name.toLowerCase().includes(q) ||
      cust.email.toLowerCase().includes(q) ||
      (o.tracking_number || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent mb-1">
            <Truck className="w-4 h-4" />
            Centro Spedizioni &amp; Revisione Grafica
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Tracking Ordini &amp; Clienti Diretti
          </h1>
          <p className="text-sm text-muted mt-1">
            Gestisci lo stato di produzione, l&apos;approvazione grafica del fornitore e il tracking corriere sia per gli ordini del sito sia per i clienti che ordinano su WhatsApp, email o telefono.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/tracking"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-hover transition"
          >
            Pagina pubblica /tracking
            <ExternalLink className="w-4 h-4 text-muted" />
          </Link>
          <button
            type="button"
            onClick={openNewForm}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Crea Tracking Cliente Diretto
          </button>
        </div>
      </div>

      {/* Free External Tracking Tools Info Bar */}
      <div className="rounded-2xl border border-sky-200 dark:border-sky-900/50 bg-sky-50/70 dark:bg-sky-950/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div className="text-xs text-foreground/80 leading-relaxed">
            <span className="font-bold text-foreground">
              Integrazione Tool Esterni Gratuiti + Auto-Detect Corriere:
            </span>{" "}
            inserendo il codice di spedizione (BRT, GLS, DHL, SDA, Poste, UPS, FedEx, TNT, InPost), la pagina pubblica genera in automatico i pulsanti di tracciamento diretto sul sito del corriere e sui portali gratuiti{" "}
            <strong>17TRACK</strong>, <strong>ParcelsApp</strong> e{" "}
            <strong>AfterShip</strong>.
          </div>
        </div>
      </div>

      {/* Create / Edit Modal or Card for Direct Off-site Customers */}
      {showForm && (
        <div className="rounded-2xl border-2 border-accent/40 bg-surface p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {editingCode
                  ? `Modifica Tracking Diretto ${editingCode}`
                  : "Nuovo Tracking per Cliente Extra-Sito (WhatsApp / Email / Telefono)"}
              </h2>
              <p className="text-xs text-muted">
                Genera un codice univoco da inviare al cliente per seguire ordine ricevuto, revisione grafica fornitore, produzione NFC e corriere.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="p-1.5 rounded-lg hover:bg-surface-hover text-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveCustom} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                  Codice Tracking (opzionale)
                </label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="Auto (es. BIT-2026-AB12)"
                  disabled={!!editingCode}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono uppercase disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                  Nome Cliente / Referente *
                </label>
                <input
                  type="text"
                  required
                  value={formCustomerName}
                  onChange={(e) => setFormCustomerName(e.target.value)}
                  placeholder="Mario Rossi"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                  Azienda / Ragione Sociale
                </label>
                <input
                  type="text"
                  value={formCustomerCompany}
                  onChange={(e) => setFormCustomerCompany(e.target.value)}
                  placeholder="Rossi S.r.l."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                  Canale Ordine
                </label>
                <select
                  value={formChannel}
                  onChange={(e) =>
                    setFormChannel(
                      e.target.value as
                        | "whatsapp"
                        | "email"
                        | "phone"
                        | "b2b"
                        | "other"
                    )
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email diretta</option>
                  <option value="phone">Telefono</option>
                  <option value="b2b">Preventivo B2B</option>
                  <option value="other">Altro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                  Telefono / WhatsApp Cliente
                </label>
                <input
                  type="text"
                  value={formCustomerPhone}
                  onChange={(e) => setFormCustomerPhone(e.target.value)}
                  placeholder="+39 333 1234567"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                  Email Cliente
                </label>
                <input
                  type="email"
                  value={formCustomerEmail}
                  onChange={(e) => setFormCustomerEmail(e.target.value)}
                  placeholder="cliente@azienda.it"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                  Totale Ordine (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formTotalAmount}
                  onChange={(e) => setFormTotalAmount(e.target.value)}
                  placeholder="150.00"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                  Riepilogo Prodotti / Fornitura *
                </label>
                <input
                  type="text"
                  required
                  value={formItemsSummary}
                  onChange={(e) => setFormItemsSummary(e.target.value)}
                  placeholder="Es. 200x Tessere NFC NTAG215 con stampa UV fronte/retro + programmazione link"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                  Città di destinazione
                </label>
                <input
                  type="text"
                  value={formShippingCity}
                  onChange={(e) => setFormShippingCity(e.target.value)}
                  placeholder="Es. Milano (MI)"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                  Stato Ordine / Grafica / Corriere *
                </label>
                <select
                  value={formStatus}
                  onChange={(e) =>
                    setFormStatus(e.target.value as DetailedTrackingStatus)
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold"
                >
                  {TRACKING_STATUSES.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                  Corriere Espresso
                </label>
                <select
                  value={formCarrier}
                  onChange={(e) =>
                    setFormCarrier(e.target.value as CarrierCode)
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                >
                  {CARRIERS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                  Numero Tracking Corriere
                </label>
                <input
                  type="text"
                  value={formCarrierNumber}
                  onChange={(e) => setFormCarrierNumber(e.target.value)}
                  placeholder="Codice spedizione corriere"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="flex items-center gap-2.5 pt-2">
                <input
                  id="has-custom-print"
                  type="checkbox"
                  checked={formHasCustomPrint}
                  onChange={(e) => setFormHasCustomPrint(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                />
                <label
                  htmlFor="has-custom-print"
                  className="text-sm font-medium text-foreground cursor-pointer"
                >
                  Include stampa grafica (con preview fornitore)
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                  Link Preview Fornitore (URL opzionale)
                </label>
                <input
                  type="url"
                  value={formSupplierPreviewUrl}
                  onChange={(e) => setFormSupplierPreviewUrl(e.target.value)}
                  placeholder="https://... (PDF/immagine preview)"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                  Nota Grafica / Preview Fornitore
                </label>
                <input
                  type="text"
                  value={formGraphicNote}
                  onChange={(e) => setFormGraphicNote(e.target.value)}
                  placeholder="Es. Preview inviata: attendiamo conferma / STOP: rifare grafica"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                  Consegna stimata / Nota pubblica
                </label>
                <input
                  type="text"
                  value={formPublicNote}
                  onChange={(e) => setFormPublicNote(e.target.value)}
                  placeholder="Es. Consegna prevista entro 48h"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {editingCode ? "Salva modifiche" : "Crea Tracking e Genera Link"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-border bg-surface p-1">
          <button
            type="button"
            onClick={() => setActiveTab("custom")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === "custom"
                ? "bg-accent text-white shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            Clienti Diretti Extra-Sito ({customList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("website")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === "website"
                ? "bg-accent text-white shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            Ordini Sito Web ({initialOrders.length})
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca codice, cliente, tracking corriere..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-surface text-sm"
          />
        </div>
      </div>

      {/* TAB 1: OFF-SITE DIRECT CUSTOMER TRACKINGS */}
      {activeTab === "custom" && (
        <div className="space-y-4">
          {filteredCustom.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center space-y-3">
              <Truck className="w-10 h-10 text-muted mx-auto" />
              <h3 className="text-base font-bold text-foreground">
                Nessun tracking diretto extra-sito presente
              </h3>
              <p className="text-sm text-muted max-w-md mx-auto">
                Un cliente ti ha scritto su WhatsApp, via email o al telefono senza passare dal sito? Crea un tracking dedicato in 10 secondi e inviagli il link di stato ordine.
              </p>
              <button
                type="button"
                onClick={openNewForm}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover transition"
              >
                <Plus className="w-4 h-4" />
                Crea il primo Tracking Cliente Diretto
              </button>
            </div>
          ) : (
            filteredCustom.map((item) => {
              const stDef = getTrackingStatusDef(item.trackingStatus);
              const carrierInfo = resolveCarrierInfo(
                item.carrier,
                item.carrierTrackingNumber
              );
              return (
                <div
                  key={item.code}
                  className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-base font-extrabold text-accent bg-sky-50 dark:bg-sky-950/40 px-2.5 py-1 rounded-lg border border-sky-200 dark:border-sky-800">
                          {item.code}
                        </span>
                        <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-muted">
                          Canale: {item.channel}
                        </span>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200">
                          {stDef.label}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-foreground pt-1">
                        {item.customerName}
                        {item.customerCompany ? ` · ${item.customerCompany}` : ""}
                      </h3>
                      <p className="text-sm text-foreground/80">
                        {item.itemsSummary}
                        {item.totalAmount != null && (
                          <span className="ml-2 font-semibold text-accent">
                            (€ {item.totalAmount.toFixed(2)})
                          </span>
                        )}
                      </p>
                      {item.graphicNote && (
                        <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                          Nota grafica / preview fornitore: {item.graphicNote}
                        </p>
                      )}
                      {item.supplierPreviewUrl && (
                        <a
                          href={item.supplierPreviewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          Apri Preview Fornitore
                        </a>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyTrackingUrl(item.code)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:border-accent/50 transition"
                      >
                        {copiedCode === item.code ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            Link copiato!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-muted" />
                            Copia link cliente
                          </>
                        )}
                      </button>

                      <Link
                        href={`/tracking?code=${encodeURIComponent(item.code)}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-accent hover:bg-sky-50 dark:hover:bg-sky-950/30 transition"
                      >
                        Apri pagina
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      <a
                        href={buildCustomerWhatsAppLink(
                          item.customerPhone,
                          item.customerName,
                          item.code,
                          stDef.label
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#1f8f4e] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1a7a42] transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Invia su WhatsApp
                      </a>

                      {item.customerEmail && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleSendCustomEmail(item.code)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover transition disabled:opacity-50"
                          title={`Invia email stato a ${item.customerEmail}`}
                        >
                          {emailSentCode === item.code ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Email inviata!
                            </>
                          ) : (
                            <>
                              <Mail className="w-3.5 h-3.5" />
                              Invia Email
                            </>
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openEditForm(item)}
                        className="p-1.5 rounded-lg border border-border hover:bg-surface-hover text-muted hover:text-foreground"
                        title="Modifica dettagli"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustom(item.code)}
                        className="p-1.5 rounded-lg border border-border hover:bg-red-50 text-red-500"
                        title="Elimina"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Quick 1-click status bar */}
                  <div className="pt-3 border-t border-border/70">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">
                      Cambio rapido stato (1-click):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_STATUSES.map((qs) => {
                        const active = item.trackingStatus === qs.key;
                        return (
                          <button
                            key={qs.key}
                            type="button"
                            disabled={isPending}
                            onClick={() =>
                              handleQuickCustomStatus(item, qs.key)
                            }
                            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
                              active
                                ? "ring-2 ring-accent font-bold " + qs.className
                                : "border-border bg-background text-muted hover:text-foreground"
                            }`}
                          >
                            {qs.shortLabel}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Courier & External Free Tools */}
                  {item.carrierTrackingNumber && (
                    <div className="pt-3 border-t border-border/70 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-purple-600" />
                        <span className="font-semibold text-foreground">
                          {carrierInfo.carrierName}:
                        </span>
                        <span className="font-mono font-bold text-purple-700 dark:text-purple-300">
                          {item.carrierTrackingNumber}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {carrierInfo.directUrl && (
                          <a
                            href={carrierInfo.directUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-md bg-purple-600 text-white font-semibold hover:bg-purple-700 inline-flex items-center gap-1"
                          >
                            Sito {carrierInfo.carrierName}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {carrierInfo.externalTools && (
                          <>
                            <a
                              href={carrierInfo.externalTools.track17Url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 rounded-md border border-border bg-background text-foreground hover:border-accent/50 inline-flex items-center gap-1"
                            >
                              17TRACK
                              <ExternalLink className="w-3 h-3 text-muted" />
                            </a>
                            <a
                              href={carrierInfo.externalTools.parcelsAppUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 rounded-md border border-border bg-background text-foreground hover:border-accent/50 inline-flex items-center gap-1"
                            >
                              ParcelsApp
                              <ExternalLink className="w-3 h-3 text-muted" />
                            </a>
                            <a
                              href={carrierInfo.externalTools.afterShipUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 rounded-md border border-border bg-background text-foreground hover:border-accent/50 inline-flex items-center gap-1"
                            >
                              AfterShip
                              <ExternalLink className="w-3 h-3 text-muted" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: WEBSITE ORDERS TRACKING & GRAPHIC APPROVAL */}
      {activeTab === "website" && (
        <div className="space-y-4">
          {filteredWebsite.map((order) => {
            const cust = getCustomerInfo(order);
            const meta = metaMap[String(order.id)];
            const orderCode = formatOrderNumber(order.id);
            return (
              <WebsiteOrderTrackingCard
                key={order.id}
                order={order}
                orderCode={orderCode}
                customer={cust}
                meta={meta}
                onSaved={(updatedMeta, newCarrierTracking) => {
                  setMetaMap((prev) => ({
                    ...prev,
                    [String(order.id)]: updatedMeta,
                  }));
                  order.tracking_number = newCarrierTracking;
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function WebsiteOrderTrackingCard({
  order,
  orderCode,
  customer,
  meta,
  onSaved,
}: {
  order: WebsiteOrderRow;
  orderCode: string;
  customer: { name: string; email: string; phone?: string | null };
  meta?: OrderTrackingMeta;
  onSaved: (updated: OrderTrackingMeta, carrierTracking: string | null) => void;
}) {
  const defaultStatus: DetailedTrackingStatus =
    meta?.trackingStatus ||
    (order.status === "shipped"
      ? "shipped"
      : order.status === "delivered"
        ? "delivered"
        : order.status === "cancelled"
          ? "cancelled"
          : order.status === "processing"
            ? "processing"
            : order.custom_graphic_url
              ? "graphic_review"
              : "order_received");

  const [status, setStatus] = useState<DetailedTrackingStatus>(defaultStatus);
  const [carrier, setCarrier] = useState<CarrierCode>(meta?.carrier || "auto");
  const [carrierTracking, setCarrierTracking] = useState(
    meta?.carrierTrackingNumber || order.tracking_number || ""
  );
  const [graphicNote, setGraphicNote] = useState(meta?.graphicNote || "");
  const [supplierPreviewUrl, setSupplierPreviewUrl] = useState(
    meta?.supplierPreviewUrl || ""
  );
  const [publicNote, setPublicNote] = useState(meta?.publicNote || "");
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [savedToast, setSavedToast] = useState(false);
  const [isPending, startTransition] = useTransition();
  const notifyLock = useRef(false);

  const stDef = getTrackingStatusDef(status);
  const carrierInfo = resolveCarrierInfo(carrier, carrierTracking);

  function saveChanges(overrideStatus?: DetailedTrackingStatus) {
    const nextStatus = overrideStatus || status;
    if (notifyLock.current) return;
    if (overrideStatus && overrideStatus === (meta?.trackingStatus || status) && overrideStatus === status) {
      return;
    }
    if (overrideStatus) setStatus(overrideStatus);
    notifyLock.current = true;

    startTransition(async () => {
      try {
      const updated = await updateWebsiteOrderTracking({
        orderId: order.id,
        trackingStatus: nextStatus,
        carrier,
        carrierTrackingNumber: carrierTracking.trim() || null,
        graphicNote: graphicNote.trim() || null,
        supplierPreviewUrl: supplierPreviewUrl.trim() || null,
        publicNote: publicNote.trim() || null,
        notifyCustomer,
      });
      onSaved(updated, carrierTracking.trim() || null);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2000);
      } finally {
        notifyLock.current = false;
      }
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-base font-extrabold text-foreground">
              Ordine #{orderCode}
            </span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200">
              {stDef.label}
            </span>
            {order.custom_graphic_url && (
              <a
                href={order.custom_graphic_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                File grafica ({order.custom_graphic_original_name || "Apri"})
              </a>
            )}
          </div>
          <p className="text-sm text-muted mt-1">
            {customer.name} ({customer.email}) · €{order.total.toFixed(2)} ·{" "}
            {new Date(order.created_at).toLocaleDateString("it-IT")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/tracking?code=${encodeURIComponent(orderCode)}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-accent hover:bg-sky-50 transition"
          >
            Pagina tracking #{orderCode}
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Quick 1-click buttons including Graphic Review / Accepted / Rejected */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_STATUSES.map((qs) => {
          const active = status === qs.key;
          return (
            <button
              key={qs.key}
              type="button"
              disabled={isPending}
              onClick={() => saveChanges(qs.key)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
                active
                  ? "ring-2 ring-accent font-bold " + qs.className
                  : "border-border bg-background text-muted hover:text-foreground"
              }`}
            >
              {qs.shortLabel}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2 border-t border-border/60">
        <div>
          <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
            Stato completo
          </label>
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as DetailedTrackingStatus)
            }
            className="w-full rounded-xl border border-border bg-background px-2.5 py-2 text-xs font-semibold"
          >
            {TRACKING_STATUSES.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
            Corriere
          </label>
          <select
            value={carrier}
            onChange={(e) => setCarrier(e.target.value as CarrierCode)}
            className="w-full rounded-xl border border-border bg-background px-2.5 py-2 text-xs"
          >
            {CARRIERS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
            Codice Tracking Corriere
          </label>
          <input
            type="text"
            value={carrierTracking}
            onChange={(e) => setCarrierTracking(e.target.value)}
            placeholder="Numero spedizione"
            className="w-full rounded-xl border border-border bg-background px-2.5 py-2 text-xs font-mono"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
            Link Preview Fornitore
          </label>
          <input
            type="url"
            value={supplierPreviewUrl}
            onChange={(e) => setSupplierPreviewUrl(e.target.value)}
            placeholder="https://... (URL preview)"
            className="w-full rounded-xl border border-border bg-background px-2.5 py-2 text-xs"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
            Nota Grafica / Preview
          </label>
          <input
            type="text"
            value={graphicNote}
            onChange={(e) => setGraphicNote(e.target.value)}
            placeholder="Es. Preview inviata: in attesa conferma"
            className="w-full rounded-xl border border-border bg-background px-2.5 py-2 text-xs"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-4">
          <label className="inline-flex items-center gap-2 text-xs text-muted cursor-pointer">
            <input
              type="checkbox"
              checked={notifyCustomer}
              onChange={(e) => setNotifyCustomer(e.target.checked)}
              className="rounded border-border text-accent"
            />
            Invia email di aggiornamento stato al cliente
          </label>

          {carrierTracking && carrierInfo.externalTools && (
            <div className="flex items-center gap-2 text-xs">
              <a
                href={carrierInfo.externalTools.track17Url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline inline-flex items-center gap-0.5"
              >
                17TRACK
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={carrierInfo.externalTools.parcelsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline inline-flex items-center gap-0.5"
              >
                ParcelsApp
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={carrierInfo.externalTools.afterShipUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline inline-flex items-center gap-0.5"
              >
                AfterShip
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        <button
          type="button"
          disabled={isPending}
          onClick={() => saveChanges()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {savedToast ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Salvato!
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              Aggiorna Tracking
            </>
          )}
        </button>
      </div>
    </div>
  );
}
