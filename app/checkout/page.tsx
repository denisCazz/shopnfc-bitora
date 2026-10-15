import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Phone, MessageCircle } from "lucide-react";
import Footer from "@/components/Footer";
import { SITE } from "@/lib/site";
import { whatsappUrl } from "@/lib/whatsapp";
import CheckoutClient from "./CheckoutClient";

export default function CheckoutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Secure Checkout Bar */}
      <header className="border-b border-border bg-surface/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image
              src={SITE.logo}
              alt={SITE.name}
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover"
              priority
            />
            <span className="flex items-baseline gap-1 tracking-tight">
              <span className="text-[15px] font-semibold text-foreground">Shop NFC</span>
              <span className="text-[15px] font-medium text-muted">Bitora</span>
            </span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 px-3 py-1.5 rounded-full">
              <ShieldCheck className="w-4 h-4" />
              Checkout Sicuro SSL 256-bit
            </div>
            <a
              href={`tel:${SITE.phoneTel}`}
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-foreground transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-accent" />
              {SITE.phone}
            </a>
            <a
              href={whatsappUrl("Ciao, avrei bisogno di supporto per completare l'ordine al checkout.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1f8f4e] text-white text-xs font-semibold hover:bg-[#22a358] transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Supporto WhatsApp</span>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Suspense
          fallback={
            <div className="max-w-6xl mx-auto px-4 py-10 text-sm text-muted">
              Caricamento checkout…
            </div>
          }
        >
          <CheckoutClient />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
