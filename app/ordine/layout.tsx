import { noIndexMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = noIndexMetadata(`Ordine | ${SITE.name}`);

export default function OrdineLayout({ children }: { children: React.ReactNode }) {
  return children;
}
