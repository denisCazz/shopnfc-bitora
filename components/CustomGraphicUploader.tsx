"use client";

import { useRef, useState } from "react";
import { CheckCircle2, FileText, ImageIcon, Loader2, Upload, X } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

type Kind = "png" | "pdf";

export default function CustomGraphicUploader({
  mode,
  orderId,
  existingUrl,
  existingName,
  locked,
  disclaimerAccepted,
  onTokenChange,
  onBusyChange,
}: {
  mode: "pending" | "order";
  orderId?: number;
  existingUrl?: string | null;
  existingName?: string | null;
  locked?: boolean;
  disclaimerAccepted?: boolean;
  onTokenChange?: (token: string | null) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(existingUrl || null);
  const [name, setName] = useState<string | null>(existingName || null);
  const [kind, setKind] = useState<Kind | null>(
    existingUrl?.toLowerCase().endsWith(".pdf") ? "pdf" : existingUrl ? "png" : null
  );
  const [preview, setPreview] = useState<string | null>(
    existingUrl && !existingUrl.toLowerCase().endsWith(".pdf") ? existingUrl : null
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setBusy(busy: boolean) {
    setUploading(busy);
    onBusyChange?.(busy);
  }

  async function handleFile(file: File) {
    setError(null);
    if (!disclaimerAccepted) {
      setError(t("checkout.graphic_quality_required"));
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (mode === "order") fd.append("disclaimerAccepted", "true");

      const endpoint =
        mode === "order" && orderId
          ? `/api/orders/${orderId}/graphic`
          : "/api/checkout/graphic";

      const res = await fetch(endpoint, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("checkout.graphic_error"));
        return;
      }

      const nextKind: Kind = data.kind === "pdf" ? "pdf" : "png";
      setKind(nextKind);
      setName(data.originalName || file.name);
      if (mode === "pending") {
        setToken(data.token);
        onTokenChange?.(data.token);
        if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
        setPreview(nextKind === "png" ? URL.createObjectURL(file) : null);
        setUrl(null);
      } else {
        setUrl(data.url);
        setPreview(nextKind === "png" ? data.url : null);
      }
    } catch {
      setError(t("checkout.graphic_error"));
    } finally {
      setBusy(false);
    }
  }

  function clearPending() {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setToken(null);
    setUrl(null);
    setName(null);
    setKind(null);
    setPreview(null);
    setError(null);
    onTokenChange?.(null);
  }

  const attached = mode === "pending" ? !!token : !!url;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,application/pdf,.png,.pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      {attached ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 px-4 py-3">
          {kind === "png" && preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              className="h-14 w-14 rounded-lg object-contain bg-white border border-green-200 dark:border-green-800"
            />
          ) : (
            <FileText className="w-8 h-8 text-green-600 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-green-800 dark:text-green-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {t("checkout.graphic_uploaded")}
            </p>
            <p className="text-xs text-green-700/80 dark:text-green-400/80 truncate">
              {name}
            </p>
          </div>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-green-700 dark:text-green-300 underline"
            >
              {t("checkout.graphic_view")}
            </a>
          )}
          {!locked && (
            <>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="text-xs text-muted hover:text-foreground underline"
              >
                {t("checkout.graphic_replace")}
              </button>
              {mode === "pending" && (
                <button
                  type="button"
                  onClick={clearPending}
                  disabled={uploading}
                  className="text-muted hover:text-foreground"
                  aria-label={t("checkout.graphic_remove")}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      ) : locked ? (
        <p className="text-sm text-muted">{t("checkout.graphic_none")}</p>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface text-sm font-semibold text-foreground hover:border-accent hover:text-accent transition-colors disabled:opacity-60"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("checkout.graphic_uploading")}
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              {t("checkout.graphic_upload")}
            </>
          )}
        </button>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {!locked && (
        <p className="mt-2 text-xs text-muted flex items-start gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {t("checkout.graphic_formats")}
        </p>
      )}
    </div>
  );
}
