"use client";

import { useRef, useState } from "react";
import { Upload, CheckCircle2, Loader2, FileText } from "lucide-react";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
const MAX_SIZE = 10 * 1024 * 1024;

export default function ReceiptUploader({
  orderId,
  token,
  existingUrl,
  className,
}: {
  orderId: number;
  token?: string;
  existingUrl?: string | null;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(
    existingUrl || null
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    if (!ALLOWED.includes(file.type)) {
      setError("Formato non supportato. Usa JPG, PNG, WebP o PDF.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("File troppo grande. Massimo 10 MB.");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (token) fd.append("token", token);

      const res = await fetch(`/api/orders/${orderId}/receipt`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Errore durante il caricamento");
        return;
      }
      setUploadedUrl(data.url);
    } catch {
      setError("Errore di connessione. Riprova.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      {uploadedUrl ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 px-4 py-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <span className="text-sm text-green-700 dark:text-green-300">
            Contabile caricata
          </span>
          <a
            href={uploadedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-green-700 dark:text-green-300 underline ml-1"
          >
            <FileText className="w-4 h-4" />
            Visualizza
          </a>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="text-xs text-muted hover:text-foreground underline ml-auto"
          >
            Sostituisci
          </button>
        </div>
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
              Caricamento…
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Carica contabile bonifico
            </>
          )}
        </button>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <p className="mt-2 text-xs text-muted">
        Formati: JPG, PNG, WebP o PDF. Max 10 MB.
      </p>
    </div>
  );
}
