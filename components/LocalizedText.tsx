"use client";

import { useLocale } from "@/lib/locale-context";
import React from "react";

/**
 * Renders the correct translation based on the active locale.
 * Accepts `it`, `en`, `fr`, `es` props and a `fallback` string.
 * Designed to be embedded in server components that pass pre-fetched translations.
 */
export default function LocalizedText({
  it,
  en,
  fr,
  es,
  fallback,
  as: Tag,
  className,
}: {
  it?: string;
  en?: string;
  fr?: string;
  es?: string;
  fallback: string;
  as?: React.ElementType;
  className?: string;
}) {
  const { locale } = useLocale();
  const texts: Record<string, string | undefined> = { it, en, fr, es };
  const text = texts[locale] || it || fallback;

  if (Tag) {
    return <Tag className={className}>{text}</Tag>;
  }
  return <>{text}</>;
}
