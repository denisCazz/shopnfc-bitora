import type { Metadata } from "next";
import { SITE } from "@/lib/site";

const DEFAULT_OG_IMAGE = "/nfc.png";

export function absoluteUrl(path = "/"): string {
  const base = SITE.url.replace(/\/$/, "");
  if (!path || path === "/") return `${base}/`;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export const NO_INDEX_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
};

export function noIndexMetadata(title: string): Metadata {
  return {
    title: { absolute: title },
    robots: NO_INDEX_ROBOTS,
  };
}

export interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  noIndex?: boolean;
}

export function buildPageMetadata({
  title,
  description,
  path,
  image,
  noIndex = false,
}: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const ogImage = image || DEFAULT_OG_IMAGE;
  const baseTitle = title.replace(/\s*\|\s*(Shop NFC Bitora|Shop NFC)\s*$/i, "").trim();
  const fullTitle = `${baseTitle} | ${SITE.name}`;

  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "it_IT",
      url,
      siteName: SITE.name,
      title: fullTitle,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
    },
    ...(noIndex ? { robots: NO_INDEX_ROBOTS } : {}),
  };
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.legalName,
    url: SITE.url,
    logo: absoluteUrl(SITE.logo),
    email: SITE.email,
    telephone: SITE.phoneTel,
    address: {
      "@type": "PostalAddress",
      addressLocality: SITE.addressLine,
      addressRegion: "TO",
      postalCode: "10022",
      addressCountry: "IT",
    },
    sameAs: [SITE.parentUrl],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    publisher: { "@type": "Organization", name: SITE.legalName },
  };
}

export interface ProductSchemaInput {
  name: string;
  description: string;
  slug: string;
  image?: string | null;
  sku?: string | null;
  ean13?: string | null;
  brand?: string | null;
  price: number;
  inStock: boolean;
  categoryName?: string;
}

export function productJsonLd(input: ProductSchemaInput) {
  const images = input.image ? [absoluteUrl(input.image)] : [absoluteUrl(DEFAULT_OG_IMAGE)];
  const sku = input.sku?.trim();
  const gtin = input.ean13?.trim();

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    image: images,
    sku: sku && sku.toLowerCase() !== "null" ? sku : undefined,
    gtin13: gtin && gtin.length === 13 ? gtin : undefined,
    brand: input.brand
      ? { "@type": "Brand", name: input.brand }
      : { "@type": "Brand", name: SITE.name },
    category: input.categoryName,
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/products/${input.slug}`),
      priceCurrency: "EUR",
      price: input.price.toFixed(2),
      availability: input.inStock
        ? "https://schema.org/LimitedAvailability"
        : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: SITE.legalName },
    },
  };
}

export interface CollectionSchemaInput {
  name: string;
  description: string;
  path: string;
  products: { name: string; slug: string; image?: string | null }[];
}

export function collectionPageJsonLd(input: CollectionSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: input.products.length,
      itemListElement: input.products.slice(0, 20).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: absoluteUrl(`/products/${p.slug}`),
        name: p.name,
        image: p.image ? absoluteUrl(p.image) : undefined,
      })),
    },
  };
}

export interface ChipPageSchemaInput {
  name: string;
  description: string;
  slug: string;
  products: { name: string; slug: string }[];
}

export function chipPageJsonLd(input: ChipPageSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Prodotti con chip ${input.name}`,
    description: input.description,
    url: absoluteUrl(`/chip/${input.slug}`),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: input.products.length,
      itemListElement: input.products.slice(0, 20).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: absoluteUrl(`/products/${p.slug}`),
        name: p.name,
      })),
    },
  };
}

export function faqPageJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}
