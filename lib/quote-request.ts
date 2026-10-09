import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { privateDir } from "@/lib/private-storage";

export const QUOTE_MAX_FILES = 5;
export const QUOTE_MAX_FILE_BYTES = 10 * 1024 * 1024;
export const QUOTE_MAX_TOTAL_BYTES = 25 * 1024 * 1024;

export const QUOTE_FORMATS = ["sticker", "card", "bracelet", "other"] as const;
export type QuoteFormat = (typeof QUOTE_FORMATS)[number];

/** Maps a product category slug to the matching quote format. */
export function quoteFormatForCategory(slug: string | null | undefined): QuoteFormat | null {
  if (!slug) return null;
  if (slug.includes("tessere")) return "card";
  if (slug.includes("sticker")) return "sticker";
  if (slug.includes("braccial")) return "bracelet";
  return null;
}

export const QUOTE_PROGRAMMING = ["url", "vcard", "text", "none", "tbd"] as const;
export type QuoteProgramming = (typeof QUOTE_PROGRAMMING)[number];

export const QUOTE_FORMAT_LABELS: Record<QuoteFormat, string> = {
  sticker: "Sticker NFC",
  card: "Tessera PVC",
  bracelet: "Braccialetto",
  other: "Altro / da definire",
};

export const QUOTE_PROGRAMMING_LABELS: Record<QuoteProgramming, string> = {
  url: "URL / link",
  vcard: "vCard (biglietto da visita)",
  text: "Testo",
  none: "Nessuna (tag vergini)",
  tbd: "Da definire",
};

type Kind = { ext: string; mime: string };

function detectKind(bytes: Uint8Array, name: string): Kind | null {
  const at = (i: number, values: number[]) => values.every((v, j) => bytes[i + j] === v);
  if (at(0, [0x89, 0x50, 0x4e, 0x47])) return { ext: ".png", mime: "image/png" };
  if (at(0, [0xff, 0xd8, 0xff])) return { ext: ".jpg", mime: "image/jpeg" };
  if (at(0, [0x52, 0x49, 0x46, 0x46]) && at(8, [0x57, 0x45, 0x42, 0x50]))
    return { ext: ".webp", mime: "image/webp" };
  if (at(0, [0x25, 0x50, 0x44, 0x46])) return { ext: ".pdf", mime: "application/pdf" };
  if (at(4, [0x66, 0x74, 0x79, 0x70])) {
    const brand = String.fromCharCode(...bytes.slice(8, 12));
    if (["heic", "heix", "mif1", "msf1", "hevc"].includes(brand))
      return { ext: ".heic", mime: "image/heic" };
  }
  const lower = name.toLowerCase();
  if (lower.endsWith(".xlsx") && at(0, [0x50, 0x4b, 0x03, 0x04]))
    return { ext: ".xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };
  if (lower.endsWith(".csv") && !bytes.subarray(0, 4096).includes(0))
    return { ext: ".csv", mime: "text/csv" };
  return null;
}

export interface QuoteAttachment {
  fileName: string;
  originalName: string;
  mime: string;
  bytes: Buffer;
}

export async function validateQuoteFile(
  file: File,
  fallbackName: string
): Promise<{ ok: true; file: QuoteAttachment } | { ok: false; error: string }> {
  if (file.size > QUOTE_MAX_FILE_BYTES) {
    return { ok: false, error: `${file.name || fallbackName}: massimo 10 MB per file.` };
  }
  if (file.size < 32) return { ok: false, error: "File non valido." };
  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = detectKind(bytes, file.name || "");
  if (!kind) {
    return {
      ok: false,
      error: `${file.name || fallbackName}: formato non supportato. Usa JPG, PNG, WebP, HEIC, PDF, CSV o Excel (.xlsx).`,
    };
  }
  const base = path
    .basename(file.name || fallbackName)
    .replace(/\.[^.]+$/, "")
    .replace(/[^\w\-]+/g, "_")
    .slice(0, 60) || fallbackName;
  return {
    ok: true,
    file: {
      fileName: `${base}${kind.ext}`,
      originalName: file.name || `${fallbackName}${kind.ext}`,
      mime: kind.mime,
      bytes,
    },
  };
}

export function makeQuoteId(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `${ymd}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

/** Backup copy on disk; the email attachments are the primary delivery. */
export async function saveQuoteFiles(quoteId: string, files: QuoteAttachment[]) {
  const dir = privateDir("quotes", quoteId);
  await mkdir(dir, { recursive: true });
  await Promise.all(
    files.map((f, i) => writeFile(path.join(dir, `${i + 1}-${f.fileName}`), f.bytes))
  );
}
