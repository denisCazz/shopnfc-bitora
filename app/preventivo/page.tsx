import Footer from "@/components/Footer";
import LandingHeader from "@/components/LandingHeader";
import JsonLd from "@/components/JsonLd";
import { getUser } from "@/lib/auth";
import { getProductBySlug } from "@/lib/products";
import { breadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";
import { QUOTE_FORMATS, quoteFormatForCategory, type QuoteFormat } from "@/lib/quote-request";
import PreventivoClient from "./PreventivoClient";

export const metadata = buildPageMetadata({
  title: "Preventivo tag NFC personalizzati",
  description:
    "Richiedi un preventivo per sticker, tessere e braccialetti NFC personalizzati: allega logo e foto, ricevi prezzo e tempi entro 24 ore lavorative.",
  path: "/preventivo",
});

export default async function PreventivoPage({
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
  const formatId: QuoteFormat = requestedFormat ?? quoteFormatForCategory(product?.categorySlug) ?? "card";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Preventivo", path: "/preventivo" },
        ])}
      />
      <LandingHeader user={user} />
      <PreventivoClient
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
        user={
          user
            ? { name: [user.firstName, user.lastName].filter(Boolean).join(" "), email: user.email }
            : null
        }
      />
      <Footer />
    </div>
  );
}
