export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  categorySlug: string;
  image: string | null;
  weight?: number | null;
  stockQuantity?: number;
  name_it?: string;
  name_en?: string;
  name_fr?: string;
  name_es?: string;
  description_it?: string;
  description_en?: string;
  description_fr?: string;
  description_es?: string;
  compatibleStoveIds?: number[];
}

export const products: Product[] = [
  {
    id: 15,
    name: "Ventilatore Fumi con Encoder",
    slug: "ventilatore-fumi-ebm-senza-encoder",
    description:
      "PUO' SOSTITUIRE EBM 230V 50Hz 32W 2400 G/MIN \u00d8Vent.15cm",
    price: 158.93,
    category: "Ventilatori Fumi",
    categorySlug: "ventilatori-fumi",
    image:
      "https://shopnfc.bitora.it/shopnfc/368-home_default/ventilatore-fumi-ebm-senza-encoder.jpg",
  },
  {
    id: 17,
    name: "Ventilatore Aria Centrifugo per Stufa a Pellet",
    slug: "ventilatore-aria-centrifugo-per-stufa-a-pellet",
    description:
      "TRIAL D2E120-AA01-04 230V 50/60hz 0,38/0,43A 85/95W 1400/1300",
    price: 186.66,
    category: "Ventilatori Aria",
    categorySlug: "ventilatori-aria",
    image:
      "https://shopnfc.bitora.it/shopnfc/531-home_default/ventilatore-aria-centrifugo-per-stufa-a-pellet.jpg",
  },
  {
    id: 22,
    name: "Ventilatore Aria Stufe Slim",
    slug: "ventilatore-aria-stufe-slim",
    description:
      "EBMPAPST R2S175-AB56-01 220V 50hz 0,33A 53W 2350 G/Min",
    price: 135.42,
    category: "Ventilatori Aria",
    categorySlug: "ventilatori-aria",
    image:
      "https://shopnfc.bitora.it/shopnfc/229-home_default/ventilatore-aria-stufe-slim.jpg",
  },
  {
    id: 23,
    name: "Resistenza Elettrica \u00d812,5 mm Lungh. 130 mm",
    slug: "resistenza-elettrica",
    description:
      "Diametro: 12.5x130 mm (senza raccordo) 300W-230V",
    price: 42.33,
    category: "Resistenze Accensione",
    categorySlug: "resistenze-accensione",
    image:
      "https://shopnfc.bitora.it/shopnfc/179-home_default/resistenza-elettrica.jpg",
  },
  {
    id: 10,
    name: "Motoriduttore Mellor T14 \u2013 5 RPM",
    slug: "motoriduttore-mellor-t14-5-rpm",
    description:
      "Albero cavo senza perno. Pacco magnetico: 32 mm",
    price: 140.0,
    category: "Motoriduttori",
    categorySlug: "motoriduttori",
    image:
      "https://shopnfc.bitora.it/shopnfc/127-home_default/motoriduttore-mellor-t14-5-rpm.jpg",
  },
  {
    id: 52,
    name: "Sensore Debimetro Micronova",
    slug: "sensore-debimetro-micronova",
    description: "Sensore aria combustione Micronova",
    price: 57.95,
    category: "Schede Elettroniche e Sensori",
    categorySlug: "schede-elettroniche-sensori",
    image:
      "https://shopnfc.bitora.it/shopnfc/116-home_default/sensore-debimetro-micronova.jpg",
  },
  {
    id: 53,
    name: "Ventilatore Centrifugo Natalini EVAGOLD30CO0001",
    slug: "ventilatore-centrifugo-w925300010",
    description:
      "Ventilatore centrifugo aria per stufe a pellet EVAGOLD30CO0001",
    price: 110.04,
    category: "Ventilatori Aria",
    categorySlug: "ventilatori-aria",
    image:
      "https://shopnfc.bitora.it/shopnfc/121-home_default/ventilatore-centrifugo-w925300010.jpg",
  },
  {
    id: 54,
    name: "Ventilatore Aria Centrifugo RLH120/0038-3038LH",
    slug: "ventilatore-aria-centrifugo",
    description:
      "RLH120/0038 A12-3038LH-449 230V AC 50Hz 90W (WITH ENCODER)",
    price: 153.72,
    category: "Ventilatori Aria",
    categorySlug: "ventilatori-aria",
    image:
      "https://shopnfc.bitora.it/shopnfc/536-home_default/ventilatore-aria-centrifugo.jpg",
  },
  {
    id: 55,
    name: "Ventilatore Fumi con Encoder e Chiocciola",
    slug: "ventilatore-fumi-con-encoder-e-chiocciola",
    description:
      "Aspiratore fumi TRIAL CAF15Y-165LS. Diametro uscita 80mm",
    price: 115.9,
    category: "Ventilatori Fumi",
    categorySlug: "ventilatori-fumi",
    image:
      "https://shopnfc.bitora.it/shopnfc/578-home_default/ventilatore-fumi-con-encoder-e-chiocciola-.jpg",
  },
  {
    id: 56,
    name: "Braciere Susy-Perla 7,5 KW Evacalor",
    slug: "braciere-susy-perla-catria-evacalor",
    description:
      "Braciere in acciaio inox stufe 7,5 KW Slim",
    price: 36.6,
    category: "Bracieri e Camere Combustione",
    categorySlug: "bracieri-camere-combustione",
    image:
      "https://shopnfc.bitora.it/shopnfc/134-home_default/braciere-susy-perla-catria-evacalor.jpg",
  },
  {
    id: 67,
    name: "Supporto Depressore",
    slug: "supporto-depressore",
    description:
      "Supporto con aggancio rapido per fissare il depressore",
    price: 1.0,
    category: "Sonde, Depressori, Termostati",
    categorySlug: "sonde-depressori-termostati",
    image:
      "https://shopnfc.bitora.it/shopnfc/188-home_default/supporto-depressore.jpg",
  },
  {
    id: 68,
    name: "Termostato di Sicurezza a Riarmo Manuale 80\u00b0",
    slug: "termostato-di-sicurezza-a-riarmo-manuale-80",
    description:
      "Termostato di sicurezza con sonda con tasto per riarmo manuale",
    price: 30.5,
    category: "Sonde, Depressori, Termostati",
    categorySlug: "sonde-depressori-termostati",
    image:
      "https://shopnfc.bitora.it/shopnfc/191-home_default/termostato-di-sicurezza-a-riarmo-manuale-80.jpg",
  },
];

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(price);
}
