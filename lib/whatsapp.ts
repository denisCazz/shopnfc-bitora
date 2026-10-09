import { SITE } from "@/lib/site";

export function whatsappUrl(text?: string): string {
  return text
    ? `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`
    : `https://wa.me/${SITE.whatsapp}`;
}
