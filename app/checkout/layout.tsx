import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata("Checkout | Shop NFC");

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
