"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  FileText,
  Loader2,
  MessageCircle,
  Paperclip,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Zap,
  X,
} from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { SITE } from "@/lib/site";
import type { QuoteFormat } from "@/lib/quote-request";
import { whatsappUrl } from "@/lib/whatsapp";
import AiShopAssistant from "@/components/AiShopAssistant";

type Programming = "url" | "vcard" | "text" | "none" | "tbd";

const MAX_FILES = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

const PROGRAMMING: Programming[] = ["url", "vcard", "text", "none", "tbd"];
const QUICK_QTY = [10, 50, 100, 500, 1000];

export default function PreventivoClient({
  initialFormat,
  product,
  user,
}: {
  initialFormat: QuoteFormat;
  product: { name: string; slug: string; minQuantity: number } | null;
  user: { name: string; email: string } | null;
}) {
  const { t, locale } = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showManualQuoteForm, setShowManualQuoteForm] = useState(false);
  const [format, setFormat] = useState<QuoteFormat>(initialFormat);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [quantity, setQuantity] = useState<number>(Math.max(product?.minQuantity ?? 10, 10));
  const [programming, setProgramming] = useState<Programming>("tbd");
  const [programmingValue, setProgrammingValue] = useState("");
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentId, setSentId] = useState<string | null>(null);

  const formatLabel = t(`quote.format_${format}`);

  const defaultAiPrompt = useMemo(() => {
    if (product) {
      return `Vorrei acquistare ${Math.max(product.minQuantity, 20)} pezzi di ${product.name}`;
    }
    if (initialFormat === "bracelet") {
      return "Mi servono 50 braccialetti NFC impermeabili pronti all'uso";
    }
    if (initialFormat === "sticker") {
      return "Mi servono 50 sticker NFC adesivi compatibili con smartphone";
    }
    return "Vorrei 30 tessere NFC personalizzate col mio logo pronte all'uso";
  }, [product, initialFormat]);

  const waMessage = useMemo(() => {
    const lines = [
      t("quote.wa_intro"),
      `• ${t("quote.field_format")}: ${formatLabel}`,
      `• ${t("quote.field_quantity")}: ${quantity} pz`,
      `• ${t("quote.field_programming")}: ${t(`quote.prog_${programming}`)}`,
    ];
    if (product) lines.push(`• ${t("quote.wa_product")}: ${product.name}`);
    if (sentId) lines.push(`• Rif. ${sentId}`);
    else if (attachments.length) lines.push(t("quote.wa_photos"));
    return lines.join("\n");
  }, [attachments.length, formatLabel, product, programming, quantity, sentId, t]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    setError(null);
    const next = [...attachments];
    for (const f of Array.from(list)) {
      if (f.size > MAX_FILE_BYTES) {
        setError(t("quote.error_file_size").replace("{name}", f.name));
        continue;
      }
      if (next.length >= MAX_FILES) {
        setError(t("quote.error_file_count").replace("{max}", String(MAX_FILES)));
        break;
      }
      next.push(f);
    }
    setAttachments(next);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set("format", format);
      fd.set("quantity", String(quantity));
      fd.set("programming", programming);
      fd.set("locale", locale);
      if (product) fd.set("productName", product.name);
      for (const f of attachments) fd.append("files", f, f.name);

      const res = await fetch("/api/preventivo", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t("quote.error_generic"));
        return;
      }
      setSentId(data.quoteId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError(t("quote.error_generic"));
    } finally {
      setSending(false);
    }
  }

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition";

  if (sentId) {
    return (
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/40">
          <CheckCircle2 className="h-9 w-9 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">{t("quote.sent_title")}</h1>
        <p className="text-muted mb-2">{t("quote.sent_text").replace("{email}", email)}</p>
        <p className="text-sm text-muted mb-8">
          {t("quote.sent_ref")} <span className="font-mono font-semibold text-foreground">{sentId}</span>
        </p>
        <ol className="text-left max-w-md mx-auto space-y-3 mb-10">
          {["quote.next_1", "quote.next_2", "quote.next_3"].map((k, i) => (
            <li key={k} className="flex gap-3 items-start">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground text-sm font-bold">
                {i + 1}
              </span>
              <span className="text-sm text-foreground pt-1">{t(k)}</span>
            </li>
          ))}
        </ol>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={whatsappUrl(waMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1f8f4e] px-6 py-3 font-semibold text-white hover:bg-[#22a358]"
          >
            <MessageCircle className="h-4 w-4" />
            {t("quote.sent_wa")}
          </a>
          <Link href="/#prodotti" className="sl-btn-secondary">
            {t("quote.sent_catalog")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <section className="bg-slate-950 text-white">
        <div className="max-w-[1120px] mx-auto px-5 md:px-8 py-8 md:py-10 space-y-6">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-sky-200">
              <Sparkles className="h-3.5 w-3.5 text-sky-400" />
              Configuratore AI Istantaneo · Acquista Subito
            </p>
            <h1 className="text-[clamp(1.9rem,4vw,2.9rem)] font-bold leading-[1.04] tracking-[-0.04em] max-w-3xl">
              Non aspettare il preventivo: descrivi cosa ti serve e l&apos;AI ti prepara subito il carrello
            </h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              Scrivi per cosa userai i tag NFC (es. biglietti da visita, recensioni al tavolo, accessi dipendenti,
              braccialetti piscina): la nostra AI seleziona i prodotti giusti dal catalogo, calcola il prezzo
              immediato e ti permette di acquistare in 1 minuto.
            </p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              {[
                { icon: Zap, label: "Prezzo immediato e carrello già pronto" },
                { icon: CheckCircle2, label: "Programmazione NFC inclusa" },
                { icon: ShieldCheck, label: "Carichi il tuo logo al checkout o dopo l'ordine" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-slate-200">
                  <Icon className="h-4 w-4 text-sky-400 shrink-0" />
                  {label}
                </div>
              ))}
            </div>
          </div>

          <AiShopAssistant
            initialPrompt={defaultAiPrompt}
            formatHint={initialFormat}
            productSlugHint={product?.slug ?? null}
            autoRunOnMount
            variant="hero"
          />
        </div>
      </section>

      <div className="max-w-[1120px] mx-auto w-full px-4 md:px-8 py-8 md:py-10 space-y-10">
        {product && (
          <p className="rounded-xl border border-sky-200/70 dark:border-sky-800/50 bg-sky-50 dark:bg-sky-950/30 px-4 py-3 text-sm text-foreground">
            {t("quote.from_product")}{" "}
            <Link href={`/products/${product.slug}`} className="font-semibold text-accent hover:underline">
              {product.name}
            </Link>
          </p>
        )}

        {/* Secondary Fallback for Special Custom Batches / Manual Quote */}
        <div className="rounded-2xl border border-border bg-surface p-5 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base md:text-lg font-bold text-foreground">
                Hai una richiesta fuori catalogo o superi i 1.000 pezzi?
              </h2>
              <p className="text-xs md:text-sm text-muted mt-0.5">
                Per la maggior parte degli ordini puoi acquistare subito qui sopra con l&apos;AI. Se invece ti serve una
                quotazione manuale dedicata, apri il modulo preventivo tradizionale.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowManualQuoteForm((v) => !v)}
              className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-xs md:text-sm font-semibold text-foreground hover:border-accent/50 transition cursor-pointer"
            >
              {showManualQuoteForm ? "Nascondi modulo preventivo" : "Apri modulo preventivo manuale"}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showManualQuoteForm ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {showManualQuoteForm && (
            <form onSubmit={submit} className="space-y-10 pt-8 mt-6 border-t border-border">
              <section>
                <StepTitle n={1} title={t("quote.step2_title")} text={t("quote.step2_text")} />
                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-background p-5 space-y-5">
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-2">{t("quote.field_format")}</p>
                      <div className="flex flex-wrap gap-2">
                        {(["sticker", "card", "bracelet", "other"] as QuoteFormat[]).map((f) => (
                          <Chip key={f} active={format === f} onClick={() => setFormat(f)}>
                            {t(`quote.format_${f}`)}
                          </Chip>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label htmlFor="quote-qty" className="text-sm font-semibold text-foreground mb-2 block">
                        {t("quote.field_quantity")}
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        {QUICK_QTY.map((q) => (
                          <Chip key={q} active={quantity === q} onClick={() => setQuantity(q)}>
                            {q.toLocaleString("it-IT")}
                          </Chip>
                        ))}
                        <input
                          id="quote-qty"
                          type="number"
                          min={1}
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                          className={`${inputClass.replace("w-full ", "")} w-28`}
                        />
                        <span className="text-sm text-muted">pz</span>
                      </div>
                      <p className="mt-2 text-xs text-muted">{t("quote.qty_hint")}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-background p-5 space-y-4">
                    <p className="text-sm font-semibold text-foreground">{t("quote.field_programming")}</p>
                    <div className="flex flex-wrap gap-2">
                      {PROGRAMMING.map((p) => (
                        <Chip key={p} active={programming === p} onClick={() => setProgramming(p)}>
                          {t(`quote.prog_${p}`)}
                        </Chip>
                      ))}
                    </div>
                    {programming !== "none" && programming !== "tbd" && (
                      <textarea
                        name="programmingValue"
                        rows={3}
                        value={programmingValue}
                        onChange={(e) => setProgrammingValue(e.target.value)}
                        placeholder={t(`quote.prog_${programming}_placeholder`)}
                        className={`${inputClass} resize-none`}
                      />
                    )}
                    <p className="text-xs text-muted">{t("quote.prog_hint")}</p>
                  </div>
                </div>
              </section>

              <section>
                <StepTitle n={2} title={t("quote.step3_title")} text={t("quote.step3_text")} />
                <div className="rounded-2xl border border-border bg-background p-5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,application/pdf,.csv,.xlsx"
                    className="hidden"
                    onChange={(e) => {
                      addFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((f, i) => (
                      <FilePill
                        key={`${f.name}-${i}`}
                        name={f.name}
                        onRemove={() => setAttachments(attachments.filter((_, j) => j !== i))}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-2.5 text-sm font-medium text-foreground hover:border-accent/50"
                  >
                    <Paperclip className="h-4 w-4 text-accent" />
                    {t("quote.files_add")}
                  </button>
                  <p className="mt-2 text-xs text-muted">{t("quote.files_hint")}</p>
                </div>
              </section>

              <section>
                <StepTitle n={3} title={t("quote.step4_title")} text={t("quote.step4_text")} />
                <div className="rounded-2xl border border-border bg-background p-5 grid gap-4 sm:grid-cols-2">
                  <Field label={t("quote.field_name")} required>
                    <input name="name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                  </Field>
                  <Field label={t("quote.field_company")}>
                    <input name="company" autoComplete="organization" value={company} onChange={(e) => setCompany(e.target.value)} className={inputClass} />
                  </Field>
                  <Field label={t("quote.field_email")} required>
                    <input name="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                  </Field>
                  <Field label={t("quote.field_phone")}>
                    <input name="phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label={t("quote.field_notes")}>
                      <textarea
                        name="notes"
                        rows={4}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t("quote.notes_placeholder")}
                        className={`${inputClass} resize-none`}
                      />
                    </Field>
                  </div>
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
                </div>
              </section>

              <div className="rounded-3xl bg-slate-950 text-white p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6 justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-300 mb-2">{t("quote.summary")}</p>
                  <p className="text-xl font-bold">
                    {quantity.toLocaleString("it-IT")} pz · {formatLabel}
                  </p>
                  <p className="text-sm text-slate-300 mt-1">
                    {t(`quote.prog_${programming}`)} · {attachments.length} {t("quote.summary_files")}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={whatsappUrl(waMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3.5 font-semibold hover:bg-white/10"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {t("quote.cta_wa")}
                  </a>
                  <button
                    type="submit"
                    disabled={sending}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-500 px-7 py-3.5 font-bold text-white transition hover:bg-sky-400 disabled:opacity-60"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {sending ? t("quote.sending") : t("quote.cta_send")}
                  </button>
                </div>
              </div>
              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-800 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}
              <p className="text-xs text-muted text-center">
                {t("quote.privacy_note")}{" "}
                <Link href="/privacy" className="underline hover:text-accent">Privacy</Link>
                {" · "}
                <a href={`tel:${SITE.phoneTel}`} className="inline-flex items-center gap-1 hover:text-accent">
                  <Phone className="h-3 w-3" />
                  {SITE.phone}
                </a>
              </p>
            </form>
          )}
        </div>

        <section className="grid gap-4 md:grid-cols-3 pt-4">
          {["quote.faq_1", "quote.faq_2", "quote.faq_3"].map((k) => (
            <div key={k} className="rounded-2xl border border-border bg-surface p-5">
              <p className="font-semibold text-foreground mb-1.5">{t(`${k}_q`)}</p>
              <p className="text-sm text-muted leading-relaxed">{t(`${k}_a`)}</p>
            </div>
          ))}
        </section>
        <p className="text-center text-sm">
          <Link href="/come-acquistare" className="inline-flex items-center gap-1 font-semibold text-accent hover:underline">
            {t("quote.how_to_buy_link")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </p>
      </div>
    </main>
  );
}

function StepTitle({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <div className="flex gap-4 items-start mb-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground text-lg font-bold">
        {n}
      </span>
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">{title}</h2>
        <p className="text-sm text-muted mt-0.5">{text}</p>
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-accent bg-accent text-accent-foreground"
          : "border-border bg-background text-foreground hover:border-accent/50"
      }`}
    >
      {children}
    </button>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-foreground/80 mb-1.5">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

function FilePill({ name, onRemove }: { name: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background pl-3 pr-2 py-1 text-xs text-foreground max-w-full">
      <FileText className="h-3.5 w-3.5 text-accent shrink-0" />
      <span className="truncate max-w-[180px]">{name}</span>
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label="Rimuovi" className="rounded-full p-0.5 hover:bg-surface-hover">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </span>
  );
}
