"use client";

import { useState, useTransition } from "react";
import { X, Loader2, Store, AlertTriangle, CheckCircle, XCircle, ShieldCheck } from "lucide-react";
import { promoteToDealer } from "../actions/users";
import { checkVatNumber } from "../actions/settings";
import type { VatCheckResult } from "../actions/settings";

const inputClass =
  "w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/50";

interface PromoteDealerModalProps {
  userId: string;
  email: string;
  initialCompany?: string;
  initialVat?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PromoteDealerModal({
  userId,
  email,
  initialCompany = "",
  initialVat = "",
  onClose,
  onSuccess,
}: PromoteDealerModalProps) {
  const [pending, startTransition] = useTransition();
  const [checkPending, startCheckTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [vatCheck, setVatCheck] = useState<VatCheckResult | null>(null);
  const [form, setForm] = useState({
    companyName: initialCompany,
    vatNumber: initialVat,
    vatCountry: "IT",
    approveImmediately: true,
    discountPercent: 50,
  });

  function handleVatFieldChange(field: "vatNumber" | "vatCountry", value: string) {
    setVatCheck(null);
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleCheckVat() {
    startCheckTransition(async () => {
      const result = await checkVatNumber(form.vatCountry, form.vatNumber);
      setVatCheck(result);
      if (result.status === "valid" && result.companyName && !form.companyName) {
        setForm((f) => ({ ...f, companyName: result.companyName! }));
      }
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await promoteToDealer(userId, form);
      if (result?.error) {
        setError(result.error);
        return;
      }
      onSuccess?.();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-accent" />
            <h2 className="font-semibold text-foreground">Configura rivenditore</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-muted mb-4">
          Utente: <span className="font-medium text-foreground">{email}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Ragione sociale *</label>
            <input
              required
              value={form.companyName}
              onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Paese (P.IVA)</label>
            <select
              value={form.vatCountry}
              onChange={(e) => handleVatFieldChange("vatCountry", e.target.value)}
              className={inputClass}
            >
              <option value="IT">IT â€“ Italia</option>
              <option value="DE">DE â€“ Germania</option>
              <option value="FR">FR â€“ Francia</option>
              <option value="ES">ES â€“ Spagna</option>
              <option value="AT">AT â€“ Austria</option>
              <option value="BE">BE â€“ Belgio</option>
              <option value="NL">NL â€“ Olanda</option>
              <option value="PL">PL â€“ Polonia</option>
              <option value="PT">PT â€“ Portogallo</option>
              <option value="GR">GR â€“ Grecia</option>
              <option value="HR">HR â€“ Croazia</option>
              <option value="RO">RO â€“ Romania</option>
              <option value="CZ">CZ â€“ Repubblica Ceca</option>
              <option value="HU">HU â€“ Ungheria</option>
              <option value="SE">SE â€“ Svezia</option>
              <option value="DK">DK â€“ Danimarca</option>
              <option value="FI">FI â€“ Finlandia</option>
              <option value="SK">SK â€“ Slovacchia</option>
              <option value="SI">SI â€“ Slovenia</option>
              <option value="BG">BG â€“ Bulgaria</option>
              <option value="LU">LU â€“ Lussemburgo</option>
              <option value="IE">IE â€“ Irlanda</option>
              <option value="EE">EE â€“ Estonia</option>
              <option value="LV">LV â€“ Lettonia</option>
              <option value="LT">LT â€“ Lituania</option>
              <option value="MT">MT â€“ Malta</option>
              <option value="CY">CY â€“ Cipro</option>
              <option value="EXTRA">Extra-UE (nessuna validazione formato)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Partita IVA / VAT *</label>
            <div className="flex gap-2">
              <input
                required
                value={form.vatNumber}
                onChange={(e) => handleVatFieldChange("vatNumber", e.target.value)}
                placeholder={form.vatCountry === "IT" ? "02450960261" : form.vatCountry === "EXTRA" ? "Numero IVA estero" : `${form.vatCountry}123456789`}
                className={inputClass}
              />
              <button
                type="button"
                onClick={handleCheckVat}
                disabled={checkPending || !form.vatNumber}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-medium text-foreground hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-50 transition-colors"
              >
                {checkPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                Verifica
              </button>
            </div>
            <VatCheckBadge result={vatCheck} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.approveImmediately}
              onChange={(e) =>
                setForm((f) => ({ ...f, approveImmediately: e.target.checked }))
              }
              className="rounded border-border"
            />
            Approva subito e attiva lo sconto
          </label>
          {form.approveImmediately && (
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Sconto %</label>
              <input
                type="number"
                min={0}
                max={70}
                value={form.discountPercent}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    discountPercent: parseInt(e.target.value) || 0,
                  }))
                }
                className={inputClass}
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl border border-border text-sm text-muted hover:text-foreground transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 text-white text-sm font-semibold disabled:opacity-60"
            >
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {pending ? "Salvataggio..." : "Salva"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function VatCheckBadge({ result }: { result: VatCheckResult | null }) {
  if (!result) return null;
  const styles = {
    valid: "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400",
    invalid: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400",
    unverifiable: "bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400",
    error: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400",
  };
  const icons = {
    valid: <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />,
    invalid: <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />,
    unverifiable: <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />,
    error: <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />,
  };
  return (
    <div className={`flex items-start gap-2 mt-2 px-3 py-2 rounded-xl border ${styles[result.status]}`}>
      {icons[result.status]}
      <p className="text-xs">{result.message}</p>
    </div>
  );
}

interface PromoteDealerModalProps {
  userId: string;
  email: string;
  initialCompany?: string;
  initialVat?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

