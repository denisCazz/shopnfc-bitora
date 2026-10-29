import Footer from "@/components/Footer";
import LandingHeader from "@/components/LandingHeader";
import JsonLd from "@/components/JsonLd";
import { getUser } from "@/lib/auth";
import { getProductBySlug } from "@/lib/products";
import { QUOTE_FORMATS, quoteFormatForCategory, type QuoteFormat } from "@/lib/quote-request";
import { breadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";
import AssistenteClient from "./AssistenteClient";

export const metadata = buildPageMetadata({
  title: "Assistente AI: configura il carrello e acquista",
  description:
    "Descrivi cosa vuoi fare con i tag NFC. L'assistente Shop NFC sceglie gli articoli del catalogo, pre-compila il carrello e ti porta al checkout.",
  path: "/assistente",
});

export default async function AssistentePage({
  searchParams,
}: {
  searchParams: Promise<{ formato?: string; prodotto?: string }>;
}) {
  const { formato, prodotto } = await searchParams;
  const [user, product] = await Promise.all([
    getUser(),
    prodotto ? getProductBySlug(prodotto) : Promise.resolve(null),
  ]);

  const requestedFormat = QUOTE_FORMATS.find((f) => f === formato);
  const formatId: QuoteFormat | null =
    requestedFormat ?? (product ? quoteFormatForCategory(product.categorySlug) : null);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Assistente AI", path: "/assistente" },
        ])}
      />
      <LandingHeader user={user} />
      <AssistenteClient
        initialFormat={formatId}
        product={
          product
            ? {
                name: product.name_it || product.name,
                slug: product.slug,
                minQuantity: product.minQuantity,
              }
            : null
        }
      />
      <Footer />
    </div>
  );
}
