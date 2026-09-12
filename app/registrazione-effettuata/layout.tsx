import { noIndexMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = noIndexMetadata(`Registrazione effettuata | ${SITE.name}`);

export default function RegistrazioneEffettuataLayout({ children }: { children: React.ReactNode }) {
  return children;
}
