export interface CategorySeoContent {
  metaDescription: string;
  intro: string;
  guideTitle: string;
  guide: string;
  applicationsTitle: string;
  applications: string[];
  faq: { question: string; answer: string }[];
  relatedSlugs: string[];
}

export const CATEGORY_SEO: Record<string, CategorySeoContent> = {
  "sticker-nfc": {
    metaDescription:
      "Sticker NFC adesivi per aziende: NTAG213 e NTAG216, programmazione inclusa. Ideali per marketing, check-in eventi e identificazione prodotti.",
    intro:
      "Gli sticker NFC sono la soluzione più versatile per portare l'interazione contactless su packaging, volantini, espositori e materiali promozionali. Su Shop NFC trovi tag adesivi in diversi formati, con chip NXP NTAG pronti per la programmazione URL, vCard o payload personalizzati.",
    guideTitle: "Come scegliere lo sticker NFC giusto",
    guide:
      "Per campagne marketing e link rapidi scegli NTAG213 (144 byte, ottimo rapporto costo/prestazioni). Per contenuti più ricchi o più riscritture usa NTAG216 (888 byte). Valuta il diametro in base alla distanza di lettura richiesta: 22–25 mm per uso ravvicinato, 38 mm per maggiore area di accoppiamento. Tutti i tag sono compatibili con smartphone Android e iPhone aggiornati.",
    applicationsTitle: "Applicazioni aziendali",
    applications: [
      "Marketing e lead generation con landing page dedicate",
      "Check-in eventi, fiere e attivazioni brand",
      "Collegamenti rapidi a schede prodotto o manuali digitali",
      "Tracciabilità su packaging e materiali POS",
    ],
    faq: [
      {
        question: "Gli sticker NFC sono riprogrammabili?",
        answer:
          "Sì, i chip NTAG213 e NTAG216 supportano la riscrittura del contenuto. Su richiesta possiamo fornire tag vergini o già programmati con i tuoi URL.",
      },
      {
        question: "Posso ordinare sticker NFC personalizzati con logo?",
        answer:
          "Sì, offriamo stampa personalizzata e programmazione in lotti per aziende. Contattaci per un preventivo su quantità e tempi.",
      },
    ],
    relatedSlugs: ["tessere-nfc", "tag-schermati", "tag-nfc-personalizzati"],
  },
  "tessere-nfc": {
    metaDescription:
      "Tessere NFC personalizzate in PVC, bambù e materiali premium. Card NTAG213, MIFARE e DESFire per accessi, badge aziendali e loyalty.",
    intro:
      "Le tessere NFC sono il formato classico per badge dipendenti, controllo accessi, programmi fedeltà e biglietti da visita digitali. Il catalogo include card in PVC standard, versioni eco in bambù e modelli con chip MIFARE Classic o DESFire per progetti di sicurezza più avanzati.",
    guideTitle: "Quale tessera NFC scegliere",
    guide:
      "Per biglietti da visita e marketing usa NTAG213 o NTAG216 in PVC. Per sistemi di accesso esistenti verifica se richiedono MIFARE Classic 1k o DESFire EV3. Le tessere possono essere fornite vergini, parzialmente personalizzate o complete di stampa fronte/retro.",
    applicationsTitle: "Applicazioni aziendali",
    applications: [
      "Badge dipendenti e visitatori",
      "Controllo accessi uffici e stabilimenti",
      "Programmi loyalty e membership",
      "Biglietti da visita digitali con vCard",
    ],
    faq: [
      {
        question: "Fornite tessere NFC già stampate?",
        answer:
          "Sì, su richiesta realizziamo stampa personalizzata e programmazione in batch. Invia il logo e le specifiche per un preventivo.",
      },
      {
        question: "Le tessere MIFARE sono compatibili con i miei lettori?",
        answer:
          "MIFARE Classic e DESFire sono standard diffusi nei sistemi di accesso. Verifica con il tuo integratore il tipo di chip richiesto prima dell'ordine.",
      },
    ],
    relatedSlugs: ["sticker-nfc", "lettori-nfc", "tag-nfc-personalizzati"],
  },
  "braccialetti-nfc": {
    metaDescription:
      "Braccialetti NFC in silicone, tessile e velcro per eventi, ospedalità e controllo accessi temporaneo. NTAG213 programmabili.",
    intro:
      "I braccialetti NFC sono pensati per eventi, festival, strutture ricettive e contesti in cui serve un identificativo indossabile e riutilizzabile o monouso. Disponibili in silicone, tessile con velcro e versioni slim monouso.",
    guideTitle: "Come scegliere il braccialetto NFC",
    guide:
      "Il silicone è resistente e adatto a eventi multi-giorno. I modelli tessili con velcro offrono regolazione universale. I braccialetti slim monouso sono economici per grandi volumi. Tutti i modelli del catalogo usano chip NTAG compatibili con smartphone.",
    applicationsTitle: "Applicazioni aziendali",
    applications: [
      "Eventi, concerti e fiere",
      "Resort, piscine e centri benessere",
      "Controllo accessi temporaneo",
      "Attivazioni brand e gamification",
    ],
    faq: [
      {
        question: "I braccialetti sono impermeabili?",
        answer:
          "I modelli in silicone e tessile tecnico resistono a spruzzi e uso quotidiano. Per ambienti particolarmente aggressivi valuta i tag industriali IP68.",
      },
      {
        question: "Posso ordinare braccialetti con stampa personalizzata?",
        answer:
          "Sì, su lotti aziendali offriamo stampa logo e programmazione NFC. Contattaci per quantità minime e tempi di consegna.",
      },
    ],
    relatedSlugs: ["sticker-nfc", "tessere-nfc", "gadget-nfc"],
  },
  "tag-industriali": {
    metaDescription:
      "Tag NFC industriali IP66 e IP68 per asset tracking, manutenzione e identificazione su macchinari. NTAG213 e NTAG216.",
    intro:
      "I tag industriali sono progettati per ambienti difficili: officine, cantieri, impianti e linee produttive. Custodie robuste in ABS o resina epossidica con protezione IP66/IP68, ideali per fissaggio con viti o colla.",
    guideTitle: "Quando usare un tag industriale",
    guide:
      "Scegli il formato forato in ABS per fissaggio meccanico su macchinari e attrezzature. I tag epossidici IP68 sono indicati per esterno, umidità e lavaggi frequenti. Per metallo usa i tag schermati della categoria dedicata.",
    applicationsTitle: "Applicazioni aziendali",
    applications: [
      "Identificazione macchinari e attrezzature",
      "Schede manutenzione digitali (MTBF, storico interventi)",
      "Tracciabilità componenti in produzione",
      "Collegamenti a documentazione tecnica on-site",
    ],
    faq: [
      {
        question: "I tag industriali funzionano all'esterno?",
        answer:
          "I modelli IP68 resistono a polvere, acqua e temperature operative tipiche di ambienti industriali. Verifica le specifiche di ogni prodotto nel catalogo.",
      },
      {
        question: "Posso fissare i tag su superfici metalliche?",
        answer:
          "Su metallo serve un tag schermato (on-metal). Consulta la categoria Tag schermati per le soluzioni compatibili.",
      },
    ],
    relatedSlugs: ["tag-schermati", "sticker-nfc", "soluzioni-nfc"],
  },
  "tag-schermati": {
    metaDescription:
      "Tag NFC schermati (on-metal) per applicazioni su superfici metalliche. NTAG213 in formato adesivo e industriale IP68.",
    intro:
      "I tag schermati — noti anche come on-metal — integrano un layer ferritico che permette la lettura NFC anche quando il tag è applicato direttamente su metallo, armadi rack, macchinari e strutture in acciaio.",
    guideTitle: "Perché serve un tag schermato",
    guide:
      "Un tag NFC standard applicato su metallo perde gran parte della sua leggibilità. I tag schermati mantengono un campo utilizzabile grazie al materiale assorbente montato sul retro. Scegli il diametro in base allo spazio disponibile e alla distanza di lettura.",
    applicationsTitle: "Applicazioni aziendali",
    applications: [
      "Identificazione su macchinari e stampi",
      "Etichettatura armadi e quadri elettrici",
      "Manutenzione predittiva con link a schede tecniche",
      "Asset tracking in magazzino industriale",
    ],
    faq: [
      {
        question: "Qual è la differenza tra tag standard e schermato?",
        answer:
          "Il tag schermato ha un layer ferritico che isola il chip dal metallo sottostante, permettendo la lettura NFC. Un tag standard su metallo spesso non è leggibile.",
      },
      {
        question: "Funzionano anche su plastica o legno?",
        answer:
          "Sì, i tag schermati funzionano su qualsiasi superficie, ma il loro vantaggio si manifesta principalmente su metallo.",
      },
    ],
    relatedSlugs: ["tag-industriali", "sticker-nfc", "ntag213"],
  },
  "gadget-nfc": {
    metaDescription:
      "Gadget NFC: portachiavi, spillette e accessori promozionali con chip NTAG213. Ideali per merchandising aziendale e regali corporate.",
    intro:
      "I gadget NFC trasformano oggetti quotidiani in touchpoint digitali: un tap apre il tuo sito, scarica un'app o mostra una promozione. Portachiavi e spillette con NTAG213 sono la scelta più immediata per campagne promozionali e welcome kit.",
    guideTitle: "Come usare i gadget NFC in azienda",
    guide:
      "I portachiavi sono ideali per clienti e partner. Le spillette funzionano bene in eventi e fiere. Entrambi supportano programmazione URL e vCard. Per volumi elevati chiedi stampa logo e confezionamento personalizzato.",
    applicationsTitle: "Applicazioni aziendali",
    applications: [
      "Merchandising e welcome kit",
      "Materiale promozionale per fiere",
      "Collegamenti a cataloghi e listini digitali",
      "Programmi referral e coupon digitali",
    ],
    faq: [
      {
        question: "Posso personalizzare portachiavi e spillette?",
        answer:
          "Sì, offriamo stampa logo e programmazione su lotti. Contattaci con il design e la quantità desiderata.",
      },
      {
        question: "Quale chip usano i gadget?",
        answer:
          "I gadget del catalogo montano prevalentemente NXP NTAG213, compatibile con tutti gli smartphone NFC moderni.",
      },
    ],
    relatedSlugs: ["sticker-nfc", "tessere-nfc", "tag-nfc-personalizzati"],
  },
  "lettori-nfc": {
    metaDescription:
      "Lettori e scrittori NFC USB per ufficio e sviluppo: ACR122U, uTrust 3700F e lettori UID. Compatibili con NTAG, MIFARE e DESFire.",
    intro:
      "I lettori NFC sono indispensabili per testare tag, programmare lotti e integrare NFC nei processi aziendali. Il catalogo include lettori USB desktop certificati, adatti a sviluppo software, uffici e laboratori di prototipazione.",
    guideTitle: "Quale lettore NFC scegliere",
    guide:
      "L'ACR122U è lo standard de facto per sviluppo e uso generico con NTAG e MIFARE. L'uTrust 3700F offre compatibilità estesa con DESFire e ISO 15693. Per la sola lettura UID esistono modelli economici dedicati.",
    applicationsTitle: "Applicazioni aziendali",
    applications: [
      "Sviluppo e test di applicazioni NFC",
      "Programmazione tag in laboratorio",
      "Desk di accoglienza e registrazione visitatori",
      "Integrazione con software gestionale",
    ],
    faq: [
      {
        question: "I lettori funzionano su Mac e Linux?",
        answer:
          "L'ACR122U e l'uTrust 3700F sono compatibili con Windows, macOS e Linux tramite driver e librerie standard del settore.",
      },
      {
        question: "Posso scrivere tag NTAG con questi lettori?",
        answer:
          "Sì, con software appropriato (es. libnfc, TagXplorer o soluzioni custom) puoi leggere e scrivere tag NTAG e MIFARE.",
      },
    ],
    relatedSlugs: ["soluzioni-nfc", "tessere-nfc", "sticker-nfc"],
  },
  "soluzioni-nfc": {
    metaDescription:
      "Soluzioni NFC chiavi in mano: programmazione professionale, kit controllo accessi e consulenza per progetti aziendali.",
    intro:
      "La categoria Soluzioni NFC raccoglie servizi e kit per chi vuole delegare la parte tecnica: programmazione tag, configurazione sistemi di accesso e supporto alla scelta del chip giusto per il proprio progetto.",
    guideTitle: "Quando scegliere una soluzione chiavi in mano",
    guide:
      "Se devi programmare centinaia o migliaia di tag con dati diversi, il servizio di programmazione professionale ti fa risparmiare tempo e errori. I kit controllo accessi includono tessere e componenti per prototipi rapidi.",
    applicationsTitle: "Applicazioni aziendali",
    applications: [
      "Programmazione batch di tag per campagne",
      "Prototipi controllo accessi",
      "Consulenza scelta chip e formato",
      "Integrazione NFC in processi esistenti",
    ],
    faq: [
      {
        question: "Offrite programmazione NFC su misura?",
        answer:
          "Sì, programmiamo tag con URL, vCard, testo o payload personalizzati. Invia le specifiche per un preventivo.",
      },
      {
        question: "Posso combinare tag e servizio di programmazione?",
        answer:
          "Certamente: puoi acquistare i tag dal catalogo e aggiungere il servizio di programmazione, oppure ordinare tutto in un'unica fornitura.",
      },
    ],
    relatedSlugs: ["lettori-nfc", "tag-nfc-personalizzati", "tessere-nfc"],
  },
};

export interface ChipSeoContent {
  title: string;
  metaDescription: string;
  intro: string;
  specs: { label: string; value: string }[];
  useCases: string[];
  compatibleCategories: string[];
}

export const CHIP_SEO: Record<string, ChipSeoContent> = {
  ntag213: {
    title: "NXP NTAG213",
    metaDescription:
      "Prodotti con chip NXP NTAG213: 144 byte, NFC Forum Type 2. Sticker, tessere e gadget per marketing e identificazione aziendale.",
    intro:
      "Il NTAG213 è il chip NFC più diffuso per applicazioni marketing e identificazione. Con 144 byte di memoria utile, supporto NFC Forum Type 2 e ampia compatibilità con smartphone, è la scelta ideale per URL, vCard compatte e applicazioni IoT leggere.",
    specs: [
      { label: "Standard", value: "NFC Forum Type 2, ISO 14443-A" },
      { label: "Memoria utente", value: "144 byte" },
      { label: "Riscritture", value: "Circa 10.000 cicli" },
      { label: "Sicurezza", value: "Password protection opzionale" },
    ],
    useCases: ["Marketing e lead generation", "Biglietti da visita digitali", "Etichettatura prodotti", "Eventi e fiere"],
    compatibleCategories: ["sticker-nfc", "tessere-nfc", "gadget-nfc", "braccialetti-nfc"],
  },
  ntag216: {
    title: "NXP NTAG216",
    metaDescription:
      "Tag e tessere con NXP NTAG216: 888 byte di memoria per contenuti ricchi, campagne marketing e applicazioni NFC avanzate.",
    intro:
      "Il NTAG216 offre 888 byte di memoria utente, sei volte superiore al NTAG213. È la scelta giusta quando serve contenere più dati, testo esteso o payload strutturati mantenendo la compatibilità NFC Forum Type 2.",
    specs: [
      { label: "Standard", value: "NFC Forum Type 2, ISO 14443-A" },
      { label: "Memoria utente", value: "888 byte" },
      { label: "Riscritture", value: "Circa 10.000 cicli" },
      { label: "Compatibilità", value: "Android e iPhone (NFC)" },
    ],
    useCases: ["Campagne con contenuti estesi", "Multi-record NDEF", "Programmi fedeltà", "Documentazione on-tag"],
    compatibleCategories: ["sticker-nfc", "tessere-nfc", "tag-industriali"],
  },
  "ntag210u": {
    title: "NXP NTAG210μ",
    metaDescription:
      "Tag NFC con NXP NTAG210μ: chip economico da 48 byte per applicazioni semplici e braccialetti monouso.",
    intro:
      "Il NTAG210μ è un chip entry-level con 48 byte di memoria, pensato per applicazioni dove basta un URL corto o un identificativo semplice. Ideale per braccialetti monouso e tag promozionali ad alto volume.",
    specs: [
      { label: "Standard", value: "NFC Forum Type 2, ISO 14443-A" },
      { label: "Memoria utente", value: "48 byte" },
      { label: "Costo", value: "Entry-level" },
      { label: "Uso tipico", value: "URL corti, ID semplici" },
    ],
    useCases: ["Braccialetti monouso eventi", "Tag promozionali economici", "Identificazione semplice"],
    compatibleCategories: ["sticker-nfc", "braccialetti-nfc"],
  },
  "ntag424-dna": {
    title: "NTAG424 DNA",
    metaDescription:
      "Tessere e tag con NTAG424 DNA: autenticazione AES, SUN message e sicurezza avanzata per anti-contraffazione.",
    intro:
      "Il NTAG424 DNA è un chip di nuova generazione con crittografia AES-128 e funzionalità Secure Unique NFC (SUN) per autenticazione e anti-contraffazione. Indicato per prodotti di lusso, documenti e applicazioni che richiedono verifica di autenticità.",
    specs: [
      { label: "Standard", value: "NFC Forum Type 4, ISO 14443-A" },
      { label: "Memoria utente", value: "416 byte" },
      { label: "Sicurezza", value: "AES-128, SUN message" },
      { label: "Uso tipico", value: "Anti-contraffazione" },
    ],
    useCases: ["Autenticazione prodotti", "Documenti sicuri", "Supply chain", "Brand protection"],
    compatibleCategories: ["tessere-nfc", "soluzioni-nfc"],
  },
  "mifare-classic-1k": {
    title: "MIFARE Classic 1k",
    metaDescription:
      "Tessere MIFARE Classic 1k per controllo accessi e sistemi legacy. Compatibili con la maggior parte dei lettori MIFARE.",
    intro:
      "Il MIFARE Classic 1k è lo standard storico per badge e controllo accessi. Con 1 kB di memoria e settori protetti da chiave, è ancora ampiamente usato in sistemi esistenti. Verifica la compatibilità con il tuo lettore prima dell'acquisto.",
    specs: [
      { label: "Standard", value: "ISO 14443-A, MIFARE" },
      { label: "Memoria", value: "1 kB (16 settori)" },
      { label: "Frequenza", value: "13,56 MHz" },
      { label: "Uso tipico", value: "Controllo accessi" },
    ],
    useCases: ["Badge dipendenti", "Controllo accessi uffici", "Tornelli e cancelli", "Parcheggi"],
    compatibleCategories: ["tessere-nfc", "lettori-nfc", "soluzioni-nfc"],
  },
  "mifare-desfire-ev3": {
    title: "MIFARE DESFire EV3",
    metaDescription:
      "Tessere MIFARE DESFire EV3 con crittografia AES e certificazione EAL5+ per accessi sicuri e pagamenti contactless.",
    intro:
      "Il DESFire EV3 rappresenta lo stato dell'arte per tessere smart card: crittografia AES, autenticazione mutua e certificazione EAL5+. Usato in trasporto pubblico, campus universitari e sistemi di accesso ad alta sicurezza.",
    specs: [
      { label: "Standard", value: "ISO 14443-A, MIFARE DESFire" },
      { label: "Memoria", value: "2–8 kB (varianti)" },
      { label: "Sicurezza", value: "AES, EAL5+" },
      { label: "Uso tipico", value: "Accessi sicuri, ticketing" },
    ],
    useCases: ["Controllo accessi enterprise", "Ticketing trasporto", "Pagamenti contactless", "Campus e hospitality"],
    compatibleCategories: ["tessere-nfc", "lettori-nfc"],
  },
  "mifare-ultralight-ev1": {
    title: "MIFARE Ultralight EV1",
    metaDescription:
      "Tag MIFARE Ultralight EV1: chip leggero per biglietti, wristband e applicazioni monouso ad alto volume.",
    intro:
      "Il MIFARE Ultralight EV1 è un chip economico con 48–128 byte di memoria, pensato per biglietti di transito, braccialetti monouso e applicazioni dove il costo unitario è critico.",
    specs: [
      { label: "Standard", value: "ISO 14443-A, MIFARE Ultralight" },
      { label: "Memoria", value: "48–128 byte" },
      { label: "Costo", value: "Economico" },
      { label: "Uso tipico", value: "Biglietti, monouso" },
    ],
    useCases: ["Biglietti eventi", "Braccialetti monouso", "Controllo accessi temporaneo"],
    compatibleCategories: ["lettori-nfc"],
  },
  "icode-slix2": {
    title: "ICODE SLIX2",
    metaDescription:
      "Tag ICODE SLIX2 ISO 15693 per inventario, librerie e gestione asset con lettura a distanza superiore.",
    intro:
      "L'ICODE SLIX2 opera su ISO 15693 (HF a 13,56 MHz) con anti-collisione avanzata e ottima distanza di lettura. È lo standard per gestione biblioteche, inventario retail e asset tracking con lettori dedicati.",
    specs: [
      { label: "Standard", value: "ISO 15693" },
      { label: "Memoria", value: "2522 bit" },
      { label: "Distanza lettura", value: "Superiore ai Type 2" },
      { label: "Uso tipico", value: "Inventario, librerie" },
    ],
    useCases: ["Gestione biblioteche", "Inventario retail", "Asset tracking", "Logistica"],
    compatibleCategories: ["lettori-nfc"],
  },
  "fudan-1k": {
    title: "Fudan 1k F08",
    metaDescription:
      "Tessere Fudan 1k F08 compatibili MIFARE Classic per controllo accessi economico e sostituzione badge.",
    intro:
      "Il Fudan F08 è un chip compatibile MIFARE Classic 1k, spesso usato come alternativa economica nei sistemi di accesso. Verifica con il tuo integratore la piena compatibilità con i lettori installati.",
    specs: [
      { label: "Standard", value: "ISO 14443-A, MIFARE compatible" },
      { label: "Memoria", value: "1 kB" },
      { label: "Compatibilità", value: "MIFARE Classic 1k" },
      { label: "Uso tipico", value: "Accessi economici" },
    ],
    useCases: ["Badge economici", "Sostituzione tessere", "Prototipi accesso"],
    compatibleCategories: ["tessere-nfc"],
  },
  "mifare-plus": {
    title: "MIFARE Plus",
    metaDescription:
      "Tessere MIFARE Plus con migrazione sicura da Classic e crittografia AES per nuovi sistemi di accesso.",
    intro:
      "Il MIFARE Plus è progettato come evoluzione del Classic, con livelli di sicurezza configurabili e migrazione graduale verso AES-128. Adatto a chi aggiorna infrastrutture esistenti verso standard più sicuri.",
    specs: [
      { label: "Standard", value: "ISO 14443-A, MIFARE Plus" },
      { label: "Memoria", value: "2–4 kB" },
      { label: "Sicurezza", value: "AES-128 (SL3)" },
      { label: "Uso tipico", value: "Migrazione da Classic" },
    ],
    useCases: ["Aggiornamento sistemi accesso", "Campus sicuri", "Trasporto pubblico"],
    compatibleCategories: ["tessere-nfc"],
  },
};

export const TAG_NFC_LANDING = {
  title: "Tag NFC per aziende",
  metaDescription:
    "Tag NFC per aziende: sticker, tessere, braccialetti, tag industriali e schermati. Programmazione inclusa, spedizione in Italia.",
  intro:
    "Shop NFC è il catalogo B2B di Bitora per tag NFC professionali: adesivi, tessere, braccialetti, tag industriali e soluzioni on-metal. Ogni prodotto è selezionato per affidabilità e compatibilità con smartphone e lettori standard.",
  sections: [
    {
      title: "Sticker e tag adesivi NFC",
      body: "Il formato più versatile per marketing, packaging ed eventi. Chip NTAG213 e NTAG216, programmabili con URL, vCard e payload personalizzati.",
      href: "/categories/sticker-nfc",
      label: "Vedi sticker NFC",
    },
    {
      title: "Tessere e card NFC",
      body: "Badge aziendali, controllo accessi, loyalty e biglietti da visita digitali. PVC, bambù e chip MIFARE per ogni esigenza.",
      href: "/categories/tessere-nfc",
      label: "Vedi tessere NFC",
    },
    {
      title: "Tag industriali e schermati",
      body: "Per ambienti difficili e superfici metalliche. Custodie IP66/IP68 e tag on-metal con layer ferritico.",
      href: "/categories/tag-industriali",
      label: "Vedi tag industriali",
    },
    {
      title: "Lettori e programmazione",
      body: "Lettori USB per test e sviluppo, più servizio di programmazione professionale per lotti aziendali.",
      href: "/categories/lettori-nfc",
      label: "Vedi lettori NFC",
    },
  ],
};

export const TAG_NFC_PERSONALIZZATI_LANDING = {
  title: "Tag NFC personalizzati per aziende",
  metaDescription:
    "Tag NFC personalizzati: stampa logo, programmazione batch e lotti aziendali. Sticker, tessere e braccialetti su misura con preventivo.",
  intro:
    "Hai bisogno di tag NFC con il tuo logo, i tuoi URL o dati specifici? Realizziamo forniture personalizzate per aziende, agenzie e integratori: stampa, programmazione e confezionamento in lotti da decine a migliaia di pezzi.",
  services: [
    {
      title: "Stampa personalizzata",
      body: "Logo, colori e grafica su sticker, tessere PVC, braccialetti silicone e gadget promozionali.",
    },
    {
      title: "Programmazione NFC",
      body: "URL, vCard, testo o payload NDEF personalizzati. Tag vergini o già programmati in batch.",
    },
    {
      title: "Lotti aziendali",
      body: "Forniture per eventi, campagne marketing, rollout accessi e progetti IoT con tempi concordati.",
    },
    {
      title: "Consulenza chip",
      body: "Ti aiutiamo a scegliere tra NTAG213, NTAG216, MIFARE e DESFire in base al tuo caso d'uso.",
    },
  ],
  faq: [
    {
      question: "Qual è la quantità minima per tag personalizzati?",
      answer:
        "I prezzi indicati sono cad. (al pezzo). La quantità minima è 10 pezzi o soggetta a revisione, in base al formato e alla stampa. I kit si possono ordinare anche singoli. Contattaci con la quantità indicativa e ti inviamo un preventivo entro 24 ore lavorative.",
    },
    {
      question: "Fornite campioni prima dell'ordine?",
      answer:
        "Sì, su richiesta possiamo fornire campioni non personalizzati o con bozza grafica per validare il progetto.",
    },
    {
      question: "Quali tempi di consegna per lotti personalizzati?",
      answer:
        "La spedizione è soggetta a disponibilità; in genere entro 7 giorni lavorativi per stock standard, tempi maggiori per stampa e programmazione custom.",
    },
    {
      question: "Posso inviare io i dati da programmare?",
      answer:
        "Certamente: accettiamo file CSV, Excel o elenchi URL per programmazione batch.",
    },
  ],
};

export function getCategorySeo(slug: string): CategorySeoContent | null {
  return CATEGORY_SEO[slug] ?? null;
}

export function getChipSeo(slug: string): ChipSeoContent | null {
  return CHIP_SEO[slug] ?? null;
}
