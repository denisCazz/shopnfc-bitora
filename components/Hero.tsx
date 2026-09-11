"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  Headphones,
  CreditCard,
  StickyNote,
  Watch,
  Radio,
  Cpu,
} from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import Link from "next/link";

const featureKeys = [
  { icon: Truck, key: "hero.feat_shipping" },
  { icon: ShieldCheck, key: "hero.feat_warranty" },
  { icon: Headphones, key: "hero.feat_support" },
];

const categoryKeys = [
  { icon: StickyNote, key: "hero.cat_sticker", href: "/categories/sticker-nfc" },
  { icon: CreditCard, key: "hero.cat_cards", href: "/categories/tessere-nfc" },
  { icon: Watch, key: "hero.cat_bands", href: "/categories/braccialetti-nfc" },
  { icon: Radio, key: "hero.cat_readers", href: "/categories/lettori-nfc" },
  { icon: Cpu, key: "hero.cat_industrial", href: "/categories/tag-industriali" },
];

export default function Hero() {
  const { t } = useLocale();

  return (
    <section className="relative overflow-hidden bg-slate-100">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(148,163,184,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.18) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        <div className="absolute top-0 right-0 w-[640px] h-[640px] bg-sky-400/15 rounded-full blur-[140px] -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[420px] h-[420px] bg-slate-300/40 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
      </div>

      <div className="relative max-w-[1120px] mx-auto px-6 md:px-12 lg:px-8 py-16 md:py-24 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <motion.p
              initial={{ opacity: 1, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="eyebrow mb-5"
            >
              {t("hero.badge")}
            </motion.p>

            <motion.h1
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-[clamp(2.4rem,6vw,4.4rem)] font-bold tracking-[-0.04em] leading-[0.96] mb-6 text-slate-900"
            >
              {t("hero.title_1")}{" "}
              <span className="text-slate-700">{t("hero.title_2")}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 1, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base md:text-lg text-slate-600 leading-relaxed mb-9 max-w-lg"
            >
              {t("hero.description")}
            </motion.p>

            <motion.div
              initial={{ opacity: 1, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-3"
            >
              <a href="#prodotti" className="sl-btn-primary">
                {t("hero.cta_catalog")}
                <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#contatti" className="sl-btn-secondary">
                {t("hero.cta_contact")}
              </a>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 1, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="hidden md:block"
          >
            <div className="grid grid-cols-2 gap-3">
              {categoryKeys.map((cat, i) => (
                <Link
                  key={cat.key}
                  href={cat.href}
                  className={`group relative rounded-[1.25rem] bg-white border border-slate-200 p-5 lg:p-6 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm transition-all duration-300 ${
                    i === 4 ? "col-span-2" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                    <cat.icon className="w-5 h-5 text-slate-700" />
                  </div>
                  <h3 className="text-slate-800 font-semibold text-sm lg:text-base tracking-tight">
                    {t(cat.key)}
                  </h3>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 1, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-14 pt-8 border-t border-slate-200"
        >
          <div className="flex flex-wrap justify-center md:justify-start gap-6 md:gap-10">
            {featureKeys.map((f) => (
              <div key={f.key} className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                  <f.icon className="w-4 h-4 text-slate-700" />
                </div>
                <span className="text-sm text-slate-600">{t(f.key)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
