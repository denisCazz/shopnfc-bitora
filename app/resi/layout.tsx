import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Politica resi, recesso e garanzia",
  description:
    "Resi e recesso Shop NFC: esclusione per aziende e prodotti personalizzati, 14 giorni per i consumatori su merce non personalizzata, RMA obbligatorio e garanzia. Bitora, Carmagnola (TO).",
  path: "/resi",
});

export default function ResiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
