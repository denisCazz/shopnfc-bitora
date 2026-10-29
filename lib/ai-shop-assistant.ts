import { getProducts, type ProductWithCategory } from "@/lib/products";
import { getPrintConfig } from "@/lib/print-options-server";
import {
  parsePrintOption,
  printOptionLineKey,
  printSurcharge,
  productNeedsPrintOption,
  type PrintOption,
} from "@/lib/print-options";
import { roundMoney } from "@/lib/pricing";
import { minQuantityForProduct } from "@/lib/min-quantity";

export interface AiCartRecommendation {
  productId: number;
  slug: string;
  sku: string | null;
  name: string;
  category: string;
  categorySlug: string;
  image: string | null;
  weight: number | null;
  basePrice: number;
  unitPrice: number;
  quantity: number;
  minQuantity: number;
  stockQuantity: number;
  printOption: PrintOption;
  printSurcharge: number;
  lineKey?: string;
  lineNotes?: string | null;
  reason: string;
  badge?: string;
}

export interface AiShoppingAssistantResponse {
  summary: string;
  items: AiCartRecommendation[];
  alternatives: AiCartRecommendation[];
  detectedIntent: {
    useCase: string;
    quantity: number;
    printOption: PrintOption;
    programmingNote: string | null;
  };
  source: "llm" | "smart-engine";
}

const FALLBACK_CATALOG_ITEMS: {
  id: number;
  sku: string;
  slug: string;
  category: string;
  categorySlug: string;
  price: number;
  stock: number;
  weight: number;
  min?: number;
  nameIt: string;
  shortIt: string;
  descIt: string;
}[] = [
  { id: 1, sku: "ST-N213-22", slug: "tag-nfc-ntag213-22mm", category: "Sticker NFC", categorySlug: "sticker-nfc", price: 1.17, stock: 8000, weight: 0.001, nameIt: "Tag NFC NTAG213 22mm adesivi", shortIt: "Sticker rotondi trasparenti, impermeabili, chip NTAG213 da 144 byte.", descIt: "Tag NFC rotondi adesivi da 22 mm con chip NXP NTAG213." },
  { id: 2, sku: "ST-N213-38", slug: "tag-nfc-ntag213-38mm", category: "Sticker NFC", categorySlug: "sticker-nfc", price: 1.24, stock: 6000, weight: 0.002, nameIt: "Tag NFC NTAG213 38mm adesivi", shortIt: "Sticker wet inlay da 38 mm, NTAG213, resistenti a pioggia e spruzzi.", descIt: "Tag NFC adesivi da 38 mm con chip NTAG213." },
  { id: 3, sku: "ST-N213-W22", slug: "tag-nfc-ntag213-22mm-bianchi", category: "Sticker NFC", categorySlug: "sticker-nfc", price: 1.06, stock: 5000, weight: 0.001, nameIt: "Tag NFC NTAG213 22mm bianchi", shortIt: "Sticker bianchi stampabili, chip NTAG213, diametro 22 mm.", descIt: "Versione bianca opaca, adatta a stampa inkjet o laser su etichette." },
  { id: 4, sku: "ST-N216-25", slug: "tag-nfc-ntag216-25mm", category: "Sticker NFC", categorySlug: "sticker-nfc", price: 1.60, stock: 3000, weight: 0.001, nameIt: "Tag NFC NTAG216 25mm adesivi", shortIt: "Più memoria: 888 byte per vCard, URL lunghi e NDEF strutturati.", descIt: "Sticker NTAG216 quando 144 byte non bastano." },
  { id: 5, sku: "ST-N210-22", slug: "tag-nfc-ntag210u-22mm", category: "Sticker NFC", categorySlug: "sticker-nfc", price: 0.88, stock: 10000, weight: 0.001, nameIt: "Tag NFC NTAG210μ 22mm adesivi", shortIt: "Chip compatto da 48 byte, ideale per un solo URL.", descIt: "La scelta più economica per campagne con un link." },
  { id: 6, sku: "ST-N213-LOGO", slug: "tag-nfc-ntag213-logo", category: "Sticker NFC", categorySlug: "sticker-nfc", price: 1.60, stock: 2000, weight: 0.001, nameIt: "Tag NFC NTAG213 con logo NFC", shortIt: "Sticker con marchio NFC visibile, per far capire dove avvicinare il telefono.", descIt: "Sticker NTAG213 con logo NFC stampato." },
  { id: 7, sku: "CD-N213", slug: "tessere-nfc-pvc-ntag213", category: "Tessere NFC", categorySlug: "tessere-nfc", price: 2.32, stock: 4000, weight: 0.006, nameIt: "Tessere NFC in PVC NTAG213", shortIt: "Card CR80 85,6 × 54 mm, NTAG213, stampabili, min. 10 pz.", descIt: "Tessere ISO CR80 in PVC con chip NTAG213." },
  { id: 8, sku: "CD-MF1K", slug: "tessere-nfc-pvc-mifare-classic-1k", category: "Tessere NFC", categorySlug: "tessere-nfc", price: 2.43, stock: 3500, weight: 0.006, nameIt: "Tessere NFC PVC MIFARE Classic 1k", shortIt: "Card RFID 13,56 MHz ISO 14443-A, 1 kB, controllo accessi.", descIt: "Card in PVC con MIFARE Classic EV1 1k per badge aziendali e controllo accessi." },
  { id: 9, sku: "CD-DFEV3", slug: "tessere-nfc-pvc-desfire-ev3", category: "Tessere NFC", categorySlug: "tessere-nfc", price: 3.33, stock: 1500, weight: 0.006, nameIt: "Tessere NFC PVC DESFire EV3", shortIt: "AES, messaggio SUN, EAL5+, fino a 1 milione di cicli.", descIt: "Card di sicurezza con MIFARE DESFire EV3." },
  { id: 10, sku: "CD-BIO", slug: "tessere-nfc-pvc-bio", category: "Tessere NFC", categorySlug: "tessere-nfc", price: 2.86, stock: 1200, weight: 0.006, nameIt: "Tessere NFC in PVC bio", shortIt: "PVC biodegradabile, stesse prestazioni del PVC classico.", descIt: "Card NFC in PVC bio biodegradabile." },
  { id: 11, sku: "CD-N216", slug: "tessere-nfc-pvc-ntag216", category: "Tessere NFC", categorySlug: "tessere-nfc", price: 2.86, stock: 2000, weight: 0.006, nameIt: "Tessere NFC in PVC NTAG216", shortIt: "Card CR80 con NTAG216, più spazio per vCard e menu.", descIt: "Tessere riscrivibili formato ISO con NTAG216." },
  { id: 12, sku: "CD-F08", slug: "tessere-nfc-pvc-fudan-1k", category: "Tessere NFC", categorySlug: "tessere-nfc", price: 1.60, stock: 8000, weight: 0.006, nameIt: "Tessere NFC PVC Fudan 1k F08", shortIt: "Card economiche 1k ISO 14443-A, bianche riscrivibili.", descIt: "Alternativa conveniente al Classic 1k per volumi alti." },
  { id: 13, sku: "CD-BAMBOO", slug: "tessere-nfc-bambu-ntag213", category: "Tessere NFC", categorySlug: "tessere-nfc", price: 2.70, stock: 400, weight: 0.008, nameIt: "Tessere NFC in bambù NTAG213", shortIt: "Card in legno di bambù, look naturale, NTAG213.", descIt: "Biglietto da visita NFC in bambù." },
  { id: 14, sku: "KIT-CARD", slug: "kit-card-nfc", category: "Tessere NFC", categorySlug: "tessere-nfc", price: 21.42, stock: 80, weight: 0.060, min: 1, nameIt: "Kit di Card NFC", shortIt: "10 card PVC, 7 chip diversi, per testare la soluzione giusta.", descIt: "Kit di valutazione: tessere bianche CR80 con chip misti." },
  { id: 15, sku: "BR-SIL-N213", slug: "braccialetti-nfc-silicone-ntag213", category: "Braccialetti NFC", categorySlug: "braccialetti-nfc", price: 2.70, stock: 2000, weight: 0.018, nameIt: "Braccialetti NFC silicone NTAG213", shortIt: "Silicone regolabile, impermeabile, per accessi e eventi.", descIt: "Bracciale in silicone con NTAG213." },
  { id: 16, sku: "BR-SIL-PREM", slug: "bracciali-nfc-silicone-premium", category: "Braccialetti NFC", categorySlug: "braccialetti-nfc", price: 4.48, stock: 800, weight: 0.022, nameIt: "Bracciali NFC in silicone Premium", shortIt: "Silicone spesso, più chip a scelta, stampa serigrafica.", descIt: "Versione premium per villaggi, spa e club." },
  { id: 17, sku: "BR-VEL-N213", slug: "bracciali-nfc-velcro-ntag213", category: "Braccialetti NFC", categorySlug: "braccialetti-nfc", price: 3.94, stock: 600, weight: 0.016, nameIt: "Bracciali NFC NTAG213 con velcro", shortIt: "Regolabili con velcro, per adulti e bambini.", descIt: "Bracciale impermeabile con chiusura a velcro." },
  { id: 18, sku: "BR-TEX-N213", slug: "braccialetti-nfc-tessili-ntag213", category: "Braccialetti NFC", categorySlug: "braccialetti-nfc", price: 3.51, stock: 700, weight: 0.012, nameIt: "Braccialetti NFC tessili elastici", shortIt: "Tessuto elastico, lavabile, NTAG213 sul quadrante.", descIt: "Bracciale in tessuto per usi ripetuti." },
  { id: 19, sku: "BR-SLIM", slug: "braccialetti-monouso-slim-ntag21x", category: "Braccialetti NFC", categorySlug: "braccialetti-nfc", price: 1.42, stock: 5000, weight: 0.004, nameIt: "Braccialetti monouso Slim NTAG21x", shortIt: "Vinile monouso, stampa 1 colore, anche olografici.", descIt: "Braccialetti identificativi per concerti, fiere e festival." },
  { id: 20, sku: "KIT-BR", slug: "kit-braccialetti-nfc", category: "Braccialetti NFC", categorySlug: "braccialetti-nfc", price: 25.02, stock: 40, weight: 0.080, min: 1, nameIt: "Kit di Braccialetti NFC", shortIt: "7 braccialetti misti per scegliere materiale e chiusura.", descIt: "Pacchetto di prova con silicone, velcro, tessuto e monouso." },
  { id: 21, sku: "IND-IP68", slug: "tag-industriali-ip68-ntag213", category: "Tag industriali", categorySlug: "tag-industriali", price: 5.22, stock: 900, weight: 0.012, nameIt: "Tag industriali IP68 NTAG213/216", shortIt: "34 mm, IP68, per asset tracking e ambienti umidi.", descIt: "Tag rugged per magazzini, impianti e logistica." },
  { id: 22, sku: "IND-ABS", slug: "tag-nfc-abs-forati-ip66", category: "Tag industriali", categorySlug: "tag-industriali", price: 3.24, stock: 700, weight: 0.010, nameIt: "Tag NFC ABS forati IP66", shortIt: "ABS forato, da fissare con rivetto o fascetta.", descIt: "Tag in ABS con fori di fissaggio." },
  { id: 23, sku: "SH-N213-22", slug: "tag-schermati-ntag213-22mm", category: "Tag schermati", categorySlug: "tag-schermati", price: 2.14, stock: 2500, weight: 0.002, nameIt: "Tag schermati NTAG213 22mm", shortIt: "Funzionano sul metallo, sticker flessibili NTAG213.", descIt: "Strato ferrite per applicazione su superfici metalliche." },
  { id: 24, sku: "SH-IP68-30", slug: "tag-schermati-ip68-30mm", category: "Tag schermati", categorySlug: "tag-schermati", price: 2.68, stock: 1200, weight: 0.004, nameIt: "Tag schermati IP68 30mm", shortIt: "On-metal + IP68, per asset metallici all'aperto.", descIt: "Combinazione schermatura e tenuta stagna." },
  { id: 25, sku: "GD-KEY", slug: "portachiavi-nfc-ntag213", category: "Gadget NFC", categorySlug: "gadget-nfc", price: 3.58, stock: 1500, weight: 0.008, nameIt: "Portachiavi NFC NTAG213", shortIt: "Gadget durevole, NTAG213, personalizzabile.", descIt: "Portachiavi con chip NTAG213." },
  { id: 26, sku: "GD-KEY-DROP", slug: "portachiavi-nfc-goccia-ip68", category: "Gadget NFC", categorySlug: "gadget-nfc", price: 4.32, stock: 700, weight: 0.004, min: 5, nameIt: "Portachiavi NFC a goccia IP68", shortIt: "Spessore 2,2 mm, impermeabile IP68, incisione laser.", descIt: "Portachiavi a goccia sottili impermeabili IP68." },
  { id: 27, sku: "GD-KEY-LOCK", slug: "portachiavi-nfc-locket", category: "Gadget NFC", categorySlug: "gadget-nfc", price: 9.16, stock: 400, weight: 0.018, nameIt: "Portachiavi NFC Locket", shortIt: "Acciaio inox lucidato, per accessi e sicurezza.", descIt: "Portachiavi rotondo con cornice in acciaio inossidabile." },
  { id: 28, sku: "GD-PEND", slug: "ciondoli-ntag213-logo-nfc", category: "Gadget NFC", categorySlug: "gadget-nfc", price: 3.58, stock: 1000, weight: 0.006, min: 5, nameIt: "Ciondoli NTAG213 con logo NFC", shortIt: "Ciondoli resinati impermeabili con simbolo NFC.", descIt: "Ciondoli tondi resinati con chip NTAG213." },
  { id: 29, sku: "GD-KEY-PREM", slug: "portachiavi-nfc-premium", category: "Gadget NFC", categorySlug: "gadget-nfc", price: 3.58, stock: 800, weight: 0.009, min: 5, nameIt: "Portachiavi NFC Premium", shortIt: "ABS IP66 con grafica sotto resina epossidica.", descIt: "Portachiavi in ABS, impermeabile IP66." },
  { id: 30, sku: "GD-KEY-BAMBOO", slug: "portachiavi-nfc-bambu-ntag213", category: "Gadget NFC", categorySlug: "gadget-nfc", price: 3.58, stock: 500, weight: 0.008, nameIt: "Portachiavi NFC in bambù NTAG213", shortIt: "Bambù, da -40 °C a 80 °C, per accessi e gadget.", descIt: "Portachiavi tondo in bambù con chip NTAG213." },
  { id: 31, sku: "GD-PIN", slug: "spillette-nfc-ntag213", category: "Gadget NFC", categorySlug: "gadget-nfc", price: 3.96, stock: 600, weight: 0.007, nameIt: "Spillette NTAG213 metalliche", shortIt: "Spilla metallica con logo NFC e chip NTAG213.", descIt: "Gadget da giacca o shopper." },
  { id: 32, sku: "RD-ACR122", slug: "lettore-nfc-usb-acr122u", category: "Lettori e scrittori", categorySlug: "lettori-nfc", price: 71.82, stock: 40, weight: 0.120, min: 1, nameIt: "Lettore NFC USB ACR122U", shortIt: "Reader/writer USB per PC, programmazione e UID.", descIt: "Lettore USB plug-and-play per scrivere e leggere tag NFC da computer." },
  { id: 33, sku: "RD-U3700", slug: "lettore-nfc-utrust-3700f", category: "Lettori e scrittori", categorySlug: "lettori-nfc", price: 89.82, stock: 25, weight: 0.180, min: 1, nameIt: "uTrust 3700 F NFC Reader/Writer", shortIt: "Multi-ISO, USB, per encoding professionale.", descIt: "Lettore/scrittore multi-ISO per card e tag." },
  { id: 34, sku: "RD-JUSTID", slug: "lettore-uid-justid-usb", category: "Lettori e scrittori", categorySlug: "lettori-nfc", price: 53.82, stock: 35, weight: 0.040, min: 1, nameIt: "JustID — lettore UID USB", shortIt: "Chiavetta USB che emula tastiera con l'UID del tag.", descIt: "Avvicini il tag e l'UID viene digitato nel campo attivo." },
  { id: 35, sku: "SV-LABKEY", slug: "kit-controllo-accessi-nfc", category: "Soluzioni NFC", categorySlug: "soluzioni-nfc", price: 160.20, stock: 15, weight: 0.350, min: 1, nameIt: "Kit controllo accessi NFC", shortIt: "Lettore + 10 card + guida di avvio per PMI.", descIt: "Kit di partenza per palestre, uffici e B&B." },
  { id: 36, sku: "CD-DNA", slug: "tessere-nfc-ntag424-dna", category: "Tessere NFC", categorySlug: "tessere-nfc", price: 2.86, stock: 900, weight: 0.006, nameIt: "Tessere NFC PVC NTAG424 DNA", shortIt: "Anti-contraffazione con messaggio SUN e AES.", descIt: "Card con NTAG424 DNA per autenticità prodotto." },
];

function buildFallbackCatalog(): ProductWithCategory[] {
  return FALLBACK_CATALOG_ITEMS.map((item) => ({
    id: item.id,
    name: item.nameIt,
    slug: item.slug,
    description: item.descIt,
    descriptionShort: item.shortIt,
    price: item.price,
    catalogPrice: item.price,
    wholesalePrice: null,
    category: item.category,
    categorySlug: item.categorySlug,
    categoryId: 1,
    image: `/products/${item.slug}.png`,
    images: [],
    sku: item.sku,
    ean13: null,
    brand: "NXP",
    weight: item.weight,
    stockQuantity: item.stock,
    minQuantity: item.min ?? 10,
    metaTitle: item.nameIt,
    metaDescription: item.shortIt,
    name_it: item.nameIt,
    descriptionShort_it: item.shortIt,
    description_it: item.descIt,
  }));
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const WORD_NUMBERS: Record<string, number> = {
  un: 1,
  uno: 1,
  una: 1,
  due: 2,
  tre: 3,
  quattro: 4,
  cinque: 5,
  sei: 6,
  sette: 7,
  otto: 8,
  nove: 9,
  dieci: 10,
  quindici: 15,
  venti: 20,
  venticinque: 25,
  trenta: 30,
  quaranta: 40,
  cinquanta: 50,
  sessanta: 60,
  settanta: 70,
  ottanta: 80,
  novanta: 90,
  cento: 100,
  duecento: 200,
  trecento: 300,
  quattrocento: 400,
  cinquecento: 500,
  mille: 1000,
};

function extractQuantities(rawPrompt: string): { mainQuantity: number | null; readerQuantity: number } {
  const text = normalizeText(rawPrompt);

  // Exclude technical numbers like NTAG213, NTAG216, NTAG210, NTAG424, IP68, IP66, 22mm, 38mm, 25mm, 30mm, 1k, EV3, 3700, 122
  const cleaned = text
    .replace(/\bntag\s*\d+[a-z]*\b/g, " ")
    .replace(/\bip\s*\d+\b/g, " ")
    .replace(/\b\d+\s*(?:mm|cm|m|kb|byte|bit|mhz|gg|giorni|ore|h|euro|€|%)\b/g, " ")
    .replace(/\b(?:acr\s*122\w*|3700\w*|ev\d+|1k|f08|cr80|iso\s*\d+)\b/g, " ")
    .replace(/https?:\/\/\S+/g, " ");

  let readerQty = 1;
  const readerMatch = cleaned.match(/(\d+)\s*(?:lettor[ei]|reader|scrittor[ei]|acr122|justid)/);
  if (readerMatch) {
    readerQty = Math.max(1, Math.min(50, Number.parseInt(readerMatch[1], 10)));
  }

  // Look for explicit quantity patterns first: "50 tessere", "100 pezzi", "x 30", "30 pz", "50 dipendenti"
  const explicitPatterns = [
    /(\d[\d.]*)\s*(?:pezz[oi]|pz|unit[aà]|tesser[ae]|card|bigliett[oi]|badge|sticker|adesiv[oi]|etichett[ae]|braccial(?:ett)?[oi]|portachiav[ei]|tag|ciondol[oi]|spill(?:ett)?[ae]|dipendent[ei]|person[ae]|agnol[oi]|tavol[oi]|camer[ae]|stanz[ae]|client[ei]|ospit[ei]|partecipant[ei]|invitat[oi]|soci|iscritt[oi]|macchinari|attrezz[oi]|pallet|prodott[oi])/g,
    /(?:quantit[aà]|qta|numero|circa|almeno|minimo|vorrei|servono|prendo|ordinare|acquistare)\s*(?:di\s*)?(\d[\d.]*)/g,
  ];

  const candidates: number[] = [];
  for (const regex of explicitPatterns) {
    let m: RegExpExecArray | null;
    while ((m = regex.exec(cleaned)) !== null) {
      const val = Number.parseInt(m[1].replace(/\./g, ""), 10);
      if (Number.isFinite(val) && val > 0 && val <= 100000) {
        candidates.push(val);
      }
    }
  }

  if (candidates.length > 0) {
    return { mainQuantity: Math.max(...candidates), readerQuantity: readerQty };
  }

  // Check standalone numbers
  const standaloneMatches = cleaned.match(/\b(\d[\d.]*)\b/g);
  if (standaloneMatches) {
    for (const raw of standaloneMatches) {
      const n = Number.parseInt(raw.replace(/\./g, ""), 10);
      if (Number.isFinite(n) && n >= 1 && n <= 50000 && n !== 213 && n !== 216 && n !== 210 && n !== 424) {
        candidates.push(n);
      }
    }
  }

  if (candidates.length > 0) {
    return { mainQuantity: Math.max(...candidates), readerQuantity: readerQty };
  }

  // Check word numbers
  for (const [word, num] of Object.entries(WORD_NUMBERS)) {
    const reg = new RegExp(`\\b${word}\\b`, "i");
    if (reg.test(cleaned) && num >= 5) {
      return { mainQuantity: num, readerQuantity: readerQty };
    }
  }

  return { mainQuantity: null, readerQuantity: readerQty };
}

function detectPrintOption(rawPrompt: string): PrintOption {
  const text = normalizeText(rawPrompt);

  if (
    /\b(?:fronte\s*(?:\/|e)\s*retro|due\s*lat[oi]|2\s*lat[oi]|entrambi\s*i\s*lati|doppia\s*faccia|fronte\s*retro)\b/.test(
      text
    )
  ) {
    return "color2";
  }

  if (
    /\b(?:stampa\s*(?:in\s*)?nero|bianco\s*e\s*nero|monocromatic[oa]|solo\s*testo\s*nero|qr\s*code\s*nero)\b/.test(
      text
    )
  ) {
    return "black";
  }

  if (
    /\b(?:a\s*colori|col\s*mio\s*logo|con\s*logo|con\s*il\s*logo|personalizzat[oaei]|stampat[oaei]|con\s*grafica|mia\s*grafica|nostro\s*logo)\b/.test(
      text
    )
  ) {
    return "color1";
  }

  if (/\b(?:neutr[oaei]|bianch[eoi]|senza\s*stampa|non\s*stampat[oaei]|vergin[ei])\b/.test(text)) {
    return "none";
  }

  return "none";
}

function detectProgrammingNote(rawPrompt: string): { mode: "virgin" | "programmed"; note: string | null; keySuffix: string } {
  const text = normalizeText(rawPrompt);

  const urlMatch = rawPrompt.match(/https?:\/\/[^\s,;)"]+/i);
  if (urlMatch) {
    const url = urlMatch[0];
    return {
      mode: "programmed",
      note: `Programmazione NFC: Link ${url}`,
      keySuffix: `:nfc:${url.slice(0, 28)}`,
    };
  }

  if (/\b(?:recension[ei]|google\s*review|tripadvisor|trustpilot)\b/.test(text)) {
    return {
      mode: "programmed",
      note: "Programmazione NFC: Link recensioni Google / pagina attività",
      keySuffix: ":nfc:recensioni",
    };
  }

  if (/\b(?:vcard|bigliett[oi]\s*da\s*visita|contatt[oi]\s*rubrica|rubrica|profilo\s*linkedin|social)\b/.test(text)) {
    return {
      mode: "programmed",
      note: "Programmazione NFC: vCard / contatto digitale (inclusa)",
      keySuffix: ":nfc:vcard",
    };
  }

  if (/\b(?:menu|menù|listino|qr|ristorante|bar|tavol[oi]|ordinazion[ei])\b/.test(text)) {
    return {
      mode: "programmed",
      note: "Programmazione NFC: Apertura menu digitale / link web",
      keySuffix: ":nfc:menu",
    };
  }

  if (/\b(?:wi-?fi|ospiti|hotel|b&b|bnb|appartament[oi])\b/.test(text)) {
    return {
      mode: "programmed",
      note: "Programmazione NFC: Connessione Wi-Fi / info ospiti",
      keySuffix: ":nfc:wifi",
    };
  }

  if (/\b(?:programmat[oaei]|codificat[oaei]|con\s*link|con\s*url)\b/.test(text)) {
    return {
      mode: "programmed",
      note: "Programmazione NFC richiesta (link/dati da comunicare)",
      keySuffix: ":nfc:tbd",
    };
  }

  return { mode: "virgin", note: null, keySuffix: "" };
}

function buildCartItemFromProduct(
  product: ProductWithCategory,
  opts: {
    quantity: number;
    printOption?: PrintOption;
    printPrices: { black: number; color1: number; color2: number };
    programming: { mode: "virgin" | "programmed"; note: string | null; keySuffix: string };
    reason: string;
    badge?: string;
  }
): AiCartRecommendation {
  const minQty = minQuantityForProduct(product.minQuantity, product);
  const clampedQty = Math.max(minQty, Math.floor(opts.quantity) || minQty);
  const isPrintable = productNeedsPrintOption({ categorySlug: product.categorySlug });
  const chosenPrint: PrintOption = isPrintable ? parsePrintOption(opts.printOption) : "none";
  const surcharge = isPrintable ? printSurcharge(chosenPrint, opts.printPrices) : 0;
  const unitPrice = roundMoney(product.price + surcharge);

  const printLabels: Record<PrintOption, string> = {
    none: "",
    black: "Stampa in nero (1 lato)",
    color1: "Stampa a colori (1 lato)",
    color2: "Stampa a colori fronte/retro",
  };

  const noteParts: string[] = [];
  if (chosenPrint !== "none") {
    noteParts.push(printLabels[chosenPrint]);
  }
  if (product.categorySlug !== "lettori-nfc" && opts.programming.note) {
    noteParts.push(opts.programming.note);
  }

  let lineKey: string | undefined;
  if (isPrintable) {
    const pKey = printOptionLineKey(chosenPrint) ?? "";
    const combined = `${pKey}${opts.programming.keySuffix}`;
    lineKey = combined || undefined;
  } else if (product.categorySlug !== "lettori-nfc" && opts.programming.mode === "programmed") {
    lineKey = `nfc:prog${opts.programming.keySuffix}`;
  }

  return {
    productId: product.id,
    slug: product.slug,
    sku: product.sku,
    name: product.name_it || product.name,
    category: product.category,
    categorySlug: product.categorySlug,
    image: product.image,
    weight: product.weight,
    basePrice: product.price,
    unitPrice,
    quantity: clampedQty,
    minQuantity: minQty,
    stockQuantity: product.stockQuantity,
    printOption: chosenPrint,
    printSurcharge: surcharge,
    lineKey,
    lineNotes: noteParts.length > 0 ? noteParts.join(" · ") : null,
    reason: opts.reason,
    badge: opts.badge,
  };
}

export async function generateSmartCartRecommendation(
  prompt: string,
  options?: { formatHint?: string | null; productSlugHint?: string | null }
): Promise<AiShoppingAssistantResponse> {
  const [productsData, printConfig] = await Promise.all([
    getProducts().catch(() => ({ products: buildFallbackCatalog(), total: FALLBACK_CATALOG_ITEMS.length })),
    getPrintConfig(),
  ]);
  const products = productsData.products.length > 0 ? productsData.products : buildFallbackCatalog();

  const activeProducts = products.filter((p) => p.stockQuantity > 0);
  const bySlug = new Map(activeProducts.map((p) => [p.slug, p]));

  const text = normalizeText(prompt);
  const { mainQuantity, readerQuantity } = extractQuantities(prompt);
  let printOption = detectPrintOption(prompt);
  const programming = detectProgrammingNote(prompt);

  // Try optional LLM if API key is present
  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey && prompt.trim().length > 5) {
    try {
      const llmResult = await tryOpenAiRecommendation(prompt, activeProducts, printConfig.prices, openAiKey);
      if (llmResult && llmResult.items.length > 0) {
        return llmResult;
      }
    } catch {
      // Fallback to deterministic smart engine
    }
  }

  const findProduct = (...slugs: string[]): ProductWithCategory | undefined => {
    for (const s of slugs) {
      const hit = bySlug.get(s);
      if (hit) return hit;
    }
    return activeProducts[0];
  };

  const selectedItems: AiCartRecommendation[] = [];
  const alternativeItems: AiCartRecommendation[] = [];
  let useCaseLabel = "Fornitura NFC pronta all'uso";
  let summaryText = "";

  // Determine intent flags
  const mentionsMetal = /\b(?:metall[oichea]+|ferro|acciaio|alluminio|scaffal[ei]|macchinari[o]?|attrezzatur[ae]|carrell[oi]|furgon[ei]|contenitor[ei]\s*metallic|superfici[e]?\s*metallic|on-?metal|schermat[oaei])\b/.test(text);
  const mentionsIndustrial = /\b(?:industrial[ei]|cantiere|magazzin[oi]|logistica|pallet|estern[oi]|outdoor|acqua|pioggia|alte\s*temperature|ip68|ip66|rivett[oi]|fascett[ae]|asset\s*tracking|manutenzion[ei]|impiant[oi])\b/.test(text);
  const mentionsBracelet =
    options?.formatHint === "bracelet" ||
    /\b(?:braccial(?:ett)?[oi]|polso|piscin[ae]|villagg[io]|camping|campeggi[o]?|spa|terme|palestr[ae]|spiaggi[ae]|lido|parco\s*acquatico|concert[oi]|festival|discotec[ahe]|event[oi]\s*estiv|centro\s*estivo)\b/.test(text);
  const mentionsDisposable = /\b(?:monouso|usa\s*e\s*getta|ingresso\s*giornaliero|un\s*giorno|concerto|festival|serata)\b/.test(text);
  const mentionsKeyfob = /\b(?:portachiav[ei]|chiav[ei]|b&b|bnb|affittacamere|hotel|alberg[oh]|portineria|ciondol[oi]|spillett[ae]|spilla|gadget)\b/.test(text);
  const mentionsBusinessCard = /\b(?:bigliett[oi]\s*(?:da\s*)?visita|vcard|contatto\s*digitale|networking|fiera|rappresentant[ei]|commercial[ei]|venditor[ei]|professionist[ai]|studio\s*professionale)\b/.test(text);
  const mentionsAccessControl = /\b(?:controllo\s*access[oi]|marcatempo|presenz[ae]|timbratur[ae]|badge\s*aziendal[ei]|tornell[oi]|apriporta|serratur[ae]|dipendent[ei]|varc[oh]|uffici[o]?)\b/.test(text);
  const mentionsReviewsOrMenu = /\b(?:recension[ei]|google|tripadvisor|menu|menù|ristorant[ei]|bar|pizzeri[ae]|local[ei]|tavol[oi]|cassa|bancone|vetrin[ae]|negozi[o]?|salon[ei]|parrucchier[ei]|estetist[ai])\b/.test(text);
  const mentionsSticker =
    options?.formatHint === "sticker" ||
    /\b(?:sticker|adesiv[oi]|etichett[ae]|bollini|packaging|scatole|bottigli[ae]|prodott[oi]|catalogo|brochure|depliant|volantin[oi])\b/.test(text);
  const mentionsEco = /\b(?:bamb[uù]|legno|ecologic[oa]|sostenibil[ei]|green|bio|biodegradabil[ei]|riciclat[oa]|ocean)\b/.test(text);
  const mentionsAntiClone = /\b(?:anticlonazione|anti-?contraffazione|autenticit[aà]|certificazion[ei]|dna|424|desfire|alta\s*sicurezza|crittografi[ae])\b/.test(text);
  const mentionsKit = /\b(?:kit|campion[ei]|prov[ae]|testare|valutazion[ei]|non\s*so\s*quale|assortit[oi]|misti)\b/.test(text);
  const mentionsReader = /\b(?:lettor[ei]|scrittor[ei]|reader|writer|usb|pc|computer|acr122|utrust|3700|justid|programmare\s*da\s*sol[oi])\b/.test(text);
  const mentionsCard =
    options?.formatHint === "card" ||
    /\b(?:tesser[ae]|card|carte|badge|pvc)\b/.test(text);

  // If a specific product slug was hinted (e.g. coming from product page)
  if (options?.productSlugHint && bySlug.has(options.productSlugHint)) {
    const hinted = bySlug.get(options.productSlugHint)!;
    const defaultQty = mainQuantity ?? Math.max(hinted.minQuantity, 20);
    selectedItems.push(
      buildCartItemFromProduct(hinted, {
        quantity: defaultQty,
        printOption,
        printPrices: printConfig.prices,
        programming,
        reason: "Il prodotto selezionato, già configurato con la quantità ideale per ordinare subito.",
        badge: "Scelta principale",
      })
    );
  }

  // 1. Kit / Sample request
  if (mentionsKit && selectedItems.length === 0) {
    useCaseLabel = "Kit di prova e valutazione NFC";
    const kitCard = findProduct("kit-card-nfc");
    const kitBr = findProduct("kit-braccialetti-nfc");
    if (kitCard) {
      selectedItems.push(
        buildCartItemFromProduct(kitCard, {
          quantity: 1,
          printPrices: printConfig.prices,
          programming: { mode: "virgin", note: null, keySuffix: "" },
          reason: "10 tessere con 7 chip diversi per testare sul campo compatibilità e portata.",
          badge: "Kit completo",
        })
      );
    }
    if (kitBr && mentionsBracelet) {
      selectedItems.push(
        buildCartItemFromProduct(kitBr, {
          quantity: 1,
          printPrices: printConfig.prices,
          programming: { mode: "virgin", note: null, keySuffix: "" },
          reason: "7 braccialetti assortiti (silicone, tessuto, velcro, monouso) per toccare con mano i materiali.",
          badge: "Kit bracciali",
        })
      );
    } else if (kitBr) {
      alternativeItems.push(
        buildCartItemFromProduct(kitBr, {
          quantity: 1,
          printPrices: printConfig.prices,
          programming: { mode: "virgin", note: null, keySuffix: "" },
          reason: "Aggiungi anche il kit di 7 braccialetti NFC in diversi materiali.",
        })
      );
    }
    summaryText =
      "Ho preparato il carrello con il nostro Kit di valutazione (senza minimo d'ordine) così puoi testare subito i vari chip e materiali e ordinare immediatamente.";
  }

  // 2. Metal / Industrial / Logistics
  if (selectedItems.length === 0 && (mentionsMetal || mentionsIndustrial)) {
    useCaseLabel = mentionsMetal ? "Applicazione su metallo / superfici schermate" : "Tracciabilità industriale & ambienti gravosi";
    const qty = mainQuantity ?? 50;

    if (mentionsMetal && mentionsIndustrial) {
      const p = findProduct("tag-schermati-ip68-30mm", "tag-schermati-ntag213-22mm");
      if (p) {
        selectedItems.push(
          buildCartItemFromProduct(p, {
            quantity: qty,
            printPrices: printConfig.prices,
            programming,
            reason: "Dotato di schermatura in ferrite (funziona sul metallo) e protezione stagna IP68 per esterno/industria.",
            badge: "On-Metal + IP68",
          })
        );
      }
      const alt = findProduct("tag-nfc-abs-forati-ip66");
      if (alt) {
        alternativeItems.push(
          buildCartItemFromProduct(alt, {
            quantity: qty,
            printPrices: printConfig.prices,
            programming,
            reason: "Fissaggio meccanico con viti, rivetti o fascette per pallet e macchinari.",
          })
        );
      }
    } else if (mentionsMetal) {
      const p = findProduct("tag-schermati-ntag213-22mm", "tag-schermati-ip68-30mm");
      if (p) {
        selectedItems.push(
          buildCartItemFromProduct(p, {
            quantity: qty,
            printPrices: printConfig.prices,
            programming,
            reason: "I normali tag non leggono sul metallo: questo sticker ha lo strato in ferrite anti-interferenza integrato.",
            badge: "Speciale Metallo",
          })
        );
      }
      const alt = findProduct("tag-schermati-ip68-30mm");
      if (alt && alt.slug !== p?.slug) {
        alternativeItems.push(
          buildCartItemFromProduct(alt, {
            quantity: qty,
            printPrices: printConfig.prices,
            programming,
            reason: "Versione rigida IP68 da 30mm per metalli esposti a pioggia o lavaggi.",
          })
        );
      }
    } else {
      const p = findProduct("tag-industriali-ip68-ntag213", "tag-nfc-abs-forati-ip66");
      if (p) {
        selectedItems.push(
          buildCartItemFromProduct(p, {
            quantity: qty,
            printPrices: printConfig.prices,
            programming,
            reason: "Involucro sigillato IP68 progettato per magazzini, logistica, umidità e utilizzo intensivo.",
            badge: "Rugged IP68",
          })
        );
      }
      const alt = findProduct("tag-nfc-abs-forati-ip66");
      if (alt && alt.slug !== p?.slug) {
        alternativeItems.push(
          buildCartItemFromProduct(alt, {
            quantity: qty,
            printPrices: printConfig.prices,
            programming,
            reason: "Alternativa in ABS forato per fissaggio con fascetta o rivetto.",
          })
        );
      }
    }

    summaryText = `Per superfici metalliche o ambienti industriali ho selezionato tag specifici ad alta resistenza (${qty} pz), già pronti per l'acquisto immediato senza bisogno di attendere preventivi.`;
  }

  // 3. Wristbands / Events / Pools / Gyms
  if (selectedItems.length === 0 && mentionsBracelet) {
    useCaseLabel = mentionsDisposable ? "Eventi, concerti e ingressi giornalieri" : "Braccialetti NFC impermeabili per accessi e strutture";
    const qty = mainQuantity ?? (mentionsDisposable ? 100 : 50);

    if (mentionsDisposable) {
      const p = findProduct("braccialetti-monouso-slim-ntag21x");
      if (p) {
        selectedItems.push(
          buildCartItemFromProduct(p, {
            quantity: qty,
            printPrices: printConfig.prices,
            programming,
            reason: "Braccialetto monouso anti-strappo in vinile con chip NFC: economico e perfetto per eventi, fiere e festival.",
            badge: "Ideale Eventi",
          })
        );
      }
    } else if (/\b(?:bambin[oi]|centro\s*estivo|velcro)\b/.test(text)) {
      const p = findProduct("bracciali-nfc-velcro-ntag213");
      if (p) {
        selectedItems.push(
          buildCartItemFromProduct(p, {
            quantity: qty,
            printPrices: printConfig.prices,
            programming,
            reason: "Chiusura regolabile a velcro: veste comodamente sia adulti che bambini.",
            badge: "Regolabile",
          })
        );
      }
    } else if (/\b(?:tessut[oi]|tessil[ei]|lavabil[ei]|festival)\b/.test(text)) {
      const p = findProduct("braccialetti-nfc-tessili-ntag213");
      if (p) {
        selectedItems.push(
          buildCartItemFromProduct(p, {
            quantity: qty,
            printPrices: printConfig.prices,
            programming,
            reason: "Tessuto elastico morbido e lavabile con chip NTAG213.",
            badge: "Comfort Tessile",
          })
        );
      }
    } else {
      const p = findProduct("braccialetti-nfc-silicone-ntag213");
      if (p) {
        selectedItems.push(
          buildCartItemFromProduct(p, {
            quantity: qty,
            printPrices: printConfig.prices,
            programming,
            reason: "100% impermeabile (acqua clorata e salata), cinturino regolabile e chip NTAG213 universale.",
            badge: "Più venduto",
          })
        );
      }
    }

    const altPrem = findProduct("bracciali-nfc-silicone-premium");
    const altKit = findProduct("kit-braccialetti-nfc");
    if (altPrem && !selectedItems.some((i) => i.slug === altPrem.slug)) {
      alternativeItems.push(
        buildCartItemFromProduct(altPrem, {
          quantity: qty,
          printPrices: printConfig.prices,
          programming,
          reason: "Versione Silicone Premium ad alto spessore per spa, resort e club esclusivi.",
        })
      );
    }
    if (altKit) {
      alternativeItems.push(
        buildCartItemFromProduct(altKit, {
          quantity: 1,
          printPrices: printConfig.prices,
          programming: { mode: "virgin", note: null, keySuffix: "" },
          reason: "Vuoi prima toccare con mano tutti i 7 modelli di braccialetti? Aggiungi il Kit prova (1 pz).",
        })
      );
    }

    summaryText = `Ho configurato il carrello con ${qty} braccialetti NFC resistenti all'acqua e pronti all'uso. Puoi modificare la quantità e completare subito l'ordine online.`;
  }

  // 4. Business Cards / vCard / Networking
  if (selectedItems.length === 0 && mentionsBusinessCard) {
    useCaseLabel = "Biglietti da visita NFC & vCard digitali";
    const qty = mainQuantity ?? 20;
    // Default to color print if they didn't explicitly ask for blank cards
    if (printOption === "none" && !/\b(?:neutr[oaei]|bianch[eoi]|senza\s*stampa)\b/.test(text)) {
      printOption = "color1";
    }
    const vcardProg =
      programming.mode === "programmed"
        ? programming
        : {
            mode: "programmed" as const,
            note: "Programmazione NFC: vCard / contatto digitale (inclusa)",
            keySuffix: ":nfc:vcard",
          };

    if (mentionsEco) {
      const bamboo = findProduct("tessere-nfc-bambu-ntag213", "tessere-nfc-pvc-bio");
      if (bamboo) {
        selectedItems.push(
          buildCartItemFromProduct(bamboo, {
            quantity: qty,
            printOption,
            printPrices: printConfig.prices,
            programming: vcardProg,
            reason: "Card in vero legno di bambù naturale con chip NTAG213: impatto estetico premium per biglietti da visita.",
            badge: "Eco & Elegante",
          })
        );
      }
    } else {
      const n216 = findProduct("tessere-nfc-pvc-ntag216", "tessere-nfc-pvc-ntag213");
      if (n216) {
        selectedItems.push(
          buildCartItemFromProduct(n216, {
            quantity: qty,
            printOption,
            printPrices: printConfig.prices,
            programming: vcardProg,
            reason: "Chip NTAG216 con 888 byte di memoria: contiene comodamente una vCard completa (nome, tel, email, sito, azienda) o link profilo.",
            badge: "Ideale vCard (888B)",
          })
        );
      }
    }

    const alt213 = findProduct("tessere-nfc-pvc-ntag213");
    const altBamboo = findProduct("tessere-nfc-bambu-ntag213");
    if (alt213 && !selectedItems.some((i) => i.slug === alt213.slug)) {
      alternativeItems.push(
        buildCartItemFromProduct(alt213, {
          quantity: qty,
          printOption,
          printPrices: printConfig.prices,
          programming: vcardProg,
          reason: "Se ti basta programmare solo un link (es. Linktree o pagina web), NTAG213 ti fa risparmiare.",
        })
      );
    }
    if (altBamboo && !selectedItems.some((i) => i.slug === altBamboo.slug)) {
      alternativeItems.push(
        buildCartItemFromProduct(altBamboo, {
          quantity: qty,
          printOption,
          printPrices: printConfig.prices,
          programming: vcardProg,
          reason: "Alternativa in bambù naturale per distinguerti ai meeting.",
        })
      );
    }

    summaryText = `Per biglietti da visita smart ho pre-caricato ${qty} tessere con memoria estesa NTAG216, stampa personalizzata e programmazione vCard inclusa. Puoi acquistare subito e caricare il tuo logo al checkout (o dopo l'ordine)!`;
  }

  // 5. Access Control / Employee Badges / Time & Attendance
  if (selectedItems.length === 0 && mentionsAccessControl) {
    useCaseLabel = "Controllo accessi, badge dipendenti e rilevazione presenze";
    const qty = mainQuantity ?? 50;

    if (/\b(?:kit\s*completo|sistema\s*completo|partire\s*da\s*zero)\b/.test(text) && qty <= 15) {
      const kit = findProduct("kit-controllo-accessi-nfc");
      if (kit) {
        selectedItems.push(
          buildCartItemFromProduct(kit, {
            quantity: 1,
            printPrices: printConfig.prices,
            programming,
            reason: "Kit chiavi in mano con lettore + 10 card + guida di avvio rapida per uffici, B&B e palestre.",
            badge: "Kit Pronto Uso",
          })
        );
      }
    } else {
      const card = mentionsAntiClone
        ? findProduct("tessere-nfc-pvc-desfire-ev3", "tessere-nfc-pvc-mifare-classic-1k")
        : qty >= 200 && /\b(?:economic[oahe]|risparmi|basso\s*costo|fudan)\b/.test(text)
          ? findProduct("tessere-nfc-pvc-fudan-1k", "tessere-nfc-pvc-mifare-classic-1k")
          : findProduct("tessere-nfc-pvc-mifare-classic-1k", "tessere-nfc-pvc-ntag213");

      if (card) {
        selectedItems.push(
          buildCartItemFromProduct(card, {
            quantity: qty,
            printOption,
            printPrices: printConfig.prices,
            programming,
            reason: "Standard ISO 14443-A 13,56 MHz per marcatempo, tornelli, badge aziendali e serrature elettroniche.",
            badge: "Standard Accessi",
          })
        );
      }

      if (mentionsReader || /\b(?:pc|usb|leggere|codificare|abbinare)\b/.test(text)) {
        const reader = findProduct("lettore-uid-justid-usb", "lettore-nfc-usb-acr122u");
        if (reader) {
          selectedItems.push(
            buildCartItemFromProduct(reader, {
              quantity: readerQuantity,
              printPrices: printConfig.prices,
              programming: { mode: "virgin", note: null, keySuffix: "" },
              reason: "Lettore USB emulazione tastiera: avvicini il badge e scrive in automatico il codice UID nel tuo gestionale senza installare driver.",
              badge: "Plug & Play",
            })
          );
        }
      } else {
        const reader = findProduct("lettore-uid-justid-usb");
        if (reader) {
          alternativeItems.push(
            buildCartItemFromProduct(reader, {
              quantity: 1,
              printPrices: printConfig.prices,
              programming: { mode: "virgin", note: null, keySuffix: "" },
              reason: "Ti serve anche il lettore USB per registrare i badge sul PC? Aggiungilo con 1 click.",
            })
          );
        }
      }
    }

    summaryText = `Ho preparato la fornitura per controllo accessi/presenze (${qty} badge) pronta per il checkout immediato.`;
  }

  // 6. Keyfobs / B&B / Hotels / Gadgets
  if (selectedItems.length === 0 && mentionsKeyfob) {
    useCaseLabel = "Portachiavi e Gadget NFC resistenti";
    const qty = mainQuantity ?? 30;

    if (/\b(?:spillett[ae]|spilla)\b/.test(text)) {
      const pin = findProduct("spillette-nfc-ntag213");
      if (pin) {
        selectedItems.push(
          buildCartItemFromProduct(pin, {
            quantity: qty,
            printPrices: printConfig.prices,
            programming,
            reason: "Spilletta metallica con chip NTAG213 per staff, eventi e punti vendita.",
            badge: "Gadget Staff",
          })
        );
      }
    } else if (/\b(?:ciondol[oi]|collari|animali|cani|gatti)\b/.test(text)) {
      const pend = findProduct("ciondoli-ntag213-logo-nfc");
      if (pend) {
        selectedItems.push(
          buildCartItemFromProduct(pend, {
            quantity: qty,
            printPrices: printConfig.prices,
            programming,
            reason: "Ciondolo tondo resinato impermeabile con simbolo NFC in vista (min. 5 pz).",
            badge: "Impermeabile",
          })
        );
      }
    } else if (mentionsEco) {
      const ecoKey = findProduct("portachiavi-nfc-bambu-ntag213", "portachiavi-nfc-ocean");
      if (ecoKey) {
        selectedItems.push(
          buildCartItemFromProduct(ecoKey, {
            quantity: qty,
            printPrices: printConfig.prices,
            programming,
            reason: "Portachiavi ecologico con chip NTAG213 universale, ideale per strutture ricettive e brand green.",
            badge: "Sostenibile",
          })
        );
      }
    } else if (/\b(?:acciaio|lusso|locket|elegant[ei])\b/.test(text)) {
      const locket = findProduct("portachiavi-nfc-locket", "portachiavi-nfc-premium");
      if (locket) {
        selectedItems.push(
          buildCartItemFromProduct(locket, {
            quantity: qty,
            printPrices: printConfig.prices,
            programming,
            reason: "Cornice in acciaio inox lucidato e chip NTAG216 ad alta capacità.",
            badge: "Acciaio Inox",
          })
        );
      }
    } else {
      const keyfob = findProduct("portachiavi-nfc-premium", "portachiavi-nfc-goccia-ip68", "portachiavi-nfc-ntag213");
      if (keyfob) {
        selectedItems.push(
          buildCartItemFromProduct(keyfob, {
            quantity: qty,
            printPrices: printConfig.prices,
            programming,
            reason: "Impermeabile IP66 con finitura in resina epossidica e chip NTAG213 (ordine minimo soli 5 pezzi).",
            badge: "Top Qualità",
          })
        );
      }
    }

    const altDrop = findProduct("portachiavi-nfc-goccia-ip68");
    if (altDrop && !selectedItems.some((i) => i.slug === altDrop.slug)) {
      alternativeItems.push(
        buildCartItemFromProduct(altDrop, {
          quantity: qty,
          printPrices: printConfig.prices,
          programming,
          reason: "Versione ultrasottile a goccia IP68 (spessore 2,2 mm).",
        })
      );
    }

    summaryText = `Ho selezionato ${qty} portachiavi NFC robusti e impermeabili, già pronti da mettere nel carrello per l'acquisto diretto.`;
  }

  // 7. Reviews / Menu / Restaurant / Retail / Smart Tap
  if (selectedItems.length === 0 && mentionsReviewsOrMenu) {
    useCaseLabel = "Menu digitali, Recensioni Google & Tap al tavolo/cassa";
    const qty = mainQuantity ?? 20;

    if (mentionsCard) {
      const card = findProduct("tessere-nfc-pvc-ntag213");
      if (card) {
        selectedItems.push(
          buildCartItemFromProduct(card, {
            quantity: qty,
            printOption: printOption === "none" ? "color1" : printOption,
            printPrices: printConfig.prices,
            programming:
              programming.mode === "programmed"
                ? programming
                : {
                    mode: "programmed",
                    note: "Programmazione NFC: Apertura link recensioni / menu digitale",
                    keySuffix: ":nfc:menu-review",
                  },
            reason: "Tessere rigide in PVC con NTAG213 da appoggiare sui tavoli o consegnare in cassa per recensioni/menu.",
            badge: "Pronte al tavolo",
          })
        );
      }
    } else {
      const logoSticker = findProduct("tag-nfc-ntag213-logo", "tag-nfc-ntag213-38mm");
      if (logoSticker) {
        selectedItems.push(
          buildCartItemFromProduct(logoSticker, {
            quantity: qty,
            printPrices: printConfig.prices,
            programming:
              programming.mode === "programmed"
                ? programming
                : {
                    mode: "programmed",
                    note: "Programmazione NFC: Apertura link recensioni / menu digitale",
                    keySuffix: ":nfc:menu-review",
                  },
            reason: "Sticker adesivo con simbolo NFC già stampato: i clienti capiscono subito dove avvicinare lo smartphone per aprire il menu o lasciare la recensione.",
            badge: "Con Logo NFC",
          })
        );
      }

      const cardAlt = findProduct("tessere-nfc-pvc-ntag213");
      if (cardAlt) {
        alternativeItems.push(
          buildCartItemFromProduct(cardAlt, {
            quantity: Math.max(10, Math.min(qty, 20)),
            printOption: "color1",
            printPrices: printConfig.prices,
            programming,
            reason: "Preferisci una card rigida personalizzata col tuo logo invece dell'adesivo?",
          })
        );
      }
    }

    summaryText = `Per far aprire subito menu o recensioni ai clienti ho preparato ${qty} tag NTAG213 con programmazione del link inclusa nel prezzo.`;
  }

  // 8. Readers only
  if (selectedItems.length === 0 && mentionsReader) {
    useCaseLabel = "Lettori e Scrittori NFC USB per PC";
    const qty = mainQuantity ?? readerQuantity;
    const isUidOnly = /\b(?:uid|emulazione\s*tastiera|gestionale|solo\s*lettura)\b/.test(text);
    const isPro = /\b(?:desfire|3700|multi-?iso|icode|professionale)\b/.test(text);

    const reader = isPro
      ? findProduct("lettore-nfc-utrust-3700f", "lettore-nfc-usb-acr122u")
      : isUidOnly
        ? findProduct("lettore-uid-justid-usb", "lettore-nfc-usb-acr122u")
        : findProduct("lettore-nfc-usb-acr122u", "lettore-nfc-utrust-3700f");

    if (reader) {
      selectedItems.push(
        buildCartItemFromProduct(reader, {
          quantity: Math.max(1, Math.min(qty, 50)),
          printPrices: printConfig.prices,
          programming: { mode: "virgin", note: null, keySuffix: "" },
          reason: "Lettore/scrittore USB compatibile con Windows, Mac e Linux per codificare e leggere tag NFC.",
          badge: "Pronta consegna",
        })
      );
    }

    const sampleCards = findProduct("kit-card-nfc", "tessere-nfc-pvc-ntag213");
    if (sampleCards) {
      alternativeItems.push(
        buildCartItemFromProduct(sampleCards, {
          quantity: sampleCards.minQuantity,
          printPrices: printConfig.prices,
          programming: { mode: "virgin", note: null, keySuffix: "" },
          reason: "Aggiungi un set di card NFC vergini per iniziare subito a testare e programmare col lettore.",
        })
      );
    }

    summaryText = "Ho aggiunto il lettore NFC USB più adatto alla tua postazione. Ordine minimo 1 pezzo, spedizione rapida.";
  }

  // 9. Stickers / Packaging / Marketing
  if (selectedItems.length === 0 && mentionsSticker) {
    useCaseLabel = "Sticker & Etichette NFC adesive";
    const qty = mainQuantity ?? 100;
    const wantsMoreMemory = /\b(?:888|216|vcard|tanti\s*dati|testo\s*lungo)\b/.test(text);
    const wantsCheapUrl = qty >= 200 && /\b(?:economic[oahe]|risparmi|solo\s*un\s*link|210)\b/.test(text);
    const wantsLargeRange = /\b(?:38\s*mm|grande|distanza|portata\s*maggior)\b/.test(text);
    const wantsWhite = /\b(?:bianc[oahe]|stampabil[ei])\b/.test(text);

    const sticker = wantsMoreMemory
      ? findProduct("tag-nfc-ntag216-25mm")
      : wantsCheapUrl
        ? findProduct("tag-nfc-ntag210u-22mm", "tag-nfc-ntag213-22mm-bianchi")
        : wantsLargeRange
          ? findProduct("tag-nfc-ntag213-38mm")
          : wantsWhite
            ? findProduct("tag-nfc-ntag213-22mm-bianchi")
            : findProduct("tag-nfc-ntag213-22mm", "tag-nfc-ntag213-22mm-bianchi");

    if (sticker) {
      selectedItems.push(
        buildCartItemFromProduct(sticker, {
          quantity: qty,
          printPrices: printConfig.prices,
          programming,
          reason: "Compatibilità 100% con tutti gli iPhone e Android, adesivo resistente e programmazione inclusa.",
          badge: "Universale iOS/Android",
        })
      );
    }

    const altLogo = findProduct("tag-nfc-ntag213-logo");
    if (altLogo && !selectedItems.some((i) => i.slug === altLogo.slug)) {
      alternativeItems.push(
        buildCartItemFromProduct(altLogo, {
          quantity: qty,
          printPrices: printConfig.prices,
          programming,
          reason: "Versione con icona NFC stampata in superficie per guidare l'utente al tap.",
        })
      );
    }

    summaryText = `Ho configurato ${qty} sticker NFC adesivi compatibili con qualsiasi smartphone. Puoi procedere subito all'ordine diretto!`;
  }

  // 10. Anti-cloning / Product authentication
  if (selectedItems.length === 0 && mentionsAntiClone) {
    useCaseLabel = "Autenticazione prodotto & Anti-contraffazione (NTAG424 DNA)";
    const qty = mainQuantity ?? 50;
    const dna = findProduct("tessere-nfc-ntag424-dna", "tessere-nfc-pvc-desfire-ev3");
    if (dna) {
      selectedItems.push(
        buildCartItemFromProduct(dna, {
          quantity: qty,
          printOption,
          printPrices: printConfig.prices,
          programming,
          reason: "Chip NXP NTAG424 DNA con crittografia AES-128 e messaggio dinamico SUN ad ogni tap per impedire la clonazione.",
          badge: "Anti-clonazione AES",
        })
      );
    }
    summaryText = `Ho selezionato ${qty} tessere con chip di sicurezza NTAG424 DNA anti-contraffazione, subito acquistabili online.`;
  }

  // 11. Default / Cards / General fallback
  if (selectedItems.length === 0) {
    useCaseLabel = "Tessere e Tag NFC personalizzabili";
    const qty = mainQuantity ?? 50;
    const card = mentionsEco
      ? findProduct("tessere-nfc-pvc-bio", "tessere-nfc-bambu-ntag213")
      : findProduct("tessere-nfc-pvc-ntag213");

    if (card) {
      selectedItems.push(
        buildCartItemFromProduct(card, {
          quantity: qty,
          printOption,
          printPrices: printConfig.prices,
          programming,
          reason: "La nostra tessera NFC in PVC formato carta di credito più versatile (chip NXP NTAG213), compatibile con tutti i telefoni e stampabile col tuo logo.",
          badge: "Scelta Consigliata",
        })
      );
    }

    const stickerAlt = findProduct("tag-nfc-ntag213-22mm");
    const kitAlt = findProduct("kit-card-nfc");
    if (stickerAlt) {
      alternativeItems.push(
        buildCartItemFromProduct(stickerAlt, {
          quantity: qty,
          printPrices: printConfig.prices,
          programming,
          reason: "Preferisci il formato adesivo rotondo da applicare su oggetti o superfici?",
        })
      );
    }
    if (kitAlt) {
      alternativeItems.push(
        buildCartItemFromProduct(kitAlt, {
          quantity: 1,
          printPrices: printConfig.prices,
          programming: { mode: "virgin", note: null, keySuffix: "" },
          reason: "Vuoi prima fare un test? Il Kit da 10 card miste è acquistabile anche in singolo pezzo.",
        })
      );
    }

    summaryText = `Ho preparato il tuo carrello con ${qty} Tessere NFC NTAG213 (programmazione inclusa). Puoi acquistarle subito al prezzo finale qui sotto, senza aspettare un preventivo!`;
  }

  // If user also mentioned needing a reader alongside tags/cards/wristbands, add it
  if (
    mentionsReader &&
    !selectedItems.some((i) => i.categorySlug === "lettori-nfc")
  ) {
    const reader = findProduct("lettore-nfc-usb-acr122u", "lettore-uid-justid-usb");
    if (reader) {
      selectedItems.push(
        buildCartItemFromProduct(reader, {
          quantity: readerQuantity,
          printPrices: printConfig.prices,
          programming: { mode: "virgin", note: null, keySuffix: "" },
          reason: "Lettore/scrittore USB richiesto per gestire e codificare i tag direttamente dal tuo PC.",
          badge: "Lettore USB",
        })
      );
    }
  }

  return {
    summary: summaryText,
    items: selectedItems,
    alternatives: alternativeItems.slice(0, 2),
    detectedIntent: {
      useCase: useCaseLabel,
      quantity: selectedItems[0]?.quantity ?? (mainQuantity || 50),
      printOption,
      programmingNote: programming.note,
    },
    source: "smart-engine",
  };
}

async function tryOpenAiRecommendation(
  prompt: string,
  catalog: ProductWithCategory[],
  printPrices: { black: number; color1: number; color2: number },
  apiKey: string
): Promise<AiShoppingAssistantResponse | null> {
  const catalogDigest = catalog.map((p) => ({
    slug: p.slug,
    name: p.name_it || p.name,
    categorySlug: p.categorySlug,
    price: p.price,
    minQuantity: p.minQuantity,
    short: p.descriptionShort_it || p.descriptionShort,
  }));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Sei l'assistente agli acquisti di Shop NFC Bitora. L'obiettivo è convertire subito il cliente pre-compilando il carrello con i prodotti esatti del catalogo (evitando che invii una richiesta di preventivo).
Catalogo disponibile: ${JSON.stringify(catalogDigest)}
Opzioni stampa (solo per categorySlug === "tessere-nfc"): "none" (+0€), "black" (+${printPrices.black}€), "color1" (+${printPrices.color1}€), "color2" (+${printPrices.color2}€).
Rispondi SOLO in JSON con questo schema:
{
  "useCase": "string breve",
  "summary": "string amichevole in italiano che spiega perché questa configurazione è pronta per l'acquisto immediato",
  "items": [{ "slug": "string", "quantity": number, "printOption": "none"|"black"|"color1"|"color2", "programmingNote": "string|null", "reason": "string", "badge": "string" }],
  "alternatives": [{ "slug": "string", "quantity": number, "printOption": "none"|"black"|"color1"|"color2", "reason": "string" }]
}`,
          },
          { role: "user", content: prompt },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) return null;
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content);
    const bySlug = new Map(catalog.map((p) => [p.slug, p]));
    const fallbackProg = detectProgrammingNote(prompt);

    const items: AiCartRecommendation[] = [];
    for (const raw of parsed.items || []) {
      const prod = bySlug.get(raw.slug);
      if (!prod) continue;
      const progNote = raw.programmingNote || fallbackProg.note;
      items.push(
        buildCartItemFromProduct(prod, {
          quantity: Number(raw.quantity) || prod.minQuantity,
          printOption: parsePrintOption(raw.printOption),
          printPrices,
          programming: {
            mode: progNote ? "programmed" : "virgin",
            note: progNote ? `Programmazione NFC: ${progNote}` : null,
            keySuffix: progNote ? `:nfc:${String(progNote).slice(0, 20)}` : "",
          },
          reason: raw.reason || prod.descriptionShort,
          badge: raw.badge || "Consigliato AI",
        })
      );
    }

    if (items.length === 0) return null;

    const alternatives: AiCartRecommendation[] = [];
    for (const raw of parsed.alternatives || []) {
      const prod = bySlug.get(raw.slug);
      if (!prod || items.some((i) => i.slug === prod.slug)) continue;
      alternatives.push(
        buildCartItemFromProduct(prod, {
          quantity: Number(raw.quantity) || prod.minQuantity,
          printOption: parsePrintOption(raw.printOption),
          printPrices,
          programming: fallbackProg,
          reason: raw.reason || prod.descriptionShort,
        })
      );
    }

    return {
      summary: parsed.summary || "Ecco il carrello pronto per il tuo progetto NFC.",
      items,
      alternatives: alternatives.slice(0, 2),
      detectedIntent: {
        useCase: parsed.useCase || "Configurazione AI su misura",
        quantity: items[0].quantity,
        printOption: items[0].printOption,
        programmingNote: items[0].lineNotes ?? null,
      },
      source: "llm",
    };
  } finally {
    clearTimeout(timeout);
  }
}
