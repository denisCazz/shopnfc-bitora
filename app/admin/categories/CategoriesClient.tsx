"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Pencil, Trash2, Check, X, Loader2, Plus,
  Cog, Wind, Fan, Zap, Monitor, Cpu, Flame,
  Thermometer, CircleDot, RotateCw, Home, Package, Gauge, Wrench,
  CreditCard, StickyNote, Watch, Radio, Shield,
} from "lucide-react";

const ICON_OPTIONS = [
  "Cog", "Wind", "Fan", "Zap", "Monitor", "Cpu", "Flame",
  "Thermometer", "CircleDot", "RotateCw", "Home", "Package", "Gauge", "Wrench",
  "CreditCard", "StickyNote", "Watch", "Radio", "Shield",
] as const;

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Cog, Wind, Fan, Zap, Monitor, Cpu, Flame,
  Thermometer, CircleDot, RotateCw, Home, Package, Gauge, Wrench,
  CreditCard, StickyNote, Watch, Radio, Shield,
};

function CategoryIcon({ name }: { name: string | null }) {
  if (!name) return null;
  const Icon = iconMap[name];
  return Icon ? <Icon className="w-4 h-4 inline-block mr-1 text-accent" /> : null;
}

function IconSelect({ defaultValue }: { defaultValue: string | null }) {
  const [selected, setSelected] = useState(defaultValue ?? "");
  const SelectedIcon = selected ? iconMap[selected] : null;
  return (
    <div className="flex items-center gap-2">
      {SelectedIcon && <SelectedIcon className="w-4 h-4 text-accent shrink-0" />}
      <select
        name="icon"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="flex-1 px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50"
      >
        <option value="">— nessuna —</option>
        {ICON_OPTIONS.map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
    </div>
  );
}
import { createCategory, updateCategory, deleteCategory } from "@/app/admin/actions/categories";

type Category = {
  id: number;
  nameIt: string;
  nameEn: string | null;
  nameFr: string | null;
  nameEs: string | null;
  slug: string;
  icon: string | null;
  sortOrder: number;
  active: boolean;
  productCount: number;
};

function CategoryRow({
  cat,
  onDeleted,
}: {
  cat: Category;
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
      const res = await updateCategory(cat.id, fd);
      if (res.error) { setError(res.error); } else { setEditing(false); setError(null); router.refresh(); }
    });
  }

  function handleDelete() {
    if (!confirm(`Eliminare "${cat.nameIt}"?`)) return;
    startTransition(async () => {
      const res = await deleteCategory(cat.id);
      if (res.error) { setError(res.error); } else { onDeleted(cat.id); }
    });
  }

  if (editing) {
    return (
      <tr className="border-b border-border bg-sky-50/40 dark:bg-sky-950/20">
        <td colSpan={9} className="px-4 py-4">
          <form onSubmit={handleUpdate} className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <label className="block text-xs text-muted mb-1">Nome IT *</label>
                <input name="name_it" defaultValue={cat.nameIt} required
                  className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">EN</label>
                <input name="name_en" defaultValue={cat.nameEn ?? ""}
                  className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">FR</label>
                <input name="name_fr" defaultValue={cat.nameFr ?? ""}
                  className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">ES</label>
                <input name="name_es" defaultValue={cat.nameEs ?? ""}
                  className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <label className="block text-xs text-muted mb-1">Slug</label>
                <input name="slug" defaultValue={cat.slug}
                  className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:border-accent/50" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Icona</label>
                <IconSelect defaultValue={cat.icon} />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Ordinamento</label>
                <input name="sort_order" type="number" defaultValue={cat.sortOrder}
                  className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Attiva</label>
                <select name="active" defaultValue={cat.active ? "true" : "false"}
                  className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50">
                  <option value="true">Sì</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="submit" disabled={isPending}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-medium disabled:opacity-50">
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Salva
              </button>
              <button type="button" onClick={() => setEditing(false)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-muted hover:text-foreground">
                <X className="w-3.5 h-3.5" /> Annulla
              </button>
              {error && <span className="text-xs text-red-600">{error}</span>}
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border hover:bg-surface-hover/50 transition-colors">
      <td className="px-4 py-3 text-center">
        <CategoryIcon name={cat.icon} />
      </td>
      <td className="px-4 py-3 text-sm font-medium text-foreground">{cat.nameIt}</td>
      <td className="px-4 py-3 text-sm text-muted font-mono">{cat.slug}</td>
      <td className="px-4 py-3 text-sm text-muted">{cat.nameEn || "—"}</td>
      <td className="px-4 py-3 text-sm text-muted">{cat.nameFr || "—"}</td>
      <td className="px-4 py-3 text-sm text-muted">{cat.nameEs || "—"}</td>
      <td className="px-4 py-3 text-center">
        <span className={`inline-flex items-center justify-center w-8 h-6 rounded-full text-xs font-semibold ${cat.productCount > 0 ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400" : "bg-stone-100 dark:bg-stone-800 text-muted"}`}>
          {cat.productCount}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cat.active ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400" : "bg-gray-100 dark:bg-gray-800 text-muted"}`}>
          {cat.active ? "Attiva" : "Inattiva"}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(true)}
            className="p-1.5 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={handleDelete} disabled={isPending}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-muted hover:text-red-600 transition-colors disabled:opacity-50">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
          {error && <span className="text-xs text-red-600 ml-1">{error}</span>}
        </div>
      </td>
    </tr>
  );
}

function AddRow({ onAdded }: { onAdded: (c: Category) => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createCategory(fd);
      if (res.error) {
        setError(res.error);
      } else {
        setOpen(false);
        setError(null);
        (e.target as HTMLFormElement).reset();
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <tr>
        <td colSpan={9} className="px-4 py-2">
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 text-sm text-accent hover:text-accent/80 font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Nuova categoria
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border bg-sky-50/40 dark:bg-sky-950/20">
      <td colSpan={9} className="px-4 py-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <label className="block text-xs text-muted mb-1">Nome IT *</label>
              <input name="name_it" required placeholder="es. Bruciatori"
                className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">EN</label>
              <input name="name_en" placeholder="Burners"
                className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">FR</label>
              <input name="name_fr" placeholder="Brûleurs"
                className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">ES</label>
              <input name="name_es" placeholder="Quemadores"
                className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <label className="block text-xs text-muted mb-1">Slug (opzionale)</label>
              <input name="slug" placeholder="auto-generato"
                className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:border-accent/50" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Icona</label>
              <IconSelect defaultValue={null} />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Ordinamento</label>
              <input name="sort_order" type="number" defaultValue={0}
                className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Attiva</label>
              <select name="active" defaultValue="true"
                className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50">
                <option value="true">Sì</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="submit" disabled={isPending}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-medium disabled:opacity-50">
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Crea
            </button>
            <button type="button" onClick={() => setOpen(false)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-muted hover:text-foreground">
              <X className="w-3.5 h-3.5" /> Annulla
            </button>
            {error && <span className="text-xs text-red-600">{error}</span>}
          </div>
        </form>
      </td>
    </tr>
  );
}

export default function CategoriesClient({ initialCategories }: { initialCategories: Category[] }) {
  const [cats, setCats] = useState(initialCategories);

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-stone-50/60 dark:bg-stone-800/30">
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted uppercase tracking-wider">Icona</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Nome IT</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Slug</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">EN</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">FR</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">ES</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted uppercase tracking-wider">Prodotti</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Stato</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {cats.map((c) => (
              <CategoryRow key={c.id} cat={c} onDeleted={(id) => setCats((prev) => prev.filter((x) => x.id !== id))} />
            ))}
            <AddRow onAdded={(c) => setCats((prev) => [...prev, c])} />
          </tbody>
        </table>
      </div>
    </div>
  );
}
