import { Resend } from "resend";
import { formatOrderNumber } from "@/lib/order-number";
import { SITE } from "@/lib/site";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

async function sendEmail(payload: Parameters<Resend["emails"]["send"]>[0]) {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY mancante: email non inviata", payload.subject);
    return;
  }
  await resend.emails.send(payload);
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || `${SITE.name} <onboarding@resend.dev>`;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "info@bitora.it";
/** Recipient for order and dealer notifications (business operational email) */
const ORDERS_EMAIL = process.env.ORDERS_EMAIL || ADMIN_EMAIL;

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE.url}${path}`;
}

function parseEmailList(env: string | undefined): string[] {
  if (!env?.trim()) return [];
  return env
    .split(",")
    .map((e) => e.trim())
    .filter((e) => e && EMAIL_RE.test(e));
}

const EMAIL_CC = parseEmailList(process.env.EMAIL_CC);
const EMAIL_BCC = parseEmailList(process.env.EMAIL_BCC);

// ============================================================
// ORDER EMAILS
// ============================================================

interface OrderItem {
  product_name: string;
  product_sku: string | null;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  line_total: number;
}

interface OrderEmailData {
  orderId: number;
  customerEmail: string;
  customerName: string;
  receiptUploadUrl?: string;
  customGraphicUrl?: string | null;
  customGraphicOriginalName?: string | null;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discountCode?: string | null;
  discountAmount?: number;
  total: number;
  paymentMethod: string;
  shippingAddress: {
    name?: string;
    address?: string;
    city?: string;
    zip?: string;
    province?: string;
    country?: string;
  };
  billingInfo?: {
    company?: string;
    vat_number?: string;
    sdi_code?: string;
    pec?: string;
  };
}

function getPaymentLabel(method: string): string {
  const labels: Record<string, string> = {
    stripe: "Carta di credito (Stripe)",
    paypal: "PayPal",
    satispay: "Satispay",
    bank_transfer: "Bonifico bancario",
    cod: "Contrassegno",
  };
  return labels[method] || method;
}

function formatEur(amount: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(amount);
}

function buildItemsTable(items: OrderItem[]): string {
  const rows = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px;">
          ${escapeHtml(item.product_name)}${item.product_sku ? ` <span style="color:#9ca3af">(${escapeHtml(item.product_sku)})</span>` : ""}
        </td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 14px;">${item.quantity}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 14px;">${formatEur(item.unit_price)}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 14px; font-weight: 600;">${formatEur(item.line_total)}</td>
      </tr>`
    )
    .join("");

  return `
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <thead>
        <tr style="background: #f9fafb;">
          <th style="padding: 8px 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Prodotto</th>
          <th style="padding: 8px 12px; text-align: center; font-size: 12px; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Qtà</th>
          <th style="padding: 8px 12px; text-align: right; font-size: 12px; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Prezzo</th>
          <th style="padding: 8px 12px; text-align: right; font-size: 12px; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Totale</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function bankTransferNote(): string {
  return `
    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 8px; font-weight: 600; color: #92400e;">Coordinate per il bonifico:</p>
      <p style="margin: 0; font-size: 14px; color: #78350f;">
        IBAN: <strong>IT76S0708461620000000920491</strong><br/>
        Intestatario: ${SITE.bankHolder}<br/>
        Causale: Ordine #[orderId]
      </p>
    </div>`;
}

/** Send order confirmation email to customer */
export async function sendOrderConfirmationEmail(data: OrderEmailData) {
  const paymentLabel = getPaymentLabel(data.paymentMethod);
  const addr = data.shippingAddress;

  let paymentNote = "";
  if (data.paymentMethod === "bank_transfer") {
    paymentNote = bankTransferNote().replace("[orderId]", formatOrderNumber(data.orderId));
    if (data.receiptUploadUrl) {
      paymentNote += `
    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 10px; font-size: 14px; color: #1e3a8a;">Carica la contabile del bonifico per consentire una verifica anticipata del pagamento e ridurre i tempi di attesa.</p>
      <a href="${escapeHtml(data.receiptUploadUrl)}" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Carica contabile</a>
    </div>`;
    }
  } else if (data.paymentMethod === "cod") {
    paymentNote = `<p style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 12px 16px; font-size: 14px; color: #166534; margin: 16px 0;">Il pagamento avverrà in contanti alla consegna. Supplemento contrassegno incluso nel totale.</p>`;
  }

  const billingHtml = data.billingInfo?.company
    ? `<p style="margin: 8px 0 0; font-size: 13px; color: #6b7280;">
        Fatturazione: ${escapeHtml(data.billingInfo.company)}${data.billingInfo.vat_number ? ` — P.IVA ${escapeHtml(data.billingInfo.vat_number)}` : ""}${data.billingInfo.sdi_code ? ` — SDI ${escapeHtml(data.billingInfo.sdi_code)}` : ""}
      </p>`
    : "";

  try {
    await sendEmail({
      from: FROM_EMAIL,
      to: data.customerEmail,
      ...(EMAIL_CC.length ? { cc: EMAIL_CC } : {}),
      ...(EMAIL_BCC.length ? { bcc: EMAIL_BCC } : {}),
      subject: `📬 Ordine ricevuto #${formatOrderNumber(data.orderId)} — ${SITE.name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
          <div style="background: linear-gradient(135deg, #0ea5e9, #dc2626); padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; color: white; font-size: 20px;">📬 Ordine ricevuto!</h1>
            <p style="margin: 4px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Ordine #${formatOrderNumber(data.orderId)}</p>
          </div>

          <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p>Ciao <strong>${escapeHtml(data.customerName)}</strong>,</p>
            <p>Grazie per il tuo ordine! Ecco il riepilogo:</p>

            ${buildItemsTable(data.items)}

            <table style="width: 100%; margin-top: 8px;">
              <tr><td style="padding: 4px 12px; font-size: 14px; color: #6b7280;">Subtotale</td><td style="padding: 4px 12px; text-align: right; font-size: 14px;">${formatEur(data.subtotal)}</td></tr>
              ${
                data.discountAmount && data.discountAmount > 0
                  ? `<tr><td style="padding: 4px 12px; font-size: 14px; color: #16a34a;">Sconto${data.discountCode ? ` (${escapeHtml(data.discountCode)})` : ""}</td><td style="padding: 4px 12px; text-align: right; font-size: 14px; color: #16a34a;">-${formatEur(data.discountAmount)}</td></tr>`
                  : ""
              }
              <tr><td style="padding: 4px 12px; font-size: 14px; color: #6b7280;">Spedizione</td><td style="padding: 4px 12px; text-align: right; font-size: 14px;">${formatEur(data.shippingCost)}</td></tr>
              <tr><td style="padding: 8px 12px; font-size: 16px; font-weight: 700; border-top: 2px solid #e5e7eb;">Totale</td><td style="padding: 8px 12px; text-align: right; font-size: 16px; font-weight: 700; border-top: 2px solid #e5e7eb; color: #0369a1;">${formatEur(data.total)}</td></tr>
            </table>

            <div style="margin-top: 20px; padding: 16px; background: #f9fafb; border-radius: 8px;">
              <p style="margin: 0; font-size: 13px; color: #6b7280;"><strong>Pagamento:</strong> ${paymentLabel}</p>
              <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;"><strong>Spedizione:</strong> ${escapeHtml(addr?.name || "")}, ${escapeHtml(addr?.address || "")}, ${escapeHtml(addr?.zip || "")} ${escapeHtml(addr?.city || "")} ${escapeHtml(addr?.province || "")} ${escapeHtml(addr?.country || "")}</p>
              ${billingHtml}
            </div>

            ${paymentNote}

            ${
              data.customGraphicUrl
                ? `<p style="margin: 16px 0 0; font-size: 13px; color: #6b7280;">Grafica di stampa allegata${data.customGraphicOriginalName ? ` (${escapeHtml(data.customGraphicOriginalName)})` : ""}. Ricordiamo che l'accettazione definitiva dell'ordine è subordinata alla verifica della grafica da parte del nostro fornitore: dopo l'inoltro dell'ordine, il fornitore ci fornirà una preview di stampa che ti invieremo per conferma. Se la accetti si prosegue in produzione, altrimenti l'ordine viene messo in stop e si rifà la grafica.</p>`
                : ""
            }

            <p style="margin-top: 24px; font-size: 13px; color: #6b7280;">
              Puoi consultare lo stato di avanzamento, la revisione grafica del fornitore e la spedizione in qualsiasi momento:
            </p>
            <p style="margin: 12px 0 0;">
              <a href="${SITE.url}/tracking?code=${encodeURIComponent(formatOrderNumber(data.orderId))}"
                 style="display: inline-block; padding: 11px 22px; background: #0369a1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                🚚 Traccia il tuo ordine #${formatOrderNumber(data.orderId)}
              </a>
            </p>

            <p style="margin-top: 30px; color: #6b7280; font-size: 13px;">— Il team ${SITE.name}</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send order confirmation email:", error);
  }
}

// ============================================================
// ORDER STATUS UPDATE EMAIL
// ============================================================

const STATUS_CONFIG: Record<string, { emoji: string; label: string; color: string; message: string }> = {
  pending:          { emoji: "⏳", label: "In attesa",                        color: "#d97706", message: "Il tuo ordine è in attesa di conferma. Ti aggiorneremo a breve." },
  order_received:   { emoji: "📥", label: "Ordine ricevuto",                  color: "#0284c7", message: "Abbiamo ricevuto il tuo ordine e preso in carico la pratica." },
  awaiting_payment: { emoji: "🏦", label: "In attesa di pagamento / bonifico", color: "#d97706", message: "Ordine registrato. Siamo in attesa dell'accredito o della contabile del bonifico bancario." },
  confirmed:        { emoji: "✅", label: "Confermato",                       color: "#2563eb", message: "Il tuo ordine è stato confermato e sarà messo in lavorazione." },
  graphic_review:   { emoji: "🎨", label: "Grafica in revisione dal fornitore", color: "#d97706", message: "Abbiamo ricevuto la tua grafica e inoltrato l'ordine al nostro fornitore, che sta elaborando la preview ufficiale di stampa da sottoporti." },
  preview_sent:     { emoji: "🖼️", label: "Preview del fornitore inviata — In attesa di tua conferma", color: "#0284c7", message: "Il nostro fornitore ha fornito la preview di stampa del tuo ordine! Controllala e facci sapere: se la accetti si prosegue in produzione, altrimenti l'ordine viene messo in stop e si rifà la grafica." },
  graphic_accepted: { emoji: "✅", label: "Preview / Grafica accettata — Si prosegue!",  color: "#16a34a", message: "Ottime notizie! La preview grafica del fornitore è stata accettata. L'ordine prosegue ora in fase di stampa e programmazione NFC." },
  graphic_rejected: { emoji: "🛑", label: "Ordine in STOP — Si rifà la grafica", color: "#dc2626", message: "La grafica o la preview non è stata accettata: l'ordine è temporaneamente in STOP. Carica il nuovo file grafico corretto nella tua area ordini o inviacelo su WhatsApp così potremo richiedere una nuova preview al fornitore." },
  processing:       { emoji: "🔧", label: "In produzione (Stampa & NFC)",     color: "#4f46e5", message: "Il tuo ordine è in fase di stampa e programmazione/codifica dei chip NFC nel nostro laboratorio." },
  quality_check:    { emoji: "🔍", label: "Controllo qualità e collaudo NFC", color: "#4f46e5", message: "Stiamo effettuando il test di lettura/scrittura sui chip NFC e la verifica finale prima dell'imballaggio." },
  ready_to_ship:    { emoji: "📦", label: "Pronto per la spedizione",         color: "#7c3aed", message: "Il tuo ordine è imballato ed etichettato, pronto per il ritiro da parte del corriere espresso." },
  shipped:          { emoji: "🚚", label: "Spedito / Affidato al corriere",   color: "#7c3aed", message: "Il tuo pacco è stato affidato al corriere espresso e sta viaggiando verso di te!" },
  in_transit:       { emoji: "🚚", label: "In transito presso il corriere",   color: "#7c3aed", message: "La spedizione è in transito attraverso gli hub del corriere verso la filiale di destinazione." },
  out_for_delivery: { emoji: "🛵", label: "In consegna oggi",                 color: "#059669", message: "Il corriere ha messo in consegna la tua spedizione nella giornata di oggi." },
  delivered:        { emoji: "📦", label: "Consegnato",                       color: "#16a34a", message: `Il tuo pacco risulta consegnato. Grazie per aver scelto ${SITE.name}!` },
  exception:        { emoji: "⚠️", label: "Eccezione corriere / Giacenza",    color: "#dc2626", message: "Il corriere ha segnalato un imprevisto o un'eccezione sulla consegna. Controlla i dettagli sul tracking." },
  cancelled:        { emoji: "❌", label: "Annullato",                        color: "#dc2626", message: "Il tuo ordine è stato annullato. Contattaci per qualsiasi chiarimento." },
};

export async function sendOrderStatusUpdateEmail({
  orderId,
  customerEmail,
  customerName,
  status,
  trackingNumber,
}: {
  orderId: number;
  customerEmail: string;
  customerName: string;
  status: string;
  trackingNumber?: string | null;
}) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return; // unknown status, skip

  const trackingHtml =
    ["shipped", "in_transit", "out_for_delivery", "ready_to_ship"].includes(status) && trackingNumber
      ? `<div style="background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 10px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; font-size: 14px; color: #5b21b6; font-weight: 600;">📬 Numero di tracking corriere</p>
          <p style="margin: 8px 0 0; font-size: 20px; font-weight: 700; color: #4c1d95; letter-spacing: 1px;">${escapeHtml(trackingNumber)}</p>
          <p style="margin: 6px 0 0; font-size: 12px; color: #7c3aed;">Usa questo codice nella nostra pagina di tracking o sul sito del corriere per seguire la spedizione.</p>
        </div>`
      : "";

  try {
    await sendEmail({
      from: FROM_EMAIL,
      to: customerEmail,
      ...(EMAIL_CC.length ? { cc: EMAIL_CC } : {}),
      ...(EMAIL_BCC.length ? { bcc: EMAIL_BCC } : {}),
      subject: `${cfg.emoji} Ordine #${formatOrderNumber(orderId)}: ${cfg.label} — ${SITE.name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
          <div style="background: linear-gradient(135deg, #0ea5e9, #dc2626); padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; color: white; font-size: 22px;">${cfg.emoji} ${cfg.label}</h1>
            <p style="margin: 4px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Ordine #${formatOrderNumber(orderId)}</p>
          </div>

          <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="margin: 0 0 12px;">Ciao <strong>${escapeHtml(customerName)}</strong>,</p>

            <div style="background: #f9fafb; border-left: 4px solid ${cfg.color}; border-radius: 0 8px 8px 0; padding: 14px 18px; margin: 16px 0;">
              <p style="margin: 0; font-size: 15px; color: #374151;">${cfg.message}</p>
            </div>

            ${trackingHtml}

            <p style="margin-top: 24px;">
              <a href="${SITE.url}/tracking?code=${encodeURIComponent(formatOrderNumber(orderId))}"
                 style="display: inline-block; padding: 11px 22px; background: linear-gradient(135deg, #0ea5e9, #dc2626); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin-right: 8px;">
                🚚 Traccia il tuo ordine
              </a>
              <a href="${SITE.url}/account/orders"
                 style="display: inline-block; padding: 11px 18px; background: #f3f4f6; color: #374151; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                Area ordini
              </a>
            </p>

            <p style="margin-top: 30px; color: #6b7280; font-size: 13px;">
              Per assistenza rispondi a questa email o scrivici a <a href="mailto:${ADMIN_EMAIL}" style="color: #0369a1;">${ADMIN_EMAIL}</a>.<br/>
              — Il team ${SITE.name}
            </p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send order status update email:", error);
  }
}

/** Notify admin about a new order */
export async function sendNewOrderAdminNotification(data: OrderEmailData) {
  const paymentLabel = getPaymentLabel(data.paymentMethod);

  try {
    await sendEmail({
      from: FROM_EMAIL,
      to: ORDERS_EMAIL,
      ...(EMAIL_BCC.length ? { bcc: EMAIL_BCC } : {}),
      subject: `Nuovo ordine #${formatOrderNumber(data.orderId)} — ${formatEur(data.total)}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0369a1;">Nuovo ordine #${formatOrderNumber(data.orderId)}</h2>
          <table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
            <tr><td style="padding: 6px 0; font-weight: 600; font-size: 14px;">Cliente</td><td style="padding: 6px 0; font-size: 14px;">${escapeHtml(data.customerName)} (${escapeHtml(data.customerEmail)})</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600; font-size: 14px;">Pagamento</td><td style="padding: 6px 0; font-size: 14px;">${paymentLabel}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600; font-size: 14px;">Totale</td><td style="padding: 6px 0; font-size: 14px; font-weight: 700; color: #0369a1;">${formatEur(data.total)}</td></tr>
            ${
              data.customGraphicUrl
                ? `<tr><td style="padding: 6px 0; font-weight: 600; font-size: 14px;">Grafica</td><td style="padding: 6px 0; font-size: 14px;"><a href="${escapeHtml(absoluteUrl(data.customGraphicUrl))}">${escapeHtml(data.customGraphicOriginalName || "Apri file")}</a></td></tr>`
                : ""
            }
          </table>

          ${buildItemsTable(data.items)}

          <p style="margin-top: 16px;"><a href="https://shopnfc.bitora.it/admin/orders" style="display: inline-block; padding: 10px 20px; background: #0369a1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Gestisci ordini</a></p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send admin order notification:", error);
  }
}

/** Notify admin that a customer uploaded a bank transfer receipt */
export async function sendReceiptUploadedAdminNotification({
  orderId,
  customerName,
  receiptUrl,
}: {
  orderId: number;
  customerName: string;
  receiptUrl: string;
}) {
  try {
    await sendEmail({
      from: FROM_EMAIL,
      to: ORDERS_EMAIL,
      ...(EMAIL_BCC.length ? { bcc: EMAIL_BCC } : {}),
      subject: `Contabile bonifico caricata — Ordine #${orderId}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0369a1;">Contabile bonifico ricevuta</h2>
          <p style="font-size: 14px;">Il cliente <strong>${escapeHtml(customerName)}</strong> ha caricato la contabile del bonifico per l'ordine <strong>#${orderId}</strong>.</p>
          <p style="margin: 20px 0;">
            <a href="${escapeHtml(absoluteUrl(receiptUrl))}" style="display: inline-block; padding: 10px 20px; background: #0369a1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Visualizza contabile</a>
          </p>
          <p style="margin-top: 16px;"><a href="https://shopnfc.bitora.it/admin/orders" style="color: #0369a1; font-size: 14px;">Gestisci ordini</a></p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send receipt uploaded notification:", error);
  }
}

/** Notify admin that a customer uploaded print artwork */
export async function sendCustomGraphicUploadedAdminNotification({
  orderId,
  customerName,
  graphicUrl,
  originalName,
}: {
  orderId: number;
  customerName: string;
  graphicUrl: string;
  originalName: string;
}) {
  try {
    await sendEmail({
      from: FROM_EMAIL,
      to: ORDERS_EMAIL,
      ...(EMAIL_BCC.length ? { bcc: EMAIL_BCC } : {}),
      subject: `Grafica caricata — Ordine #${formatOrderNumber(orderId)}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0369a1;">Grafica di stampa ricevuta</h2>
          <p style="font-size: 14px;">Il cliente <strong>${escapeHtml(customerName)}</strong> ha caricato la grafica per l'ordine <strong>#${formatOrderNumber(orderId)}</strong>${originalName ? ` (${escapeHtml(originalName)})` : ""}.</p>
          <p style="margin: 20px 0;">
            <a href="${escapeHtml(graphicUrl)}" style="display: inline-block; padding: 10px 20px; background: #0369a1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Apri grafica</a>
          </p>
          <p style="margin-top: 16px;"><a href="https://shopnfc.bitora.it/admin/orders" style="color: #0369a1; font-size: 14px;">Gestisci ordini</a></p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send custom graphic uploaded notification:", error);
  }
}

// ============================================================
// QUOTE REQUESTS
// ============================================================

export interface QuoteRequestEmailData {
  quoteId: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  format: string;
  quantity: number;
  programming: string;
  programmingValue: string;
  notes: string;
  productName: string;
  locale: string;
  attachments: { filename: string; content: Buffer; contentType: string }[];
}

function quoteRow(label: string, value: string) {
  return `<tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600; width: 38%; vertical-align: top;">${label}</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; white-space: pre-line;">${value ? escapeHtml(value) : "—"}</td></tr>`;
}

/** Returns false when the admin notification could not be delivered. */
export async function sendQuoteRequestEmails(data: QuoteRequestEmailData): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY mancante: preventivo non inviato", data.quoteId);
    return process.env.NODE_ENV !== "production";
  }

  const waText = encodeURIComponent(
    `Ciao ${data.name}, sono Denis di Shop NFC Bitora: ho ricevuto la tua richiesta di preventivo ${data.quoteId}.`
  );
  const digits = data.phone.replace(/\D/g, "").replace(/^00/, "");
  const waPhone = digits.length > 0 && digits.length <= 10 ? `39${digits}` : digits;
  const waLink = waPhone ? `https://wa.me/${waPhone}?text=${waText}` : "";

  const adminHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 640px; margin: 0 auto; color: #1f2937;">
      <h2 style="color: #0369a1; margin-bottom: 4px;">Nuova richiesta di preventivo</h2>
      <p style="margin-top: 0; color: #6b7280; font-size: 13px;">Rif. ${escapeHtml(data.quoteId)} · lingua ${escapeHtml(data.locale)}</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
        ${quoteRow("Nome", data.name)}
        ${quoteRow("Azienda", data.company)}
        ${quoteRow("Email", data.email)}
        ${quoteRow("Telefono", data.phone)}
        ${quoteRow("Prodotto di partenza", data.productName)}
        ${quoteRow("Formato", data.format)}
        ${quoteRow("Quantità", `${data.quantity} pz`)}
        ${quoteRow("Programmazione", data.programming)}
        ${quoteRow("Dati da programmare", data.programmingValue)}
        ${quoteRow("Note", data.notes)}
      </table>
      <p style="font-size: 14px;">Allegati: <strong>${data.attachments.length}</strong>.</p>
      <p style="margin: 20px 0;">
        <a href="mailto:${escapeHtml(data.email)}?subject=${encodeURIComponent(`Preventivo ${data.quoteId} — Shop NFC Bitora`)}" style="display: inline-block; padding: 10px 18px; background: #0369a1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin-right: 8px;">Rispondi via email</a>
        ${waLink ? `<a href="${escapeHtml(waLink)}" style="display: inline-block; padding: 10px 18px; background: #1f8f4e; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Scrivi su WhatsApp</a>` : ""}
      </p>
    </div>
  `;

  const adminResult = await resend.emails.send({
    from: FROM_EMAIL,
    to: ORDERS_EMAIL,
    replyTo: data.email,
    ...(EMAIL_BCC.length ? { bcc: EMAIL_BCC } : {}),
    subject: `Preventivo ${data.quoteId} — ${data.quantity} pz ${data.format}${data.company ? ` · ${data.company}` : ""}`,
    html: adminHtml,
    attachments: data.attachments,
  });
  if (adminResult.error) {
    console.error("Quote admin email failed:", adminResult.error);
    return false;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      replyTo: ORDERS_EMAIL,
      subject: `Abbiamo ricevuto la tua richiesta — ${SITE.name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
          <div style="background: #0f172a; padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; color: white; font-size: 20px;">Richiesta ricevuta</h1>
            <p style="margin: 6px 0 0; color: #7dd3fc; font-size: 13px;">Rif. ${escapeHtml(data.quoteId)}</p>
          </div>
          <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p>Ciao <strong>${escapeHtml(data.name)}</strong>,</p>
            <p>grazie! Abbiamo ricevuto la tua richiesta per <strong>${data.quantity} pz — ${escapeHtml(data.format)}</strong>.</p>
            <p><strong>Cosa succede ora:</strong></p>
            <ol style="padding-left: 18px; line-height: 1.6;">
              <li>Controlliamo grafica e quantità con il nostro fornitore di produzione.</li>
              <li>Entro 24 ore lavorative ti mandiamo prezzo, tempi e l'esito della verifica di idoneità grafica (non viene inviata anteprima di stampa; l'accettazione dell'ordine è subordinata all'approvazione della grafica da parte del fornitore).</li>
              <li>Approvi e procedi: realizziamo, programmiamo e spediamo.</li>
            </ol>
            <p>Hai fretta? Scrivici su <a href="https://wa.me/${SITE.whatsapp}" style="color: #0369a1;">WhatsApp</a> o chiama il <strong>${SITE.phone}</strong> citando il riferimento.</p>
            <p style="margin-top: 30px; color: #6b7280; font-size: 13px;">— Il team ${SITE.name}</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Quote confirmation email failed:", error);
  }

  return true;
}

/** Notify admin that a new dealer has registered and needs approval */
export async function sendDealerRegistrationNotification({
  companyName,
  vatNumber,
  dealerName,
  dealerEmail,
  phone,
}: {
  companyName: string;
  vatNumber: string;
  dealerName: string;
  dealerEmail: string;
  phone: string;
}) {
  try {
    await sendEmail({
      from: FROM_EMAIL,
      to: ORDERS_EMAIL,
      ...(EMAIL_BCC.length ? { bcc: EMAIL_BCC } : {}),
      subject: `Nuova richiesta dealer: ${companyName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0369a1;">Nuova richiesta dealer</h2>
          <p>Un nuovo rivenditore si è registrato e attende approvazione.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Azienda</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(companyName)}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">P.IVA</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(vatNumber)}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Nome</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(dealerName)}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Email</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(dealerEmail)}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Telefono</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${phone ? escapeHtml(phone) : "—"}</td></tr>
          </table>
          <p>Accedi al <a href="https://shopnfc.bitora.it/admin/dealers" style="color: #0369a1;">pannello admin</a> per approvare o rifiutare la richiesta.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send dealer registration email:", error);
  }
}

/** Notify dealer that their request has been approved */
export async function sendDealerApprovedEmail({
  dealerEmail,
  companyName,
  discountPercent,
}: {
  dealerEmail: string;
  companyName: string;
  discountPercent: number;
}) {
  try {
    await sendEmail({
      from: FROM_EMAIL,
      to: dealerEmail,
      ...(EMAIL_CC.length ? { cc: EMAIL_CC } : {}),
      ...(EMAIL_BCC.length ? { bcc: EMAIL_BCC } : {}),
      subject: `Richiesta approvata — ${companyName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Richiesta approvata! ✓</h2>
          <p>Ciao,</p>
          <p>La tua richiesta come rivenditore per <strong>${escapeHtml(companyName)}</strong> è stata <strong>approvata</strong>.</p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #166534;">Il tuo sconto riservato</p>
            <p style="margin: 8px 0 0; font-size: 36px; font-weight: 700; color: #16a34a;">${discountPercent}%</p>
          </div>
          <p>Lo sconto verrà applicato automaticamente al tuo account. Accedi al sito per iniziare ad acquistare con i prezzi riservati.</p>
          <p style="margin-top: 30px;">
            <a href="https://shopnfc.bitora.it/login" style="display: inline-block; padding: 12px 24px; background: #0369a1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Accedi al tuo account</a>
          </p>
          <p style="margin-top: 30px; color: #6b7280; font-size: 13px;">— Il team ${SITE.name}</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send dealer approved email:", error);
  }
}

// ============================================================
// EMAIL VERIFICATION
// ============================================================

export async function sendEmailVerificationEmail({
  to,
  verificationUrl,
  name,
}: {
  to: string;
  verificationUrl: string;
  name?: string | null;
}) {
  try {
    await sendEmail({
      from: FROM_EMAIL,
      to,
      subject: `Conferma il tuo indirizzo email — ${SITE.name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
          <div style="background: linear-gradient(135deg, #0ea5e9, #dc2626); padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; color: white; font-size: 20px;">✉️ Conferma la tua email</h1>
          </div>
          <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p>Ciao${name ? ` <strong>${escapeHtml(name)}</strong>` : ""},</p>
            <p>Grazie per esserti registrato su ${SITE.name}! Clicca il pulsante qui sotto per confermare il tuo indirizzo email e attivare il tuo account.</p>
            <p style="text-align: center; margin: 32px 0;">
              <a href="${verificationUrl}" style="display: inline-block; padding: 14px 28px; background: #0369a1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">Conferma email</a>
            </p>
            <p style="font-size: 13px; color: #6b7280;">Il link è valido per 24 ore. Se non hai creato un account, ignora questa email.</p>
            <p style="font-size: 12px; color: #9ca3af; word-break: break-all;">Oppure copia questo link nel browser: ${verificationUrl}</p>
            <p style="margin-top: 30px; color: #6b7280; font-size: 13px;">— Il team ${SITE.name}</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send email verification email:", error);
  }
}

/** Notify dealer that their request has been rejected */
export async function sendDealerRejectedEmail({
  dealerEmail,
  companyName,
  reason,
}: {
  dealerEmail: string;
  companyName: string;
  reason: string | null;
}) {
  try {
    await sendEmail({
      from: FROM_EMAIL,
      to: dealerEmail,
      ...(EMAIL_CC.length ? { cc: EMAIL_CC } : {}),
      ...(EMAIL_BCC.length ? { bcc: EMAIL_BCC } : {}),
      subject: `Richiesta rivenditore — ${companyName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Richiesta non approvata</h2>
          <p>Ciao,</p>
          <p>La tua richiesta come rivenditore per <strong>${escapeHtml(companyName)}</strong> non è stata approvata.</p>
          ${reason ? `<div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin: 20px 0;"><p style="margin: 0; color: #991b1b;"><strong>Motivo:</strong> ${escapeHtml(reason)}</p></div>` : ""}
          <p>Per qualsiasi domanda, contattaci a <a href="mailto:info@bitora.it" style="color: #0369a1;">info@bitora.it</a> o al numero <strong>351 497 9670</strong>.</p>
          <p style="margin-top: 30px; color: #6b7280; font-size: 13px;">— Il team ${SITE.name}</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send dealer rejected email:", error);
  }
}

// ============================================================
// PASSWORD RESET
// ============================================================

export async function sendPasswordResetEmail({
  to,
  resetUrl,
  name,
}: {
  to: string;
  resetUrl: string;
  name?: string | null;
}) {
  try {
    await sendEmail({
      from: FROM_EMAIL,
      to,
      subject: `Reimposta la tua password — ${SITE.name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
          <div style="background: linear-gradient(135deg, #0ea5e9, #dc2626); padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; color: white; font-size: 20px;">🔑 Reimposta password</h1>
          </div>
          <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p>Ciao${name ? ` <strong>${escapeHtml(name)}</strong>` : ""},</p>
            <p>Hai richiesto di reimpostare la password del tuo account ${SITE.name}. Clicca il pulsante qui sotto per procedere.</p>
            <p style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" style="display: inline-block; padding: 14px 28px; background: #0369a1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">Reimposta password</a>
            </p>
            <p style="font-size: 13px; color: #6b7280;">Il link è valido per 1 ora. Se non hai richiesto il reset, ignora questa email — la tua password rimane invariata.</p>
            <p style="font-size: 12px; color: #9ca3af; word-break: break-all;">Oppure copia questo link nel browser: ${resetUrl}</p>
            <p style="margin-top: 30px; color: #6b7280; font-size: 13px;">— Il team ${SITE.name}</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send password reset email:", error);
  }
}
