import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata("Ordine | Shop NFC");

export default function OrdineLayout({ children }: { children: React.ReactNode }) {
  return children;
}
