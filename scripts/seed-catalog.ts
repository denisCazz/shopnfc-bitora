import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import {
  appUsers,
  profiles,
  categories,
  stoves,
  products,
  productStoves,
  productImages,
} from "../db/schema";

const ADMIN_EMAIL = "admin@bitora.it";
const ADMIN_PASSWORD = "BitoraNfc2026!";

type ChipSlug =
  | "ntag213"
  | "ntag216"
  | "ntag210u"
  | "ntag424-dna"
  | "mifare-classic-1k"
  | "mifare-desfire-ev3"
  | "mifare-ultralight-ev1"
  | "icode-slix2"
  | "fudan-1k"
  | "mifare-plus";

const CATEGORIES = [
  { slug: "sticker-nfc", icon: "StickyNote", sort: 1, it: "Sticker NFC", en: "NFC Stickers", fr: "Stickers NFC", es: "Stickers NFC" },
  { slug: "tessere-nfc", icon: "CreditCard", sort: 2, it: "Tessere NFC", en: "NFC Cards", fr: "Cartes NFC", es: "Tarjetas NFC" },
  { slug: "braccialetti-nfc", icon: "Watch", sort: 3, it: "Braccialetti NFC", en: "NFC Wristbands", fr: "Bracelets NFC", es: "Pulseras NFC" },
  { slug: "tag-industriali", icon: "Gauge", sort: 4, it: "Tag industriali", en: "Industrial tags", fr: "Tags industriels", es: "Tags industriales" },
  { slug: "tag-schermati", icon: "Shield", sort: 5, it: "Tag schermati", en: "On-metal tags", fr: "Tags blindés", es: "Tags apantallados" },
  { slug: "gadget-nfc", icon: "Package", sort: 6, it: "Gadget NFC", en: "NFC gadgets", fr: "Gadgets NFC", es: "Gadgets NFC" },
  { slug: "lettori-nfc", icon: "Radio", sort: 7, it: "Lettori e scrittori", en: "Readers & writers", fr: "Lecteurs NFC", es: "Lectores NFC" },
  { slug: "soluzioni-nfc", icon: "Wrench", sort: 8, it: "Soluzioni NFC", en: "NFC solutions", fr: "Solutions NFC", es: "Soluciones NFC" },
];

const CHIPS: { slug: ChipSlug; it: string; en: string; categoria: string; potenza: string; dimensioni: string }[] = [
  { slug: "ntag213", it: "NXP NTAG213", en: "NXP NTAG213", categoria: "NFC Forum Type 2", potenza: "144 byte", dimensioni: "ISO 14443-A" },
  { slug: "ntag216", it: "NXP NTAG216", en: "NXP NTAG216", categoria: "NFC Forum Type 2", potenza: "888 byte", dimensioni: "ISO 14443-A" },
  { slug: "ntag210u", it: "NXP NTAG210μ", en: "NXP NTAG210μ", categoria: "NFC Forum Type 2", potenza: "48 byte", dimensioni: "ISO 14443-A" },
  { slug: "ntag424-dna", it: "NTAG424 DNA", en: "NTAG424 DNA", categoria: "Security", potenza: "416 byte", dimensioni: "ISO 14443-A / AES" },
  { slug: "mifare-classic-1k", it: "MIFARE Classic 1k", en: "MIFARE Classic 1k", categoria: "MIFARE", potenza: "1 kB", dimensioni: "ISO 14443-A" },
  { slug: "mifare-desfire-ev3", it: "MIFARE DESFire EV3", en: "MIFARE DESFire EV3", categoria: "MIFARE", potenza: "2–8 kB", dimensioni: "AES / EAL5+" },
  { slug: "mifare-ultralight-ev1", it: "MIFARE Ultralight EV1", en: "MIFARE Ultralight EV1", categoria: "MIFARE", potenza: "48–128 byte", dimensioni: "ISO 14443-A" },
  { slug: "icode-slix2", it: "ICODE SLIX2", en: "ICODE SLIX2", categoria: "ISO 15693", potenza: "2522 bit", dimensioni: "ISO 15693" },
  { slug: "fudan-1k", it: "Fudan 1k F08", en: "Fudan 1k F08", categoria: "MIFARE compatible", potenza: "1 kB", dimensioni: "ISO 14443-A" },
  { slug: "mifare-plus", it: "MIFARE Plus", en: "MIFARE Plus", categoria: "MIFARE", potenza: "2–4 kB", dimensioni: "AES-128" },
];

type ProductSeed = {
  sku: string;
  slug: string;
  category: string;
  chips: ChipSlug[];
  price: string;
  wholesale: string;
  stock: number;
  brand: string;
  weight: string;
  it: string;
  en: string;
  shortIt: string;
  descIt: string;
};

const PRODUCTS: ProductSeed[] = [
  {
    sku: "ST-N213-22", slug: "tag-nfc-ntag213-22mm", category: "sticker-nfc", chips: ["ntag213"],
    price: "0.65", wholesale: "0.28", stock: 8000, brand: "NXP", weight: "0.001",
    it: "Tag NFC NTAG213 22mm adesivi", en: "NTAG213 22mm NFC stickers",
    shortIt: "Sticker rotondi trasparenti, impermeabili, chip NTAG213 da 144 byte.",
    descIt: "Tag NFC rotondi adesivi da 22 mm con chip NXP NTAG213. Memoria 144 byte, compatibili con smartphone NFC. Non funzionano su superfici metalliche. Ideali per marketing, packaging e biglietti da visita.",
  },
  {
    sku: "ST-N213-38", slug: "tag-nfc-ntag213-38mm", category: "sticker-nfc", chips: ["ntag213"],
    price: "0.69", wholesale: "0.30", stock: 6000, brand: "NXP", weight: "0.002",
    it: "Tag NFC NTAG213 38mm adesivi", en: "NTAG213 38mm NFC stickers",
    shortIt: "Sticker wet inlay da 38 mm, NTAG213, resistenti a pioggia e spruzzi.",
    descIt: "Tag NFC adesivi da 38 mm con chip NTAG213. Range di lettura più ampio rispetto ai formati piccoli. Vuoti, riscrivibili, con password lock.",
  },
  {
    sku: "ST-N213-W22", slug: "tag-nfc-ntag213-22mm-bianchi", category: "sticker-nfc", chips: ["ntag213"],
    price: "0.59", wholesale: "0.24", stock: 5000, brand: "NXP", weight: "0.001",
    it: "Tag NFC NTAG213 22mm bianchi", en: "White NTAG213 22mm stickers",
    shortIt: "Sticker bianchi stampabili, chip NTAG213, diametro 22 mm.",
    descIt: "Versione bianca opaca, adatta a stampa inkjet o laser su etichette. Chip NTAG213 con compatibilità universale.",
  },
  {
    sku: "ST-N216-25", slug: "tag-nfc-ntag216-25mm", category: "sticker-nfc", chips: ["ntag216"],
    price: "0.89", wholesale: "0.38", stock: 3000, brand: "NXP", weight: "0.001",
    it: "Tag NFC NTAG216 25mm adesivi", en: "NTAG216 25mm NFC stickers",
    shortIt: "Più memoria: 888 byte per vCard, URL lunghi e NDEF strutturati.",
    descIt: "Sticker NTAG216 quando 144 byte non bastano. Utile per biglietti da visita NFC con più campi o per payload firmati.",
  },
  {
    sku: "ST-N210-22", slug: "tag-nfc-ntag210u-22mm", category: "sticker-nfc", chips: ["ntag210u"],
    price: "0.49", wholesale: "0.19", stock: 10000, brand: "NXP", weight: "0.001",
    it: "Tag NFC NTAG210μ 22mm adesivi", en: "NTAG210μ 22mm stickers",
    shortIt: "Chip compatto da 48 byte, ideale per un solo URL.",
    descIt: "La scelta più economica per campagne con un link. Compatibile con iPhone e Android NFC.",
  },
  {
    sku: "ST-N213-LOGO", slug: "tag-nfc-ntag213-logo", category: "sticker-nfc", chips: ["ntag213"],
    price: "0.89", wholesale: "0.35", stock: 2000, brand: "NXP", weight: "0.001",
    it: "Tag NFC NTAG213 con logo NFC", en: "NTAG213 stickers with NFC logo",
    shortIt: "Sticker con marchio NFC visibile, per far capire dove avvicinare il telefono.",
    descIt: "Sticker NTAG213 con logo NFC stampato. Riduce la frizione d'uso su totem, vetrine e packaging.",
  },
  {
    sku: "CD-N213", slug: "tessere-nfc-pvc-ntag213", category: "tessere-nfc", chips: ["ntag213"],
    price: "1.29", wholesale: "0.45", stock: 4000, brand: "NXP", weight: "0.006",
    it: "Tessere NFC in PVC NTAG213", en: "PVC NFC cards NTAG213",
    shortIt: "Card CR80 85,6 × 54 mm, NTAG213, stampabili, min. 10 pz.",
    descIt: "Tessere ISO CR80 in PVC con chip NTAG213. Antenna perimetrale per un buon range. Stampabili a colori o in bianco e nero. Programmazione URL inclusa su richiesta.",
  },
  {
    sku: "CD-MF1K", slug: "tessere-nfc-pvc-mifare-classic-1k", category: "tessere-nfc", chips: ["mifare-classic-1k"],
    price: "1.35", wholesale: "0.60", stock: 3500, brand: "NXP", weight: "0.006",
    it: "Tessere NFC PVC MIFARE Classic 1k", en: "PVC MIFARE Classic 1k cards",
    shortIt: "Card RFID 13,56 MHz ISO 14443-A, 1 kB, controllo accessi.",
    descIt: "Card in PVC con MIFARE Classic EV1 1k. Standard di fatto per badge aziendali, palestre e controllo accessi.",
  },
  {
    sku: "CD-DFEV3", slug: "tessere-nfc-pvc-desfire-ev3", category: "tessere-nfc", chips: ["mifare-desfire-ev3"],
    price: "1.85", wholesale: "1.28", stock: 1500, brand: "NXP", weight: "0.006",
    it: "Tessere NFC PVC DESFire EV3", en: "PVC DESFire EV3 cards",
    shortIt: "AES, messaggio SUN, EAL5+, fino a 1 milione di cicli.",
    descIt: "Card di sicurezza con MIFARE DESFire EV3. Per pagamenti closed-loop, accessi critici e tracciabilità anti-clonazione.",
  },
  {
    sku: "CD-BIO", slug: "tessere-nfc-pvc-bio", category: "tessere-nfc", chips: ["ntag213"],
    price: "1.59", wholesale: "0.69", stock: 1200, brand: "NXP", weight: "0.006",
    it: "Tessere NFC in PVC bio", en: "Bio PVC NFC cards",
    shortIt: "PVC biodegradabile, stesse prestazioni del PVC classico.",
    descIt: "Card NFC in PVC bio con additivo che lo rende biodegradabile. Stampabilità e durata analoghe al PVC standard.",
  },
  {
    sku: "CD-N216", slug: "tessere-nfc-pvc-ntag216", category: "tessere-nfc", chips: ["ntag216"],
    price: "1.59", wholesale: "0.56", stock: 2000, brand: "NXP", weight: "0.006",
    it: "Tessere NFC in PVC NTAG216", en: "PVC NFC cards NTAG216",
    shortIt: "Card CR80 con NTAG216, più spazio per vCard e menu.",
    descIt: "Tessere riscrivibili formato ISO con NTAG216. La scelta giusta per biglietti da visita smart con più destinazioni.",
  },
  {
    sku: "CD-F08", slug: "tessere-nfc-pvc-fudan-1k", category: "tessere-nfc", chips: ["fudan-1k"],
    price: "0.89", wholesale: "0.22", stock: 8000, brand: "Fudan", weight: "0.006",
    it: "Tessere NFC PVC Fudan 1k F08", en: "Fudan 1k F08 PVC cards",
    shortIt: "Card economiche 1k ISO 14443-A, bianche riscrivibili.",
    descIt: "Alternativa conveniente al Classic 1k per volumi alti. Formato CR80, stampabili.",
  },
  {
    sku: "CD-BAMBOO", slug: "tessere-nfc-bambu-ntag213", category: "tessere-nfc", chips: ["ntag213"],
    price: "1.50", wholesale: "1.10", stock: 400, brand: "NXP", weight: "0.008",
    it: "Tessere NFC in bambù NTAG213", en: "Bamboo NFC cards NTAG213",
    shortIt: "Card in legno di bambù, look naturale, NTAG213.",
    descIt: "Biglietto da visita NFC in bambù. Texture naturale, chip NTAG213, personalizzabile.",
  },
  {
    sku: "KIT-CARD", slug: "kit-card-nfc", category: "tessere-nfc", chips: ["ntag213", "ntag216", "mifare-classic-1k", "mifare-desfire-ev3", "mifare-ultralight-ev1", "icode-slix2", "fudan-1k"],
    price: "11.90", wholesale: "8.90", stock: 80, brand: "Bitora", weight: "0.060",
    it: "Kit di Card NFC", en: "NFC card kit",
    shortIt: "10 card PVC, 7 chip diversi, per testare la soluzione giusta.",
    descIt: "Kit di valutazione: tessere bianche CR80 con chip misti. Utile prima di un ordine in volume.",
  },
  {
    sku: "BR-SIL-N213", slug: "braccialetti-nfc-silicone-ntag213", category: "braccialetti-nfc", chips: ["ntag213"],
    price: "1.50", wholesale: "0.84", stock: 2000, brand: "NXP", weight: "0.018",
    it: "Braccialetti NFC silicone NTAG213", en: "Silicone NTAG213 wristbands",
    shortIt: "Silicone regolabile, impermeabile, per accessi e eventi.",
    descIt: "Bracciale in silicone con NTAG213. Cinturino regolabile, resistente ad acqua clorata e salata. Personalizzabile.",
  },
  {
    sku: "BR-SIL-PREM", slug: "bracciali-nfc-silicone-premium", category: "braccialetti-nfc", chips: ["ntag213", "ntag216"],
    price: "2.49", wholesale: "1.95", stock: 800, brand: "NXP", weight: "0.022",
    it: "Bracciali NFC in silicone Premium", en: "Premium silicone NFC wristbands",
    shortIt: "Silicone spesso, più chip a scelta, stampa serigrafica.",
    descIt: "Versione premium per villaggi, spa e club. Chip a scelta, colori stock e stampa logo.",
  },
  {
    sku: "BR-VEL-N213", slug: "bracciali-nfc-velcro-ntag213", category: "braccialetti-nfc", chips: ["ntag213"],
    price: "2.19", wholesale: "1.34", stock: 600, brand: "NXP", weight: "0.016",
    it: "Bracciali NFC NTAG213 con velcro", en: "NTAG213 velcro wristbands",
    shortIt: "Regolabili con velcro, per adulti e bambini.",
    descIt: "Bracciale impermeabile con chiusura a velcro. NTAG213, adatto a parchi e centri estivi.",
  },
  {
    sku: "BR-TEX-N213", slug: "braccialetti-nfc-tessili-ntag213", category: "braccialetti-nfc", chips: ["ntag213"],
    price: "1.95", wholesale: "1.25", stock: 700, brand: "NXP", weight: "0.012",
    it: "Braccialetti NFC tessili elastici", en: "Elastic textile NFC wristbands",
    shortIt: "Tessuto elastico, lavabile, NTAG213 sul quadrante.",
    descIt: "Bracciale in tessuto per usi ripetuti. Resistente ai lavaggi domestici, personalizzabile.",
  },
  {
    sku: "BR-SLIM", slug: "braccialetti-monouso-slim-ntag21x", category: "braccialetti-nfc", chips: ["ntag213", "ntag210u"],
    price: "0.79", wholesale: "0.49", stock: 5000, brand: "NXP", weight: "0.004",
    it: "Braccialetti monouso Slim NTAG21x", en: "Slim disposable NTAG21x wristbands",
    shortIt: "Vinile monouso, stampa 1 colore, anche olografici.",
    descIt: "Braccialetti identificativi per concerti, fiere e festival. Chip NTAG21x, personalizzabili in tiratura.",
  },
  {
    sku: "KIT-BR", slug: "kit-braccialetti-nfc", category: "braccialetti-nfc", chips: ["ntag213"],
    price: "13.90", wholesale: "10.90", stock: 40, brand: "Bitora", weight: "0.080",
    it: "Kit di Braccialetti NFC", en: "NFC wristband kit",
    shortIt: "7 braccialetti misti per scegliere materiale e chiusura.",
    descIt: "Pacchetto di prova con silicone, velcro, tessuto e monouso.",
  },
  {
    sku: "IND-IP68", slug: "tag-industriali-ip68-ntag213", category: "tag-industriali", chips: ["ntag213", "ntag216"],
    price: "2.90", wholesale: "1.80", stock: 900, brand: "NXP", weight: "0.012",
    it: "Tag industriali IP68 NTAG213/216", en: "IP68 industrial NTAG213/216 tags",
    shortIt: "34 mm, IP68, per asset tracking e ambienti umidi.",
    descIt: "Tag rugged per magazzini, impianti e logistica. Chip NTAG213 o NTAG216, involucro sigillato.",
  },
  {
    sku: "IND-ABS", slug: "tag-nfc-abs-forati-ip66", category: "tag-industriali", chips: ["ntag213"],
    price: "1.80", wholesale: "1.10", stock: 700, brand: "NXP", weight: "0.010",
    it: "Tag NFC ABS forati IP66", en: "IP66 ABS NFC tags with holes",
    shortIt: "ABS forato, da fissare con rivetto o fascetta.",
    descIt: "Tag in ABS con fori di fissaggio. Per pallet, macchinari e outdoor.",
  },
  {
    sku: "SH-N213-22", slug: "tag-schermati-ntag213-22mm", category: "tag-schermati", chips: ["ntag213"],
    price: "1.19", wholesale: "0.62", stock: 2500, brand: "NXP", weight: "0.002",
    it: "Tag schermati NTAG213 22mm", en: "On-metal NTAG213 22mm tags",
    shortIt: "Funzionano sul metallo, sticker flessibili NTAG213.",
    descIt: "Strato ferrite per applicazione su lattine, elettrodomestici e superfici metalliche.",
  },
  {
    sku: "SH-IP68-30", slug: "tag-schermati-ip68-30mm", category: "tag-schermati", chips: ["ntag213"],
    price: "1.49", wholesale: "0.85", stock: 1200, brand: "NXP", weight: "0.004",
    it: "Tag schermati IP68 30mm", en: "IP68 on-metal 30mm tags",
    shortIt: "On-metal + IP68, per asset metallici all'aperto.",
    descIt: "Combinazione schermatura e tenuta stagna. Lettura stabile anche su acciaio.",
  },
  {
    sku: "GD-KEY", slug: "portachiavi-nfc-ntag213", category: "gadget-nfc", chips: ["ntag213"],
    price: "1.99", wholesale: "1.10", stock: 1500, brand: "NXP", weight: "0.008",
    it: "Portachiavi NFC NTAG213", en: "NTAG213 NFC keyfobs",
    shortIt: "Gadget durevole, NTAG213, personalizzabile.",
    descIt: "Portachiavi con chip NTAG213. Per recensioni Google, Wi-Fi guest e accessi.",
  },
  {
    sku: "GD-PIN", slug: "spillette-nfc-ntag213", category: "gadget-nfc", chips: ["ntag213"],
    price: "2.20", wholesale: "1.40", stock: 600, brand: "NXP", weight: "0.007",
    it: "Spillette NTAG213 metalliche", en: "Metal NTAG213 NFC pins",
    shortIt: "Spilla metallica con logo NFC e chip NTAG213.",
    descIt: "Gadget da giacca o shopper. Tap per aprire recensioni, menu o contatto.",
  },
  {
    sku: "RD-ACR122", slug: "lettore-nfc-usb-acr122u", category: "lettori-nfc", chips: ["ntag213", "ntag216", "mifare-classic-1k", "mifare-ultralight-ev1"],
    price: "39.90", wholesale: "32.00", stock: 40, brand: "ACS", weight: "0.120",
    it: "Lettore NFC USB ACR122U", en: "ACR122U USB NFC reader",
    shortIt: "Reader/writer USB per PC, programmazione e UID.",
    descIt: "Lettore USB plug-and-play per scrivere, formattare e leggere tag NFC da computer. Adatto a lotti medi.",
  },
  {
    sku: "RD-U3700", slug: "lettore-nfc-utrust-3700f", category: "lettori-nfc", chips: ["ntag213", "mifare-classic-1k", "mifare-desfire-ev3", "icode-slix2"],
    price: "49.90", wholesale: "41.00", stock: 25, brand: "Identiv", weight: "0.180",
    it: "uTrust 3700 F NFC Reader/Writer", en: "uTrust 3700 F NFC reader/writer",
    shortIt: "Multi-ISO, USB, per encoding professionale.",
    descIt: "Lettore/scrittore multi-ISO per card e tag. Ideale in ufficio per programmazione e controllo accessi.",
  },
  {
    sku: "RD-JUSTID", slug: "lettore-uid-justid-usb", category: "lettori-nfc", chips: ["mifare-classic-1k", "ntag213"],
    price: "29.90", wholesale: "24.00", stock: 35, brand: "JustID", weight: "0.040",
    it: "JustID — lettore UID USB", en: "JustID USB UID reader",
    shortIt: "Chiavetta USB che emula tastiera con l'UID del tag.",
    descIt: "Avvicini il tag e l'UID viene digitato nel campo attivo. Zero software da installare.",
  },
  {
    sku: "SV-PROG", slug: "programmazione-nfc", category: "soluzioni-nfc", chips: ["ntag213", "ntag216", "ntag424-dna"],
    price: "9.90", wholesale: "6.00", stock: 999, brand: "Bitora", weight: "0.000",
    it: "Programmazione NFC inclusa", en: "NFC programming service",
    shortIt: "URL, vCard o recensione Google. Aggiornamenti senza abbonamento.",
    descIt: "Servizio Bitora: programmiamo i tag sul lotto ordinato. Cambi destinazione quando vuoi, senza canone mensile.",
  },
  {
    sku: "SV-LABKEY", slug: "kit-controllo-accessi-nfc", category: "soluzioni-nfc", chips: ["mifare-classic-1k", "mifare-desfire-ev3"],
    price: "89.00", wholesale: "72.00", stock: 15, brand: "Bitora", weight: "0.350",
    it: "Kit controllo accessi NFC", en: "NFC access control kit",
    shortIt: "Lettore + 10 card + guida di avvio per PMI.",
    descIt: "Kit di partenza per palestre, uffici e B&B. Hardware e card, configurazione assistita da Bitora.",
  },
  {
    sku: "CD-DNA", slug: "tessere-nfc-ntag424-dna", category: "tessere-nfc", chips: ["ntag424-dna"],
    price: "1.59", wholesale: "0.49", stock: 900, brand: "NXP", weight: "0.006",
    it: "Tessere NFC PVC NTAG424 DNA", en: "PVC NTAG424 DNA cards",
    shortIt: "Anti-contraffazione con messaggio SUN e AES.",
    descIt: "Card con NTAG424 DNA per autenticità prodotto, warranty e tap sicuri. Compatibili con smartphone NFC.",
  },
];

async function main() {
  config({ path: ".env.local" });
  const db = getDb();

  const cats = await db.select({ id: categories.id }).from(categories).limit(1);
  if (cats.length > 0) {
    console.log("Catalogo già presente, skip seed prodotti.");
  } else {
    const insertedCats = await db
      .insert(categories)
      .values(
        CATEGORIES.map((c) => ({
          slug: c.slug,
          icon: c.icon,
          sortOrder: c.sort,
          active: true,
          nameIt: c.it,
          nameEn: c.en,
          nameFr: c.fr,
          nameEs: c.es,
        }))
      )
      .returning({ id: categories.id, slug: categories.slug });

    const catId = Object.fromEntries(insertedCats.map((c) => [c.slug, c.id]));

    const insertedChips = await db
      .insert(stoves)
      .values(
        CHIPS.map((c, i) => ({
          slug: c.slug,
          nameIt: c.it,
          nameEn: c.en,
          nameFr: c.it,
          nameEs: c.it,
          active: true,
          sortOrder: i + 1,
          categoria: c.categoria,
          potenza: c.potenza,
          dimensioni: c.dimensioni,
        }))
      )
      .returning({ id: stoves.id, slug: stoves.slug });

    const chipId = Object.fromEntries(insertedChips.map((c) => [c.slug, c.id]));

    for (const p of PRODUCTS) {
      const categoryId = catId[p.category];
      if (!categoryId) throw new Error(`Missing category ${p.category}`);
      const imageUrl = `/products/${p.slug}.svg`;
      const [row] = await db
        .insert(products)
        .values({
          categoryId,
          sku: p.sku,
          nameIt: p.it,
          nameEn: p.en,
          nameFr: p.it,
          nameEs: p.it,
          descriptionIt: p.descIt,
          descriptionEn: p.descIt,
          descriptionShortIt: p.shortIt,
          descriptionShortEn: p.shortIt,
          slug: p.slug,
          catalogPrice: p.price,
          price: p.price,
          wholesalePrice: p.wholesale,
          weight: p.weight,
          stockQuantity: p.stock,
          active: true,
          brand: p.brand,
          imageUrl,
          metaTitle: `${p.it} | Shop NFC`,
          metaDescription: p.shortIt,
        })
        .returning({ id: products.id });

      await db.insert(productImages).values({
        productId: row.id,
        imageUrl,
        sortOrder: 0,
        altText: p.it,
      });

      const stoveRows = p.chips
        .map((slug) => chipId[slug])
        .filter(Boolean)
        .map((stoveId) => ({ productId: row.id, stoveId }));
      if (stoveRows.length) {
        await db.insert(productStoves).values(stoveRows);
      }
    }
    console.log(`Inseriti ${PRODUCTS.length} prodotti, ${CATEGORIES.length} categorie, ${CHIPS.length} chip.`);
  }

  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const existing = await db
    .select({ id: appUsers.id })
    .from(appUsers)
    .where(eq(appUsers.email, ADMIN_EMAIL))
    .limit(1);
  if (existing.length === 0) {
    const [user] = await db
      .insert(appUsers)
      .values({
        email: ADMIN_EMAIL,
        passwordHash: hash,
        name: "Denis Cazzulo",
        emailVerifiedAt: new Date(),
      })
      .returning({ id: appUsers.id });
    await db.insert(profiles).values({
      id: user.id,
      email: ADMIN_EMAIL,
      firstName: "Denis",
      lastName: "Cazzulo",
      role: "admin",
      company: "Bitora",
      vatNumber: "13359170019",
      phone: "3514979670",
      city: "Carmagnola",
      province: "TO",
      postalCode: "10022",
      country: "IT",
    });
    console.log(`Admin creato: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  } else {
    console.log(`Admin già presente (${ADMIN_EMAIL}). Password di default: ${ADMIN_PASSWORD}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
