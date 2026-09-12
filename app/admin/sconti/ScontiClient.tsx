"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Check, X, Loader2, Plus } from "lucide-react";
import {
  createDiscountCode,
  updateDiscountCode,
  deleteDiscountCode,
} from "@/app/admin/actions/discounts";
import type { DiscountType } from "@/lib/types";

type DiscountCode = {
  id: number;
  code: string;
  type: DiscountType;
  value: string;
  minOrderAmount: string | null;
  maxUses: number | null;
  usedCount: number;
  startsAt: Date | string | null;
  endsAt: Date | string | null;
  active: boolean;
  note: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

function toDatetimeLocal(value: Date | string | null): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatMoney(value: string | number | null): string {
  if (value == null || value === "") return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("it-IT", { style: "currency", currency: "EUR" });
}

function formatValue(type: DiscountType, value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return type === "percent" ? `${n} %` : formatMoney(n);
}

function DiscountFields({ item }: { item?: DiscountCode }) {
  const [type, setType] = useState<DiscountType>(item?.type ?? "percent");

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div>
          <label className="block text-xs text-muted mb-1">Codice *</label>
          <input
            name="code"
            required
            defaultValue={item?.code ?? ""}
            placeholder="ESTATE20"
            className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm uppercase tracking-wide focus:outline-none focus:border-accent/50"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Tipo</label>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as DiscountType)}
            className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50"
          >
            <option value="percent">Percentuale</option>
            <option value="fixed">Importo fisso</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">
            {type === "percent" ? "Percentuale *" : "Importo (€) *"}
          </label>
          <input
            name="value"
            type="number"
            required
            min="0.01"
            max={type === "percent" ? 100 : undefined}
            step="0.01"
            defaultValue={item?.value ?? (type === "percent" ? "10" : "")}
            className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Attivo</label>
          <select
            name="active"
            defaultValue={item?.active !== false ? "true" : "false"}
            className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50"
          >
            <option value="true">Sì</option>
            <option value="false">No</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div>
          <label className="block text-xs text-muted mb-1">Ordine minimo (€)</label>
          <input
            name="min_order_amount"
            type="number"
            min="0"
            step="0.01"
            defaultValue={item?.minOrderAmount ?? ""}
            placeholder="Opzionale"
            className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Utilizzi massimi</label>
          <input
            name="max_uses"
            type="number"
            min="1"
            step="1"
            defaultValue={item?.maxUses ?? ""}
            placeholder="Illimitati"
            className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Valido dal</label>
          <input
            name="starts_at"
            type="datetime-local"
            defaultValue={toDatetimeLocal(item?.startsAt ?? null)}
            className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Valido al</label>
          <input
            name="ends_at"
            type="datetime-local"
            defaultValue={toDatetimeLocal(item?.endsAt ?? null)}
            className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">Nota interna</label>
        <input
          name="note"
          defaultValue={item?.note ?? ""}
          placeholder="Es. campagna Instagram maggio"
          className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50"
        />
      </div>
    </div>
  );
}

function DiscountRow({
  item,
  onDeleted,
}: {
  item: DiscountCode;
  onDeleted: (id: number) => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateDiscountCode(item.id, fd);
      if (res.error) {
        setError(res.error);
      } else {
        setEditing(false);
        setError(null);
        router.refresh();
      }
    });
  }

  function handleDelete() {
    if (!confirm(`Eliminare il codice ${item.code}?`)) return;
    startTransition(async () => {
      const res = await deleteDiscountCode(item.id);
      if (res.error) setError(res.error);
      else onDeleted(item.id);
    });
  }

  if (editing) {
    return (
      <tr className="border-b border-border bg-sky-50/40 dark:bg-sky-950/20">
        <td colSpan={7} className="px-4 py-4">
          <form onSubmit={handleUpdate} className="space-y-3">
            <DiscountFields item={item} />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-medium disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Salva
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-muted hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" /> Annulla
              </button>
              {error && <span className="text-xs text-red-600">{error}</span>}
            </div>
          </form>
        </td>
      </tr>
    );
  }

  const uses =
    item.maxUses == null ? `${item.usedCount} / ∞` : `${item.usedCount} / ${item.maxUses}`;
  const period =
    !item.startsAt && !item.endsAt
      ? "Sempre"
      : `${toDatetimeLocal(item.startsAt).replace("T", " ") || "…"} → ${toDatetimeLocal(item.endsAt).replace("T", " ") || "…"}`;

  return (
    <tr className="border-b border-border hover:bg-surface-hover/50 transition-colors">
      <td className="px-4 py-3">
        <p className="font-mono font-semibold text-foreground tracking-wide">{item.code}</p>
        {item.note && <p className="text-[11px] text-muted mt-0.5 line-clamp-1">{item.note}</p>}
      </td>
      <td className="px-4 py-3 text-sm text-foreground">{formatValue(item.type, item.value)}</td>
      <td className="px-4 py-3 text-sm text-muted">
        {item.minOrderAmount ? formatMoney(item.minOrderAmount) : "—"}
      </td>
      <td className="px-4 py-3 text-sm text-muted whitespace-nowrap">{uses}</td>
      <td className="px-4 py-3 text-sm text-muted whitespace-nowrap">{period}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
            item.active
              ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
              : "bg-gray-100 dark:bg-gray-800 text-muted"
          }`}
        >
          {item.active ? "Attivo" : "Inattivo"}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-muted hover:text-red-600 transition-colors disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
          {error && <span className="text-xs text-red-600 ml-1">{error}</span>}
        </div>
      </td>
    </tr>
  );
}

function AddRow() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createDiscountCode(fd);
      if (res.error) {
        setError(res.error);
      } else {
        setOpen(false);
        setError(null);
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <tr>
        <td colSpan={7} className="px-4 py-2">
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 text-sm text-accent hover:text-accent/80 font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Nuovo codice
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border bg-sky-50/40 dark:bg-sky-950/20">
      <td colSpan={7} className="px-4 py-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <DiscountFields />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-medium disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Crea
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-muted hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" /> Annulla
            </button>
            {error && <span className="text-xs text-red-600">{error}</span>}
          </div>
        </form>
      </td>
    </tr>
  );
}

export default function ScontiClient({ initialItems }: { initialItems: DiscountCode[] }) {
  const [items, setItems] = useState(initialItems);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-stone-50/60 dark:bg-stone-800/30">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                Codice
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                Sconto
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                Minimo
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                Utilizzi
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                Periodo
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                Stato
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <DiscountRow
                key={item.id}
                item={item}
                onDeleted={(id) => setItems((prev) => prev.filter((x) => x.id !== id))}
              />
            ))}
            <AddRow />
          </tbody>
        </table>
      </div>
    </div>
  );
}
