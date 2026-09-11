import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata("Registrazione | Shop NFC");

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
