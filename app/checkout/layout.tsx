import { noIndexMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = noIndexMetadata(`Checkout | ${SITE.name}`);

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
