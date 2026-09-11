import Link from "next/link";
import Footer from "@/components/Footer";
import LandingHeader from "@/components/LandingHeader";
import { getUser } from "@/lib/auth";
import { SITE } from "@/lib/site";
import { buildPageMetadata, breadcrumbJsonLd, faqPageJsonLd } from "@/lib/seo";
import { TAG_NFC_PERSONALIZZATI_LANDING } from "@/lib/seo-content";
import JsonLd from "@/components/JsonLd";

export const metadata = buildPageMetadata({
  title: TAG_NFC_PERSONALIZZATI_LANDING.title,
  description: TAG_NFC_PERSONALIZZATI_LANDING.metaDescription,
  path: "/tag-nfc-personalizzati",
});

export default async function TagNfcPersonalizzatiPage() {
  const user = await getUser();
  const landing = TAG_NFC_PERSONALIZZATI_LANDING;

  return (
    <div className="min-h-screen flex flex-col">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Tag NFC", path: "/tag-nfc" },
            { name: "Tag NFC personalizzati", path: "/tag-nfc-personalizzati" },
          ]),
          faqPageJsonLd(landing.faq),
        ]}
      />
      <LandingHeader user={user} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        <nav className="text-xs text-muted mb-6 lowercase">
          <Link href="/" className="hover:text-accent">home</Link>
          <span className="mx-1.5">/</span>
          <Link href="/tag-nfc" className="hover:text-accent">tag nfc</Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground">personalizzati</span>
        </nav>

        <h1 className="text-3xl font-bold text-foreground mb-4">{landing.title}</h1>
        <p className="text-muted leading-relaxed mb-10">{landing.intro}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {landing.services.map((service) => (
            <section key={service.title} className="border border-border rounded-2xl p-5 bg-surface">
              <h2 className="text-base font-semibold text-foreground mb-2">{service.title}</h2>
              <p className="text-sm text-muted">{service.body}</p>
            </section>
          ))}
        </div>

        <section className="mb-12">
          <h2 className="text-xl font-bold text-foreground mb-6">Domande frequenti</h2>
          <dl className="space-y-5 text-sm text-muted">
            {landing.faq.map((item) => (
              <div key={item.question}>
                <dt className="font-medium text-foreground">{item.question}</dt>
                <dd className="mt-1">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="p-6 bg-slate-700 text-slate-100 rounded-2xl">
          <h2 className="text-lg font-semibold mb-2">Richiedi un preventivo</h2>
          <p className="text-sm text-slate-300 mb-4">
            Contattaci con quantità, formato e tipo di programmazione desiderata.
            La spedizione è soggetta a disponibilità; in genere entro 7 giorni lavorativi.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <a href={`tel:${SITE.phoneTel}`} className="font-medium text-white hover:underline">
              {SITE.phone}
            </a>
            <a href={`mailto:${SITE.email}`} className="font-medium text-white hover:underline">
              {SITE.email}
            </a>
            <Link href="/assistenza" className="font-medium text-sky-300 hover:underline">
              Assistenza →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
