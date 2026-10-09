import path from "path";

/** Customer files (quotes, print graphics, bank receipts). Must stay outside public/. */
export const PRIVATE_STORAGE_ROOT =
  process.env.PRIVATE_STORAGE_DIR || path.join(process.cwd(), "storage");

export type PrivateOrderFileKind = "graphics" | "receipts";

const SAFE_FILE_NAME = /^[0-9]+-[a-z0-9]+\.(png|pdf|jpg|webp|heic)$/;

export const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".heic": "image/heic",
};

export function privateDir(...segments: string[]): string {
  return path.join(PRIVATE_STORAGE_ROOT, ...segments);
}

/** Resolves an order file on disk, or null when any segment is unsafe. */
export function privateOrderFilePath(
  kind: PrivateOrderFileKind,
  orderId: number,
  fileName: string
): string | null {
  if (!Number.isInteger(orderId) || orderId <= 0) return null;
  if (!SAFE_FILE_NAME.test(fileName)) return null;
  return privateDir(kind, String(orderId), fileName);
}

/** URL served by app/uploads/[kind]/[orderId]/[file]/route.ts after an access check. */
export function privateOrderFileUrl(kind: PrivateOrderFileKind, orderId: number, fileName: string): string {
  return `/uploads/${kind}/${orderId}/${fileName}`;
}
