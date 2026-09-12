import { noIndexMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = noIndexMetadata(`Registrazione | ${SITE.name}`);

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
