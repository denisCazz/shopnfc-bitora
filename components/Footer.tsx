"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import ThemeToggle from "@/components/ThemeToggle";
import { SITE } from "@/lib/site";
import { whatsappUrl } from "@/lib/whatsapp";

const infoLinkKeys = [
  { key: "footer.info_how_to_buy", href: "/come-acquistare" },
  { key: "footer.info_terms", href: "/come-acquistare" },
  { key: "footer.info_returns", href: "/resi" },
  { key: "footer.info_privacy", href: "/privacy" },
  { key: "footer.info_cookie_policy", href: "/cookie-policy" },
  { key: "footer.info_contact", href: "#contatti" },
];

const catalogLinks = [
  { href: "/categories/sticker-nfc", label: "Sticker NFC" },
  { href: "/categories/tessere-nfc", label: "Tessere NFC" },
  { href: "/categories/braccialetti-nfc", label: "Braccialetti NFC" },
  { href: "/categories/tag-industriali", label: "Tag industriali" },
  { href: "/categories/tag-schermati", label: "Tag schermati" },
  { href: "/categories/gadget-nfc", label: "Gadget NFC" },
  { href: "/categories/lettori-nfc", label: "Lettori NFC" },
  { href: "/categories/soluzioni-nfc", label: "Soluzioni NFC" },
  { href: "/tag-nfc", label: "Tag NFC per aziende" },
  { href: "/tag-nfc-personalizzati", label: "Tag NFC personalizzati" },
  { href: "/assistente", label: "Assistente AI Carrello" },
  { href: "/tracking", label: "Traccia il tuo ordine" },
  { href: "/assistenza", label: "Assistenza" },
];

export default function Footer() {
  const { t } = useLocale();

  return (
    <footer id="contatti" className="border-t border-slate-200 bg-slate-700 text-slate-100">
      <div className="max-w-[1120px] mx-auto px-6 md:px-12 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          <div className="col-span-2 lg:col-span-1 flex flex-col items-start">
            <Link href="/" className="mb-4 flex items-center gap-2.5">
              <Image
                src={SITE.logo}
                alt={SITE.name}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover"
              />
              <span className="flex items-baseline gap-1 tracking-tight">
                <span className="text-[15px] font-semibold">Shop NFC</span>
                <span className="text-[15px] font-medium text-slate-300">Bitora</span>
              </span>
            </Link>
            <p className="text-sm text-slate-300 leading-relaxed">
              {t("footer.description")}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4">
              Contatti
            </h4>
            <div className="space-y-2.5 text-sm text-slate-300">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-white">{SITE.legalName}</span>
                  <br />
                  {SITE.addressCity}
                  <br />
                  P.IVA {SITE.vat}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <a href={`tel:${SITE.phoneTel}`} className="hover:text-white transition-colors">
                  {SITE.phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <a href={`mailto:${SITE.email}`} className="hover:text-white transition-colors break-all">
                  {SITE.email}
                </a>
              </div>
              <a
                href={whatsappUrl("Ciao, vorrei un preventivo per tag NFC.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 rounded-full bg-[#1f8f4e] text-white text-xs font-semibold hover:bg-[#22a358] transition-colors"
              >
                WhatsApp
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4">
              Catalogo
            </h4>
            <ul className="space-y-2">
              {catalogLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-300 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4">
              {t("footer.info")}
            </h4>
            <ul className="space-y-2">
              {infoLinkKeys.map((link) => (
                <li key={link.key}>
                  <Link href={link.href} className="text-sm text-slate-300 hover:text-white transition-colors">
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4">
              {t("footer.payments")}
            </h4>
            <div className="flex flex-col gap-1.5 mb-6">
              {[
                "Carta di credito e debito (Stripe)",
                "Apple Pay & Google Pay",
                "Bonifico Bancario Anticipato",
              ].map((m) => (
                <span key={m} className="inline-flex items-center gap-1.5 text-sm text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400/70 shrink-0" />
                  {m}
                </span>
              ))}
            </div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-3">
              Piattaforma
            </h4>
            <a
              href={SITE.parentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              {SITE.parentName} →
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-600">
        <div className="max-w-[1120px] mx-auto px-6 md:px-12 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} {SITE.legalName} · P.IVA {SITE.vat}. {t("footer.rights")}.
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              Un progetto{" "}
              <a
                href={SITE.parentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-white/80 hover:text-white transition-colors"
              >
                Bitora
              </a>
            </span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
