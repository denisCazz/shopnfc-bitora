import { NextRequest, NextResponse } from "next/server";
import { sendQuoteRequestEmails } from "@/lib/email";
import {
  QUOTE_FORMATS,
  QUOTE_FORMAT_LABELS,
  QUOTE_MAX_FILES,
  QUOTE_MAX_TOTAL_BYTES,
  QUOTE_PROGRAMMING,
  QUOTE_PROGRAMMING_LABELS,
  makeQuoteId,
  saveQuoteFiles,
  validateQuoteFile,
  type QuoteAttachment,
  type QuoteFormat,
  type QuoteProgramming,
} from "@/lib/quote-request";

const WINDOW_MS = 10 * 60_000;
const MAX_HITS = 5;
const hitsByIp = new Map<string, number[]>();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local"
  );
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hitsByIp.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_HITS) {
    hitsByIp.set(ip, recent);
    return true;
  }
  recent.push(now);
  hitsByIp.set(ip, recent);
  return false;
}

function field(fd: FormData, key: string, max = 200): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: NextRequest) {
  let fd: FormData;
  try {
    fd = await req.formData();
  } catch {
    return bad("Richiesta non valida.");
  }

  // Honeypot: bots fill every field; pretend success so they don't retry.
  if (field(fd, "website")) {
    return NextResponse.json({ ok: true, quoteId: makeQuoteId() });
  }

  if (rateLimited(clientIp(req))) {
    return bad("Troppe richieste. Riprova tra qualche minuto o scrivici su WhatsApp.", 429);
  }

  const name = field(fd, "name", 120);
  const email = field(fd, "email", 160);
  const phone = field(fd, "phone", 40);
  const company = field(fd, "company", 160);
  const formatRaw = field(fd, "format", 20);
  const programmingRaw = field(fd, "programming", 20);
  const programmingValue = field(fd, "programmingValue", 1000);
  const notes = field(fd, "notes", 3000);
  const productName = field(fd, "productName", 200);
  const locale = field(fd, "locale", 5) || "it";
  const quantity = Math.floor(Number(field(fd, "quantity", 10)));

  if (!name) return bad("Inserisci il tuo nome.");
  if (!EMAIL_RE.test(email)) return bad("Inserisci un indirizzo email valido.");
  if (!Number.isFinite(quantity) || quantity < 1 || quantity > 1_000_000) {
    return bad("Indica una quantità valida.");
  }
  const format: QuoteFormat = (QUOTE_FORMATS as readonly string[]).includes(formatRaw)
    ? (formatRaw as QuoteFormat)
    : "other";
  const programming: QuoteProgramming = (QUOTE_PROGRAMMING as readonly string[]).includes(programmingRaw)
    ? (programmingRaw as QuoteProgramming)
    : "tbd";

  const uploads = fd.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (uploads.length > QUOTE_MAX_FILES) {
    return bad(`Puoi allegare al massimo ${QUOTE_MAX_FILES} file.`);
  }

  const attachments: QuoteAttachment[] = [];
  for (const [i, file] of uploads.entries()) {
    const result = await validateQuoteFile(file, `allegato-${i + 1}`);
    if (!result.ok) return bad(result.error);
    attachments.push(result.file);
  }

  const totalBytes = attachments.reduce((sum, a) => sum + a.bytes.length, 0);
  if (totalBytes > QUOTE_MAX_TOTAL_BYTES) {
    return bad("Allegati troppo pesanti (max 25 MB in totale). Riduci le foto o mandale su WhatsApp.");
  }

  const quoteId = makeQuoteId();
  try {
    if (attachments.length) await saveQuoteFiles(quoteId, attachments);
  } catch (error) {
    console.error("Quote files backup failed:", error);
  }

  const sent = await sendQuoteRequestEmails({
    quoteId,
    name,
    email,
    phone,
    company,
    format: QUOTE_FORMAT_LABELS[format],
    quantity,
    programming: QUOTE_PROGRAMMING_LABELS[programming],
    programmingValue,
    notes,
    productName,
    locale,
    attachments: attachments.map((a) => ({
      filename: a.fileName,
      content: a.bytes,
      contentType: a.mime,
    })),
  });

  if (!sent) {
    return bad(
      "Non siamo riusciti a inviare la richiesta. Riprova o scrivici direttamente su WhatsApp.",
      500
    );
  }

  return NextResponse.json({ ok: true, quoteId });
}
