"use client";

import { useState, useTransition } from "react";
import { Check, X, Pencil, Trash2, Save } from "lucide-react";
import {
  approveDealer,
  rejectDealer,
  updateDealerData,
  deleteDealer,
} from "../actions/dealers";

// Codici ISO + nome paese, coerenti con la mappa usata nel checkout.
const COUNTRY_OPTIONS: { code: string; name: string }[] = [
  { code: "IT", name: "Italia" },
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgio" },
  { code: "BG", name: "Bulgaria" },
  { code: "HR", name: "Croazia" },
  { code: "DK", name: "Danimarca" },
  { code: "EE", name: "Estonia" },
  { code: "FI", name: "Finlandia" },
  { code: "FR", name: "Francia" },
  { code: "DE", name: "Germania" },
  { code: "GR", name: "Grecia" },
  { code: "IE", name: "Irlanda" },
  { code: "LV", name: "Lettonia" },
  { code: "LT", name: "Lituania" },
  { code: "LU", name: "Lussemburgo" },
  { code: "MT", name: "Malta" },
  { code: "NL", name: "Paesi Bassi" },
  { code: "PL", name: "Polonia" },
  { code: "PT", name: "Portogallo" },
  { code: "CZ", name: "Repubblica Ceca" },
  { code: "RO", name: "Romania" },
  { code: "SK", name: "Slovacchia" },
  { code: "SI", name: "Slovenia" },
  { code: "ES", name: "Spagna" },
  { code: "SE", name: "Svezia" },
  { code: "HU", name: "Ungheria" },
  { code: "GB", name: "Regno Unito" },
  { code: "CH", name: "Svizzera" },
];

interface DealerProfile {
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address_line1?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  country?: string | null;
}

interface DealerData {
  id: string;
  company_name: string;
  vat_number: string;
  status: string;
  discount_percent: number;
  profiles: DealerProfile | null;
}

export default function DealerActions({ dealer }: { dealer: DealerData }) {
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"idle" | "approve" | "reject" | "edit" | "delete">("idle");

  // Approve form
  const [discount, setDiscount] = useState(dealer.discount_percent || 10);

  // Reject form
  const [reason, setReason] = useState("");

  // Edit form
  const [editData, setEditData] = useState({
    companyName: dealer.company_name,
    vatNumber: dealer.vat_number,
    firstName: dealer.profiles?.first_name || "",
    lastName: dealer.profiles?.last_name || "",
    phone: dealer.profiles?.phone || "",
    addressLine1: dealer.profiles?.address_line1 || "",
    city: dealer.profiles?.city || "",
    province: dealer.profiles?.province || "",
    postalCode: dealer.profiles?.postal_code || "",
    country: dealer.profiles?.country || "IT",
    discountPercent: dealer.discount_percent,
  });

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveDealer(dealer.id, discount);
      if (result?.error) alert(result.error);
      else setMode("idle");
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      const result = await rejectDealer(dealer.id, reason);
      if (result?.error) alert(result.error);
      else setMode("idle");
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateDealerData(dealer.id, editData);
      if (result?.error) alert(result.error);
      else setMode("idle");
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteDealer(dealer.id);
      if (result?.error) alert(result.error);
    });
  };

  const wrap = isPending ? "opacity-50 pointer-events-none" : "";

  // ── IDLE: show action buttons ──
  if (mode === "idle") {
    return (
      <div className={`flex flex-wrap items-center gap-1.5 ${wrap}`}>
        {dealer.status === "pending" && (
          <>
            <button
              onClick={() => setMode("approve")}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Approva
            </button>
            <button
              onClick={() => setMode("reject")}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Rifiuta
            </button>
          </>
        )}
        <button
          onClick={() => setMode("edit")}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
          Modifica
        </button>
        <button
          onClick={() => setMode("delete")}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // ── APPROVE ──
  if (mode === "approve") {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${wrap}`}>
        <label className="text-xs text-muted whitespace-nowrap">Sconto %</label>
        <input
          type="number"
          min={0}
          max={70}
          value={discount}
          onChange={(e) => setDiscount(parseInt(e.target.value) || 0)}
          className="w-16 px-2 py-1.5 rounded-lg border border-border text-sm text-center focus:outline-none focus:border-accent/50"
        />
        <button
          onClick={handleApprove}
          className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors"
        >
          Conferma
        </button>
        <button
          onClick={() => setMode("idle")}
          className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
        >
          Annulla
        </button>
      </div>
    );
  }

  // ── REJECT ──
  if (mode === "reject") {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${wrap}`}>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Motivo del rifiuto (opzionale)"
          className="flex-1 px-3 py-1.5 rounded-lg border border-border text-sm placeholder:text-muted focus:outline-none focus:border-accent/50 min-w-[200px]"
        />
        <button
          onClick={handleReject}
          className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors whitespace-nowrap"
        >
          Conferma
        </button>
        <button
          onClick={() => setMode("idle")}
          className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
        >
          Annulla
        </button>
      </div>
    );
  }

  // ── DELETE ──
  if (mode === "delete") {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${wrap}`}>
        <span className="text-xs text-red-600 font-medium">Eliminare questo dealer?</span>
        <button
          onClick={handleDelete}
          className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors"
        >
          Sì, elimina
        </button>
        <button
          onClick={() => setMode("idle")}
          className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
        >
          Annulla
        </button>
      </div>
    );
  }

  // ── EDIT ──
  return (
    <div className={`w-full min-w-0 space-y-3 ${wrap}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted mb-1">Ragione sociale</label>
          <input
            type="text"
            value={editData.companyName}
            onChange={(e) => setEditData({ ...editData, companyName: e.target.value })}
            className="w-full px-3 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:border-accent/50"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">P.IVA</label>
          <input
            type="text"
            value={editData.vatNumber}
            onChange={(e) => setEditData({ ...editData, vatNumber: e.target.value })}
            className="w-full px-3 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:border-accent/50"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Nome</label>
          <input
            type="text"
            value={editData.firstName}
            onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
            className="w-full px-3 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:border-accent/50"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Cognome</label>
          <input
            type="text"
            value={editData.lastName}
            onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
            className="w-full px-3 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:border-accent/50"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Telefono</label>
          <input
            type="text"
            value={editData.phone}
            onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
            className="w-full px-3 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:border-accent/50"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Paese</label>
          <select
            value={editData.country}
            onChange={(e) => setEditData({ ...editData, country: e.target.value })}
            className="w-full px-3 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:border-accent/50 bg-background"
          >
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-muted mb-1">Indirizzo</label>
          <input
            type="text"
            value={editData.addressLine1}
            onChange={(e) => setEditData({ ...editData, addressLine1: e.target.value })}
            className="w-full px-3 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:border-accent/50"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Città</label>
          <input
            type="text"
            value={editData.city}
            onChange={(e) => setEditData({ ...editData, city: e.target.value })}
            className="w-full px-3 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:border-accent/50"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted mb-1">CAP</label>
            <input
              type="text"
              value={editData.postalCode}
              onChange={(e) => setEditData({ ...editData, postalCode: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:border-accent/50"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Prov.</label>
            <input
              type="text"
              value={editData.province}
              onChange={(e) => setEditData({ ...editData, province: e.target.value.toUpperCase().slice(0, 2) })}
              maxLength={2}
              className="w-full px-3 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:border-accent/50 uppercase"
              placeholder="TV"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Sconto %</label>
          <input
            type="number"
            min={0}
            max={70}
            value={editData.discountPercent}
            onChange={(e) => setEditData({ ...editData, discountPercent: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:border-accent/50"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent/90 transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          Salva
        </button>
        <button
          onClick={() => setMode("idle")}
          className="px-4 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
        >
          Annulla
        </button>
      </div>
    </div>
  );
}
