"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Sparkles } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { whatsappUrl } from "@/lib/whatsapp";

const HIDDEN_PREFIXES = ["/admin", "/checkout", "/login", "/register", "/ordine"];

export default function QuoteFab() {
  const pathname = usePathname() || "/";
  const { t } = useLocale();

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  const onQuotePage = pathname.startsWith("/preventivo");
  const targetHref = pathname === "/" ? "#ai-assistant" : "/#ai-assistant";

  const button =
    "group relative flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition hover:-translate-y-0.5";
  const tip =
    "pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100 md:block";

  return (
    <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end gap-2.5">
      {!onQuotePage && (
        <Link
          href={targetHref}
          aria-label="Assistente AI Carrello"
          className={`${button} bg-sky-500 shadow-sky-500/30 hover:bg-sky-400`}
        >
          <Sparkles className="h-5 w-5" />
          <span className={tip}>Carrello AI Istantaneo</span>
        </Link>
      )}
      <a
        href={whatsappUrl(t("fab.wa_text"))}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
        className={`${button} bg-[#1f8f4e] shadow-green-900/25 hover:bg-[#22a358]`}
      >
        <MessageCircle className="h-5 w-5" />
        <span className={tip}>WhatsApp</span>
      </a>
    </div>
  );
}
