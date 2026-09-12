import { noIndexMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = noIndexMetadata(`Il mio account | ${SITE.name}`);

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
