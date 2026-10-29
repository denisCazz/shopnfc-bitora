"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Phone, Sparkles } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { SITE } from "@/lib/site";

const tiles = [
  { src: "/products/tessere-nfc-pvc-ntag213.png", key: "hero.cat_cards", href: "/categories/tessere-nfc" },
  { src: "/products/tag-nfc-ntag213-22mm-bianchi.png", key: "hero.cat_sticker", href: "/categories/sticker-nfc" },
  { src: "/products/braccialetti-nfc-silicone-ntag213.png", key: "hero.cat_bands", href: "/categories/braccialetti-nfc" },
  { src: "/products/portachiavi-nfc-ntag213.png", key: "hero2.cat_keyfobs", href: "/categories/gadget-nfc" },
];

export default function Hero() {
  const { t } = useLocale();

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute -right-40 -top-48 h-[520px] w-[520px] rounded-full bg-sky-500/20 blur-[130px]" />

      <div className="relative mx-auto grid max-w-[1200px] items-center gap-10 px-5 py-9 md:px-8 md:py-11 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-sky-300">
            {t("hero2.eyebrow")}
          </p>
          <h1 className="text-[clamp(1.9rem,4vw,3.1rem)] font-bold leading-[1.02] tracking-[-0.04em]">
            {t("hero2.title")}
          </h1>
          <p className="mt-4 max-w-[560px] text-base leading-relaxed text-slate-300 md:text-lg">
            {t("hero2.subtitle")}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/assistente"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-500 px-7 py-3.5 font-bold text-white transition hover:-translate-y-0.5 hover:bg-sky-400 hover:shadow-[0_12px_35px_rgba(14,165,233,0.3)]"
            >
              <Sparkles className="h-4 w-4" />
              {t("hero.cta_preview")}
            </Link>
            <a
              href="#prodotti"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 font-semibold text-white transition hover:border-white/35 hover:bg-white/10"
            >
              {t("hero2.cta_shop")}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-400">
            <span>{t("hero2.proof")}</span>
            <a href={`tel:${SITE.phoneTel}`} className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white">
              <Phone className="h-3.5 w-3.5" />
              {SITE.phone}
            </a>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="hidden w-full grid-cols-2 gap-3 lg:grid lg:max-w-[480px] lg:justify-self-end"
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
                sizes="260px"
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
    </section>
  );
}
