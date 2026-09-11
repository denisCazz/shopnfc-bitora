"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Check, X, Loader2, Plus } from "lucide-react";
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "@/app/admin/actions/announcements";
import type {
  AnnouncementAudience,
  AnnouncementScheduleMode,
  AnnouncementSeverity,
} from "@/lib/types";

type Announcement = {
  id: number;
  messageIt: string;
  messageEn: string | null;
  messageFr: string | null;
  messageEs: string | null;
  severity: AnnouncementSeverity;
  audience: AnnouncementAudience;
  scheduleMode: AnnouncementScheduleMode;
  startsAt: Date | string | null;
  endsAt: Date | string | null;
  active: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
};

const severityLabel: Record<AnnouncementSeverity, string> = {
  info: "Info",
  warning: "Warning",
  critical: "Critico",
};

const audienceLabel: Record<AnnouncementAudience, string> = {
  users: "Utenti",
  admin: "Admin",
  both: "Entrambi",
};

function toDatetimeLocal(value: Date | string | null): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ScheduleFields({
  defaultMode,
  defaultStartsAt,
  defaultEndsAt,
}: {
  defaultMode: AnnouncementScheduleMode;
  defaultStartsAt: Date | string | null;
  defaultEndsAt: Date | string | null;
}) {
  const [mode, setMode] = useState<AnnouncementScheduleMode>(defaultMode);

  return (
    <>
      <div>
        <label className="block text-xs text-muted mb-1">Periodo</label>
        <select
          name="schedule_mode"
          value={mode}
          onChange={(e) => setMode(e.target.value as AnnouncementScheduleMode)}
          className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50"
        >
          <option value="always">Sempre</option>
          <option value="range">Range date</option>
        </select>
      </div>
      {mode === "range" && (
        <>
          <div>
            <label className="block text-xs text-muted mb-1">Dal</label>
            <input
              name="starts_at"
              type="datetime-local"
              required
              defaultValue={toDatetimeLocal(defaultStartsAt)}
              className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Al</label>
            <input
              name="ends_at"
              type="datetime-local"
              required
              defaultValue={toDatetimeLocal(defaultEndsAt)}
              className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50"
            />
          </div>
        </>
      )}
    </>
  );
}

function AnnouncementFields({
  item,
}: {
  item?: Pick<
    Announcement,
    | "messageIt"
    | "messageEn"
    | "messageFr"
    | "messageEs"
    | "severity"
    | "audience"
    | "scheduleMode"
    | "startsAt"
    | "endsAt"
    | "active"
  >;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-muted mb-1">Messaggio IT *</label>
          <textarea
            name="message_it"
            required
            rows={3}
            defaultValue={item?.messageIt ?? ""}
            placeholder="Testo italiano (obbligatorio)"
            className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50 resize-y"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Messaggio EN</label>
          <textarea
            name="message_en"
            rows={3}
            defaultValue={item?.messageEn ?? ""}
            placeholder="English (fallback IT)"
            className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50 resize-y"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Messaggio FR</label>
          <textarea
            name="message_fr"
            rows={3}
            defaultValue={item?.messageFr ?? ""}
            placeholder="Français (fallback IT)"
            className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50 resize-y"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Messaggio ES</label>
          <textarea
            name="message_es"
            rows={3}
            defaultValue={item?.messageEs ?? ""}
            placeholder="Español (fallback IT)"
            className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50 resize-y"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div>
          <label className="block text-xs text-muted mb-1">Severity</label>
          <select
            name="severity"
            defaultValue={item?.severity ?? "info"}
            className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50"
          >
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critico</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Destinatari</label>
          <select
            name="audience"
            defaultValue={item?.audience ?? "users"}
            className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-accent/50"
          >
            <option value="users">Utenti</option>
            <option value="admin">Admin</option>
            <option value="both">Entrambi</option>
          </select>
        </div>
        <ScheduleFields
          defaultMode={item?.scheduleMode ?? "always"}
          defaultStartsAt={item?.startsAt ?? null}
          defaultEndsAt={item?.endsAt ?? null}
        />
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
    </div>
  );
}

function AnnouncementRow({
  item,
  onDeleted,
}: {
  item: Announcement;
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
      const res = await updateAnnouncement(item.id, fd);
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
    if (!confirm("Eliminare questo avviso?")) return;
    startTransition(async () => {
      const res = await deleteAnnouncement(item.id);
      if (res.error) setError(res.error);
      else onDeleted(item.id);
    });
  }

  if (editing) {
    return (
      <tr className="border-b border-border bg-sky-50/40 dark:bg-sky-950/20">
        <td colSpan={6} className="px-4 py-4">
          <form onSubmit={handleUpdate} className="space-y-3">
            <AnnouncementFields item={item} />
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

  const period =
    item.scheduleMode === "always"
      ? "Sempre"
      : `${toDatetimeLocal(item.startsAt).replace("T", " ")} → ${toDatetimeLocal(item.endsAt).replace("T", " ")}`;

  return (
    <tr className="border-b border-border hover:bg-surface-hover/50 transition-colors">
      <td className="px-4 py-3 text-sm text-foreground max-w-md">
        <p className="line-clamp-2 whitespace-pre-wrap">{item.messageIt}</p>
        {(item.messageEn || item.messageFr || item.messageEs) && (
          <p className="text-[11px] text-muted mt-1">
            {[item.messageEn && "EN", item.messageFr && "FR", item.messageEs && "ES"]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
            item.severity === "critical"
              ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"
              : item.severity === "warning"
                ? "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400"
                : "bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400"
          }`}
        >
          {severityLabel[item.severity]}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-muted">{audienceLabel[item.audience]}</td>
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
      const res = await createAnnouncement(fd);
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
        <td colSpan={6} className="px-4 py-2">
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 text-sm text-accent hover:text-accent/80 font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Nuovo avviso
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border bg-sky-50/40 dark:bg-sky-950/20">
      <td colSpan={6} className="px-4 py-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <AnnouncementFields />
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

export default function AvvisiClient({ initialItems }: { initialItems: Announcement[] }) {
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
                Messaggio IT
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                Severity
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                Destinatari
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
              <AnnouncementRow
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
