"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Check,
  Cpu,
  PackageCheck,
  Phone,
  Radio,
} from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { SITE } from "@/lib/site";

const featureKeys = [
  { icon: Cpu, key: "hero.feat_programming" },
  { icon: PackageCheck, key: "hero.feat_complete_service" },
  { icon: Building2, key: "hero.feat_support" },
];

const volumeKeys = [
  { amount: "10", key: "hero.volume_start" },
  { amount: "100", key: "hero.volume_grow" },
  { amount: "100.000", key: "hero.volume_scale" },
];

export default function Hero() {
  const { t } = useLocale();

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(125,211,252,0.45) 1px, transparent 1px), linear-gradient(to bottom, rgba(125,211,252,0.45) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        <div className="absolute -right-40 -top-48 h-[650px] w-[650px] rounded-full bg-sky-500/25 blur-[140px]" />
        <div className="absolute -bottom-56 left-1/4 h-[500px] w-[500px] rounded-full bg-cyan-400/15 blur-[130px]" />
      </div>

      <div className="relative mx-auto grid max-w-[1120px] items-center gap-12 px-5 py-14 md:px-10 md:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 lg:px-8 lg:py-24">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-sky-200"
          >
            <Building2 className="h-4 w-4" />
            {t("hero.badge")}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 text-[clamp(2.75rem,6.5vw,5.25rem)] font-bold leading-[0.92] tracking-[-0.055em]"
          >
            <span className="block">{t("hero.title_1")}</span>
            <span className="mt-2 block text-sky-400">{t("hero.title_2")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8 max-w-[650px] text-base leading-relaxed text-slate-300 md:text-lg"
          >
            {t("hero.description")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"
          >
            <a
              href="#prodotti"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-500 px-7 py-4 font-bold text-white transition hover:-translate-y-0.5 hover:bg-sky-400 hover:shadow-[0_12px_35px_rgba(14,165,233,0.3)]"
            >
              {t("hero.cta_catalog")}
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={`tel:${SITE.phoneTel}`}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-4 font-semibold text-white transition hover:border-white/35 hover:bg-white/10"
            >
              <Phone className="h-4 w-4" />
              {t("hero.cta_call")}
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-6"
          >
            {featureKeys.map((feature) => (
              <div key={feature.key} className="flex items-center gap-2 text-sm text-slate-300">
                <Check className="h-4 w-4 shrink-0 text-sky-400" />
                <span>{t(feature.key)}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, delay: 0.25 }}
          className="relative mx-auto w-full max-w-[470px]"
        >
          <div className="absolute -inset-6 rounded-[3rem] bg-sky-400/10 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.07] p-5 shadow-2xl backdrop-blur-xl md:p-7">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-300">
                  {t("hero.volume_label")}
                </p>
                <p className="mt-1 text-sm text-slate-400">{t("hero.volume_note")}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400 text-slate-950 shadow-[0_8px_30px_rgba(56,189,248,0.3)]">
                <Radio className="h-6 w-6" />
              </div>
            </div>

            <div className="space-y-3">
              {volumeKeys.map((volume, index) => (
                <motion.div
                  key={volume.amount}
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.45, delay: 0.45 + index * 0.12 }}
                  className={`flex items-center justify-between rounded-2xl border px-5 py-4 ${
                    index === 2
                      ? "border-sky-400/60 bg-sky-400 text-slate-950 shadow-[0_12px_35px_rgba(56,189,248,0.22)]"
                      : "border-white/10 bg-white/[0.06]"
                  }`}
                >
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${index === 2 ? "text-slate-700" : "text-slate-400"}`}>
                      {t(volume.key)}
                    </p>
                    <p className="mt-0.5 text-[clamp(2rem,7vw,3.2rem)] font-bold leading-none tracking-[-0.05em]">
                      {volume.amount}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold ${index === 2 ? "text-slate-800" : "text-sky-300"}`}>
                    {t("hero.pieces")}
                  </span>
                </motion.div>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <Cpu className="h-4 w-4 text-sky-300" />
              </div>
              <p className="text-sm leading-snug text-slate-300">{t("hero.volume_footer")}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
