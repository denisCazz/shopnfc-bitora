"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Check, X, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { createChip, updateChip, deleteChip } from "@/app/admin/actions/chips";

type Stove = {
  id: number;
  nameIt: string;
  nameEn: string | null;
  nameFr: string | null;
  nameEs: string | null;
  slug: string;
  active: boolean;
  sortOrder: number;
  categoria: string | null;
  potenza: string | null;
  dimensioni: string | null;
  peso: string | null;
};

function StoveRow({
  stove,
  onDeleted,
}: {
  stove: Stove;
  onDeleted: (id: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateChip(stove.id, fd);
      if (res.error) { setError(res.error); } else { setEditing(false); setError(null); }
    });
  }

  function handleDelete() {
    if (!confirm(`Eliminare "${stove.nameIt}"?`)) return;
    startTransition(async () => {
      const res = await deleteChip(stove.id);
      if (res.error) { setError(res.error); } else { onDeleted(stove.id); }
    });
  }

  if (editing) {
    return (
      <tr className="border-b border-border bg-sky-50/40 dark:bg-sky-950/20">
        <td colSpan={6} className="px-4 py-4">
          <form onSubmit={handleUpdate} className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <label className="block text-xs text-muted mb-1">Nome IT *</label>
                <input name="name_it" defaultValue={stove.nameIt} required
                  className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">EN</label>
                <input name="name_en" defaultValue={stove.nameEn ?? ""}
                  className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">FR</label>
                <input name="name_fr" defaultValue={stove.nameFr ?? ""}
                  className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">ES</label>
                <input name="name_es" defaultValue={stove.nameEs ?? ""}
                  className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-muted mb-1">Categoria</label>
                <input name="categoria" defaultValue={stove.categoria ?? ""}
                  placeholder="es. NXP NTAG"
                  className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Potenza</label>
                <input name="potenza" defaultValue={stove.potenza ?? ""}
                  placeholder="es. 144 byte"
                  className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Dimensioni</label>
                <input name="dimensioni" defaultValue={stove.dimensioni ?? ""}
                  placeholder="es. ISO 14443-A"
                  className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Peso</label>
                <input name="peso" defaultValue={stove.peso ?? ""}
                  placeholder="es. Type 2"
                  className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50" />
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

  const hasDetails = stove.potenza || stove.dimensioni || stove.peso || stove.categoria;

  return (
    <>
      <tr className="border-b border-border hover:bg-surface-hover/50 transition-colors">
        <td className="px-4 py-3 text-sm font-medium text-foreground">
          <div className="flex items-center gap-2">
            {stove.nameIt}
            {hasDetails && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-muted hover:text-foreground transition-colors"
                title={expanded ? "Nascondi dettagli" : "Mostra dettagli"}
              >
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-muted">{stove.categoria || "—"}</td>
        <td className="px-4 py-3 text-sm text-muted">{stove.potenza || "—"}</td>
        <td className="px-4 py-3 text-sm text-muted">{stove.peso || "—"}</td>
        <td className="px-4 py-3">
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${stove.active ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400" : "bg-gray-100 dark:bg-gray-800 text-muted"}`}>
            {stove.active ? "Attiva" : "Inattiva"}
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
          </div>
        </td>
      </tr>
      {expanded && hasDetails && (
        <tr className="border-b border-border bg-stone-50/50 dark:bg-stone-800/20">
          <td colSpan={6} className="px-4 py-3">
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              {stove.categoria && (
                <div>
                  <dt className="text-xs text-muted mb-0.5">Categoria</dt>
                  <dd className="font-medium text-foreground">{stove.categoria}</dd>
                </div>
              )}
              {stove.potenza && (
                <div>
                  <dt className="text-xs text-muted mb-0.5">Potenza</dt>
                  <dd className="font-medium text-foreground">{stove.potenza}</dd>
                </div>
              )}
              {stove.dimensioni && (
                <div>
                  <dt className="text-xs text-muted mb-0.5">Dimensioni</dt>
                  <dd className="font-medium text-foreground">{stove.dimensioni}</dd>
                </div>
              )}
              {stove.peso && (
                <div>
                  <dt className="text-xs text-muted mb-0.5">Peso</dt>
                  <dd className="font-medium text-foreground">{stove.peso}</dd>
                </div>
              )}
            </dl>
          </td>
        </tr>
      )}
    </>
  );
}

function AddRow({ onAdded }: { onAdded: (s: Stove) => void }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createChip(fd);
      if (res.error) {
        setError(res.error);
      } else {
        (e.target as HTMLFormElement).reset();
        setOpen(false);
        setError(null);
        // Refresh is handled by revalidatePath in the server action
      }
    });
  }

  if (!open) {
    return (
      <div className="p-4">
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-sky-500/25 transition-all">
          <Plus className="w-4 h-4" />
          Aggiungi chip
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-sky-50/40 dark:bg-sky-950/20 border-t border-border">
      <h3 className="text-sm font-semibold text-foreground mb-3">Nuovo chip</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-muted mb-1">Nome IT *</label>
            <input name="name_it" required placeholder="es. NXP NTAG213"
              className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50" />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">EN</label>
            <input name="name_en" placeholder="English name"
              className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50" />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">FR</label>
            <input name="name_fr" placeholder="Nom français"
              className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50" />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">ES</label>
            <input name="name_es" placeholder="Nombre español"
              className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted mb-1">Categoria</label>
            <input name="categoria" placeholder="es. NXP NTAG"
              className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50" />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Potenza</label>
            <input name="potenza" placeholder="es. 144 byte"
              className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50" />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Dimensioni</label>
            <input name="dimensioni" placeholder="es. ISO 14443-A"
              className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50" />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Peso</label>
            <input name="peso" placeholder="es. Type 2"
              className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="submit" disabled={isPending}
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold disabled:opacity-50">
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Aggiungi
          </button>
          <button type="button" onClick={() => { setOpen(false); setError(null); }}
            className="px-4 py-2 rounded-lg border border-border text-sm text-muted hover:text-foreground">
            Annulla
          </button>
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      </form>
    </div>
  );
}

export default function ChipsClient({ initialChips }: { initialChips: Stove[] }) {
  const [stoveList, setStoveList] = useState<Stove[]>(initialChips);
  const [sortByName, setSortByName] = useState(false);

  const visibleStoves = useMemo(() => {
    if (!sortByName) return stoveList;

    return [...stoveList].sort((a, b) =>
      a.nameIt.localeCompare(b.nameIt, "it", { sensitivity: "base" })
    );
  }, [sortByName, stoveList]);

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-end px-4 py-3 border-b border-border bg-background">
        <label className="inline-flex items-center gap-2 text-sm text-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={sortByName}
            onChange={(e) => setSortByName(e.target.checked)}
            className="h-4 w-4 rounded border-border text-accent focus:ring-accent/40"
          />
          Ordina per nome
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-background">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Modello</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Categoria</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Potenza</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Peso</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Stato</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {visibleStoves.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted">
                  Nessun chip aggiunto. Clicca &ldquo;Aggiungi chip&rdquo; per iniziare.
                </td>
              </tr>
            ) : (
              visibleStoves.map((s) => (
                <StoveRow
                  key={s.id}
                  stove={s}
                  onDeleted={(id) => setStoveList((prev) => prev.filter((x) => x.id !== id))}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      <AddRow onAdded={(s) => setStoveList((prev) => [...prev, s])} />
    </div>
  );
}
