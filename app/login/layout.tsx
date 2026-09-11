import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata("Accedi | Shop NFC");

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
