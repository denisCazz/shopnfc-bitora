import Link from "next/link";
import Footer from "@/components/Footer";
import LandingHeader from "@/components/LandingHeader";
import { getUser } from "@/lib/auth";
import { SITE } from "@/lib/site";
import { whatsappUrl } from "@/lib/whatsapp";
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
        <p className="text-muted leading-relaxed mb-6">{landing.intro}</p>
        <Link
          href="/assistente"
          className="mb-10 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90"
        >
          Configura e acquista subito con l&apos;AI →
        </Link>

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

        <section className="p-6 md:p-8 bg-slate-950 text-slate-100 rounded-3xl">
          <h2 className="text-2xl font-bold mb-2">Acquista subito senza aspettare il preventivo</h2>
          <p className="text-sm text-slate-300 mb-6 max-w-2xl">
            Descrivi cosa vuoi realizzare al nostro Assistente AI: ti pre-compila subito il carrello con i prodotti
            esatti, la stampa personalizzata e la programmazione inclusa. Puoi pagare immediatamente e caricare
            il tuo logo direttamente al checkout (o dopo l&apos;ordine).
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Link
              href="/assistente"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-500 px-6 py-3.5 font-bold text-white hover:bg-sky-400"
            >
              Pre-compila il carrello con l&apos;AI →
            </Link>
            <a
              href={whatsappUrl("Ciao, vorrei informazioni sui tag NFC personalizzati.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1f8f4e] px-6 py-3.5 font-semibold text-white hover:bg-[#22a358]"
            >
              WhatsApp
            </a>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-400">
            <a href={`tel:${SITE.phoneTel}`} className="hover:text-white">
              {SITE.phone}
            </a>
            <a href={`mailto:${SITE.email}`} className="hover:text-white">
              {SITE.email}
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
