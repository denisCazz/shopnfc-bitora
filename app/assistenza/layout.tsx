import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Assistenza clienti",
  description:
    "Assistenza Shop NFC Bitora: telefono, email e orari per ordini, programmazione tag e supporto tecnico. Bitora, Carmagnola (TO).",
  path: "/assistenza",
});

export default function AssistenzaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
