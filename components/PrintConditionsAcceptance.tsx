"use client";

import { AlertTriangle } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

export default function PrintConditionsAcceptance({
  checked,
  onChange,
  id = "print-terms",
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
}) {
  const { t } = useLocale();

  return (
    <div className="space-y-3">
      {/* Avviso importante: Nessuna preview e approvazione subordinata al fornitore */}
      <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-100/90 dark:bg-amber-950/50 px-3.5 py-3 text-xs text-amber-950 dark:text-amber-100">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <p className="font-bold text-amber-950 dark:text-amber-50">
              {t("print.supplier_approval_title")}
            </p>
            <p>{t("print.supplier_approval_body")}</p>
          </div>
        </div>
      </div>

      <div className="max-h-52 overflow-y-auto rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 px-4 py-3 text-xs text-amber-950 dark:text-amber-100 leading-relaxed space-y-2">
        <p className="font-semibold text-sm">{t("print.conditions_title")}</p>
        <p>{t("print.conditions_default")}</p>
        <p>{t("print.conditions_black")}</p>
        <p>{t("print.conditions_color")}</p>
        <p>{t("print.conditions_offset")}</p>
        <p className="font-semibold">{t("print.conditions_file_title")}</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>{t("print.conditions_file_formats")}</li>
          <li>{t("print.conditions_file_bleed")}</li>
          <li>{t("print.conditions_file_safe")}</li>
          <li>{t("print.conditions_file_marks")}</li>
          <li>{t("print.conditions_file_color")}</li>
        </ul>
        <p>{t("print.conditions_design")}</p>
        <p className="font-semibold">{t("print.conditions_supplier_clause")}</p>
        <p className="font-semibold">{t("print.conditions_liability")}</p>
      </div>
      <label htmlFor={id} className="flex items-start gap-2.5 text-sm text-foreground cursor-pointer">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-sky-600"
        />
        <span>{t("print.conditions_accept")}</span>
      </label>
    </div>
  );
}
