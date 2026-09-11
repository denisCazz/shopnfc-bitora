"use client";

import { useLocale } from "@/lib/locale-context";

export default function TranslatedText({
  k,
  className,
  as: Tag = "span",
}: {
  k: string;
  className?: string;
  as?: "span" | "p" | "h1" | "h2" | "h3" | "h4" | "div";
}) {
  const { t } = useLocale();
  return <Tag className={className}>{t(k)}</Tag>;
}
