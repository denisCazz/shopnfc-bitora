import { noIndexMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = noIndexMetadata(`Reimposta password | ${SITE.name}`);

export default function ReimpostaPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
