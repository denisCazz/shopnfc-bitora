import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata("Il mio account | Shop NFC");

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
