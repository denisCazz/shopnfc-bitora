import { mkdir, readdir, rename, unlink, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { verifyPayload } from "@/lib/signed-payload";

export const CUSTOM_GRAPHIC_MAX_BYTES = 10 * 1024 * 1024;
export const CUSTOM_GRAPHIC_MIN_LONG_SIDE = 1000;
export const CUSTOM_GRAPHIC_PENDING_TTL_MS = 2 * 60 * 60 * 1000;

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46]; // %PDF

const GRAPHICS_ROOT = path.join(process.cwd(), "public", "uploads", "graphics");
const PENDING_DIR = path.join(GRAPHICS_ROOT, "pending");

export type CustomGraphicKind = "png" | "pdf";

export interface PendingGraphicToken {
  scope: "custom-graphic-pending";
  file: string;
  originalName: string;
  exp: number;
}

export interface ValidatedGraphic {
  kind: CustomGraphicKind;
  ext: ".png" | ".pdf";
  bytes: Uint8Array;
  originalName: string;
}

function startsWith(bytes: Uint8Array, magic: number[]): boolean {
  if (bytes.length < magic.length) return false;
  return magic.every((b, i) => bytes[i] === b);
}

function detectKind(bytes: Uint8Array): CustomGraphicKind | null {
  if (startsWith(bytes, PNG_MAGIC)) return "png";
  if (startsWith(bytes, PDF_MAGIC)) return "pdf";
  return null;
}

export function sanitizeOriginalName(name: string, ext: ".png" | ".pdf"): string {
  const base = path
    .basename(name || `grafica${ext}`)
    .replace(/[^\w.\- ()àèéìòùÀÈÉÌÒÙäöüÄÖÜßñÑçÇ]+/g, "_")
    .trim()
    .slice(0, 120);
  const lower = base.toLowerCase();
  if (lower.endsWith(ext)) return base || `grafica${ext}`;
  return `${base || "grafica"}${ext}`;
}

export function isSafeGraphicFileName(name: string): boolean {
  return /^[0-9]+-[a-z0-9]+\.(png|pdf)$/.test(name);
}

export function publicGraphicUrl(orderId: number, fileName: string): string {
  return `/uploads/graphics/${orderId}/${fileName}`;
}

function orderGraphicDir(orderId: number): string {
  return path.join(GRAPHICS_ROOT, String(orderId));
}

export async function validateCustomGraphic(file: File): Promise<
  { ok: true; graphic: ValidatedGraphic } | { ok: false; error: string; status: number }
> {
  if (file.size > CUSTOM_GRAPHIC_MAX_BYTES) {
    return { ok: false, error: "File troppo grande. Massimo 10 MB.", status: 400 };
  }
  if (file.size < 32) {
    return { ok: false, error: "File non valido.", status: 400 };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = detectKind(bytes);
  if (!kind) {
    return {
      ok: false,
      error: "Formato non supportato. Usa PNG o PDF.",
      status: 400,
    };
  }

  if (kind === "png") {
    try {
      const meta = await sharp(bytes).metadata();
      const width = meta.width ?? 0;
      const height = meta.height ?? 0;
      const longSide = Math.max(width, height);
      if (longSide < CUSTOM_GRAPHIC_MIN_LONG_SIDE) {
        return {
          ok: false,
          error: `La grafica PNG deve avere almeno ${CUSTOM_GRAPHIC_MIN_LONG_SIDE} pixel sul lato più lungo per garantire una stampa di qualità.`,
          status: 400,
        };
      }
    } catch {
      return { ok: false, error: "PNG non valido o danneggiato.", status: 400 };
    }
  }

  const ext = kind === "png" ? ".png" : ".pdf";
  return {
    ok: true,
    graphic: {
      kind,
      ext,
      bytes,
      originalName: sanitizeOriginalName(file.name, ext),
    },
  };
}

export function makePendingFileName(ext: ".png" | ".pdf"): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
}

export async function savePendingGraphic(
  graphic: ValidatedGraphic
): Promise<{ fileName: string; originalName: string }> {
  await mkdir(PENDING_DIR, { recursive: true });
  await cleanupPendingGraphics();
  const fileName = makePendingFileName(graphic.ext);
  await writeFile(path.join(PENDING_DIR, fileName), graphic.bytes);
  return { fileName, originalName: graphic.originalName };
}

export async function saveOrderGraphic(
  orderId: number,
  graphic: ValidatedGraphic
): Promise<{ url: string; originalName: string; fileName: string }> {
  const dir = orderGraphicDir(orderId);
  await mkdir(dir, { recursive: true });
  const fileName = makePendingFileName(graphic.ext);
  await writeFile(path.join(dir, fileName), graphic.bytes);
  return {
    url: publicGraphicUrl(orderId, fileName),
    originalName: graphic.originalName,
    fileName,
  };
}

export async function claimPendingGraphic(
  token: string,
  orderId: number
): Promise<
  | { ok: true; url: string; originalName: string }
  | { ok: false; error: string; status: number }
> {
  const payload = verifyPayload<PendingGraphicToken>(token);
  if (
    !payload ||
    payload.scope !== "custom-graphic-pending" ||
    !isSafeGraphicFileName(payload.file) ||
    !payload.exp ||
    Date.now() > payload.exp
  ) {
    return {
      ok: false,
      error: "Grafica scaduta o non valida. Ricarica il file.",
      status: 400,
    };
  }

  const pendingPath = path.join(PENDING_DIR, payload.file);
  const destDir = orderGraphicDir(orderId);
  await mkdir(destDir, { recursive: true });
  const destPath = path.join(destDir, payload.file);

  try {
    await rename(pendingPath, destPath);
  } catch {
    return {
      ok: false,
      error: "Grafica non trovata. Ricarica il file.",
      status: 400,
    };
  }

  const ext = path.extname(payload.file).toLowerCase() === ".pdf" ? ".pdf" : ".png";
  return {
    ok: true,
    url: publicGraphicUrl(orderId, payload.file),
    originalName: sanitizeOriginalName(payload.originalName || payload.file, ext),
  };
}

export async function deleteGraphicFile(url: string | null | undefined): Promise<void> {
  if (!url || !url.startsWith("/uploads/graphics/")) return;
  const relative = url.replace(/^\/uploads\/graphics\//, "");
  if (relative.includes("..")) return;
  const full = path.join(GRAPHICS_ROOT, relative);
  if (!full.startsWith(GRAPHICS_ROOT)) return;
  await unlink(full).catch(() => {});
}

async function cleanupPendingGraphics(): Promise<void> {
  try {
    const files = await readdir(PENDING_DIR);
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    await Promise.all(
      files.map(async (file) => {
        const ts = parseInt(file.split("-")[0] ?? "", 10);
        if (Number.isFinite(ts) && ts < cutoff) {
          await unlink(path.join(PENDING_DIR, file)).catch(() => {});
        }
      })
    );
  } catch {
    // directory may not exist yet
  }
}
