"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

export default function CookieBanner() {
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!localStorage.getItem("cookie_consent")) {
        setVisible(true);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const accept = () => {
    localStorage.setItem("cookie_consent", "1");
    window.dispatchEvent(new Event("cookie-consent-accepted"));
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4"
        >
          <div className="max-w-2xl mx-auto bg-surface border border-border rounded-2xl p-5 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="hidden sm:flex w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-800 items-center justify-center shrink-0 mt-0.5">
                <Cookie className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-relaxed mb-1">
                  {t("cookie.message")}
                </p>
                <p className="text-xs text-muted leading-relaxed">
                  {t("cookie.details")}{" "}
                  <Link
                    href="/cookie-policy"
                    className="text-accent hover:underline underline-offset-2"
                  >
                    {t("cookie.more_info")}
                  </Link>
                </p>
              </div>
              <button
                onClick={accept}
                className="shrink-0 p-1.5 rounded-lg hover:bg-surface-hover transition-colors hidden sm:block"
                aria-label={t("sidebar.close")}
              >
                <X className="w-4 h-4 text-muted hover:text-foreground transition-colors" />
              </button>
            </div>
              <div className="flex gap-3 mt-4 sm:ml-14 flex-wrap">
              <button
                onClick={accept}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-sky-500/25 transition-all duration-200"
              >
                {t("cookie.accept")}
              </button>
              <Link
                href="/cookie-policy"
                className="px-5 py-2 rounded-xl border border-border text-sm font-medium text-muted hover:bg-surface-hover hover:text-foreground transition-all duration-200"
              >
                {t("cookie.settings")}
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
