import { noIndexMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = noIndexMetadata(`Recupera password | ${SITE.name}`);

export default function RecuperaPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
