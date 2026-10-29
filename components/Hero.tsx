"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Phone } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { SITE } from "@/lib/site";
import AiShopAssistant from "@/components/AiShopAssistant";

const tiles = [
  { src: "/products/tessere-nfc-pvc-ntag213.png", key: "hero.cat_cards", href: "/categories/tessere-nfc" },
  { src: "/products/tag-nfc-ntag213-22mm-bianchi.png", key: "hero.cat_sticker", href: "/categories/sticker-nfc" },
  { src: "/products/braccialetti-nfc-silicone-ntag213.png", key: "hero.cat_bands", href: "/categories/braccialetti-nfc" },
  { src: "/products/portachiavi-nfc-ntag213.png", key: "hero2.cat_keyfobs", href: "/categories/gadget-nfc" },
];

export default function Hero() {
  const { t } = useLocale();

  return (
    <section id="ai-assistant" className="relative overflow-hidden bg-slate-950 text-white scroll-mt-16">
      <div className="pointer-events-none absolute -right-40 -top-48 h-[520px] w-[520px] rounded-full bg-sky-500/20 blur-[130px]" />

      <div className="relative mx-auto max-w-[1200px] px-5 py-9 md:px-8 md:py-11 space-y-8">
        <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-sky-300">
              {t("hero2.eyebrow")}
            </p>
            <h1 className="text-[clamp(1.85rem,3.8vw,2.9rem)] font-bold leading-[1.04] tracking-[-0.04em]">
              Descrivi cosa ti serve: l&apos;AI ti prepara il carrello pronto da acquistare
            </h1>
            <p className="mt-3 max-w-[600px] text-base leading-relaxed text-slate-300">
              Non serve aspettare un preventivo. Scrivi per cosa userai i tag NFC (o quanti te ne servono):
              l&apos;intelligenza artificiale sceglie gli articoli giusti dal catalogo, applica la programmazione
              inclusa e pre-compila il tuo carrello con il prezzo immediato.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <span>{t("hero2.proof")}</span>
              <a
                href="#prodotti"
                className="inline-flex items-center gap-1 font-semibold text-sky-300 hover:text-sky-200"
              >
                {t("hero2.cta_shop")}
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
              <span>·</span>
              <a href={`tel:${SITE.phoneTel}`} className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white">
                <Phone className="h-3.5 w-3.5" />
                {SITE.phone}
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="hidden grid-cols-2 gap-3 lg:grid w-full lg:max-w-[430px] lg:justify-self-end"
          >
            {tiles.map((tile) => (
              <Link
                key={tile.key}
                href={tile.href}
                className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-white"
              >
                <Image
                  src={tile.src}
                  alt={t(tile.key)}
                  fill
                  sizes="220px"
                  priority
                  className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute bottom-2.5 left-2.5 rounded-full bg-slate-950/85 px-3 py-1 text-xs font-semibold text-white">
                  {t(tile.key)}
                </span>
              </Link>
            ))}
          </motion.div>
        </div>

        {/* Interactive AI Cart Configurator */}
        <AiShopAssistant variant="hero" />
      </div>
    </section>
  );
}
