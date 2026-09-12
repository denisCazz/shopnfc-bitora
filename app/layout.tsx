import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import AppProviders from "@/components/AppProviders";
import EnvBanner from "@/components/EnvBanner";
import { SITE } from "@/lib/site";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const siteUrl = SITE.url;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE.name} | Tag, card e lettori NFC`,
    template: `%s | ${SITE.name}`,
  },
  description:
    "Catalogo NFC Bitora: sticker, tessere, braccialetti, tag industriali, gadget e lettori. Programmazione inclusa. Spedizione soggetta a disponibilità, solitamente entro 7 giorni.",
  keywords:
    "shop nfc, tag nfc, tessere nfc, sticker nfc, braccialetti nfc, lettori nfc, ntag213, mifare, bitora",
  authors: [{ name: SITE.legalName }],
  creator: "Bitora.it",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "it_IT",
    url: siteUrl,
    siteName: SITE.name,
    title: `${SITE.name} | Tag, card e lettori NFC`,
    description:
      "Catalogo NFC Bitora: sticker, tessere, braccialetti, tag industriali e lettori. Programmazione inclusa.",
    images: [
      {
        url: "/nfc.png",
        width: 1200,
        height: 630,
        alt: SITE.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} | Tag, card e lettori NFC`,
    description: "Catalogo NFC Bitora: sticker, tessere, braccialetti e lettori.",
    images: ["/nfc.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('shopnfc_theme_v2');if(t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${jakarta.variable} antialiased`}>
        <EnvBanner />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
