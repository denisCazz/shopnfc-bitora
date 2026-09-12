import { noIndexMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = noIndexMetadata(`Accedi | ${SITE.name}`);

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
