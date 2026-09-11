import Link from "next/link";
import Footer from "@/components/Footer";
import LandingHeader from "@/components/LandingHeader";
import { getUser } from "@/lib/auth";
import { buildPageMetadata, breadcrumbJsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { TAG_NFC_LANDING } from "@/lib/seo-content";
import JsonLd from "@/components/JsonLd";

export const metadata = buildPageMetadata({
  title: TAG_NFC_LANDING.title,
  description: TAG_NFC_LANDING.metaDescription,
  path: "/tag-nfc",
});

export default async function TagNfcPage() {
  const user = await getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <JsonLd
        data={[
          organizationJsonLd(),
          websiteJsonLd(),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Tag NFC", path: "/tag-nfc" },
          ]),
        ]}
      />
      <LandingHeader user={user} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        <nav className="text-xs text-muted mb-6 lowercase">
          <Link href="/" className="hover:text-accent">home</Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground">tag nfc</span>
        </nav>

        <h1 className="text-3xl font-bold text-foreground mb-4">{TAG_NFC_LANDING.title}</h1>
        <p className="text-muted leading-relaxed mb-10">{TAG_NFC_LANDING.intro}</p>

        <div className="space-y-6">
          {TAG_NFC_LANDING.sections.map((section) => (
            <section key={section.href} className="border border-border rounded-2xl p-6 bg-surface">
              <h2 className="text-lg font-semibold text-foreground mb-2">{section.title}</h2>
              <p className="text-sm text-muted mb-4">{section.body}</p>
              <Link href={section.href} className="text-sm font-medium text-accent hover:underline">
                {section.label} →
              </Link>
            </section>
          ))}
        </div>

        <div className="mt-10 p-6 bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-800/40 rounded-2xl">
          <h2 className="text-lg font-semibold text-foreground mb-2">Hai bisogno di tag personalizzati?</h2>
          <p className="text-sm text-muted mb-4">
            Stampa logo, programmazione batch e lotti aziendali su richiesta.
          </p>
          <Link href="/tag-nfc-personalizzati" className="text-sm font-medium text-accent hover:underline">
            Scopri i tag NFC personalizzati →
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
