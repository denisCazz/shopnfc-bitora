"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Headphones,
  CircleUserRound,
  Cpu,
  Layers3,
  Phone,
  ScanLine,
  Sparkles,
} from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { SITE } from "@/lib/site";

const featureKeys = [
  { icon: Cpu, key: "hero.feat_programming" },
  { icon: Sparkles, key: "hero.feat_complete_service" },
  { icon: Headphones, key: "hero.feat_support" },
];

const serviceKeys = [
  { icon: Layers3, key: "hero.service_choose" },
  { icon: Cpu, key: "hero.service_program" },
  { icon: Sparkles, key: "hero.service_digitize" },
  { icon: ScanLine, key: "hero.service_apply" },
];

export default function Hero() {
  const { t } = useLocale();

  return (
    <section className="relative overflow-hidden bg-[#f8fbff]">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(148,163,184,0.13) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.13) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        <div className="absolute top-0 right-0 w-[640px] h-[640px] bg-sky-300/15 rounded-full blur-[140px] -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[420px] h-[420px] bg-white/80 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
      </div>

      <div className="relative max-w-[1120px] mx-auto px-5 py-12 md:px-10 md:py-14 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-[900px] text-center">
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
            className="mb-5 text-[clamp(2.4rem,6vw,4.25rem)] font-bold leading-[0.98] tracking-[-0.05em] text-slate-900"
          >
            <span className="block">{t("hero.title_1")}</span>
            <span className="block text-sky-700">{t("hero.title_2")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 1, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mb-7 max-w-[720px] text-base leading-relaxed text-slate-600 md:text-lg"
          >
            {t("hero.description")}
          </motion.p>

          <motion.div
            initial={{ opacity: 1, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center"
          >
            <a href="#prodotti" className="sl-btn-primary">
              {t("hero.cta_catalog")}
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={`tel:${SITE.phoneTel}`}
              className="sl-btn-secondary"
            >
              <Phone className="h-4 w-4" />
              {t("hero.cta_call")}
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 1, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 rounded-[2rem] border border-sky-100 bg-white/75 p-3 shadow-[0_24px_80px_rgba(14,116,144,0.08)] backdrop-blur-sm md:p-4"
        >
          <div className="grid items-stretch gap-3 lg:grid-cols-[1fr_1.15fr_1fr]">
            <div className="order-2 grid grid-cols-2 gap-3 lg:order-1 lg:grid-cols-1">
              {serviceKeys.slice(0, 2).map((service, index) => (
                <div key={service.key} className="rounded-2xl border border-slate-100 bg-white p-4 md:p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                      <service.icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-300">0{index + 1}</span>
                  </div>
                  <p className="text-sm font-semibold leading-snug text-slate-700 md:text-base">
                    {t(service.key)}
                  </p>
                </div>
              ))}
            </div>

            <div className="order-1 flex min-h-48 flex-col items-center justify-center rounded-[1.4rem] bg-sky-700 px-6 py-6 text-center text-white lg:order-2">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-white/10">
                <CircleUserRound className="h-7 w-7" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">
                {t("hero.customer_label")}
              </p>
              <p className="mt-2 max-w-xs text-lg font-semibold leading-snug">
                {t("hero.customer_goal")}
              </p>
              <p className="mt-4 max-w-xs text-xs leading-relaxed text-sky-100">
                {t("hero.bitora_signature")}
              </p>
            </div>

            <div className="order-3 grid grid-cols-2 gap-3 lg:grid-cols-1">
              {serviceKeys.slice(2).map((service, index) => (
                <div key={service.key} className="rounded-2xl border border-slate-100 bg-white p-4 md:p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                      <service.icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-300">0{index + 3}</span>
                  </div>
                  <p className="text-sm font-semibold leading-snug text-slate-700 md:text-base">
                    {t(service.key)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 1, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.65 }}
          className="mt-5 flex flex-wrap justify-center gap-x-8 gap-y-3"
        >
          {featureKeys.map((feature) => (
            <div key={feature.key} className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white">
                <feature.icon className="h-4 w-4 text-slate-700" />
              </div>
              <span className="text-sm text-slate-600">{t(feature.key)}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
