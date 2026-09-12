import { SITE } from "@/lib/site";
import type { Locale } from "@/lib/i18n";

export type PolicySection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
  after?: string[];
};

export type ReturnsPolicyContent = {
  title: string;
  updated: string;
  intro: string;
  highlightTitle: string;
  highlight: string[];
  sections: PolicySection[];
};

const UPDATED: Record<Locale, string> = {
  it: "Ultimo aggiornamento: 11 settembre 2026",
  en: "Last updated: 11 September 2026",
  fr: "Dernière mise à jour : 11 septembre 2026",
  es: "Última actualización: 11 de septiembre de 2026",
};

function fill(text: string): string {
  return text
    .replaceAll("{legalName}", SITE.legalName)
    .replaceAll("{vat}", SITE.vat)
    .replaceAll("{email}", SITE.email)
    .replaceAll("{phone}", SITE.phone)
    .replaceAll("{city}", SITE.addressCity)
    .replaceAll("{url}", SITE.url.replace(/\/$/, ""));
}

const content: Record<Locale, ReturnsPolicyContent> = {
  it: {
    title: "Politica resi, recesso e garanzia",
    updated: UPDATED.it,
    intro:
      "Questa policy regola resi, diritto di recesso, rimborsi e garanzia per gli acquisti su Shop NFC Bitora ({url}), gestito da {legalName}, P.IVA {vat}, {city}. Integra le condizioni di vendita. Completando l’ordine dichiari di averla letta e accettata.",
    highlightTitle: "In sintesi, per tutelare entrambe le parti",
    highlight: [
      "Aziende, professionisti e chi richiede fattura con P.IVA: nessun diritto di recesso. I prodotti conformi non si restituiscono.",
      "Prodotti personalizzati (programmazione NFC, stampa logo, lotti su misura, encoding, taglio): recesso escluso anche per i consumatori, ai sensi dell’art. 59, lett. c), D.Lgs. 206/2005.",
      "Solo i privati consumatori su merce di magazzino non personalizzata e non usata possono recedere entro 14 giorni, con RMA e spese di reso a proprio carico.",
      "Nessun reso senza autorizzazione scritta (codice RMA). I pacchi non autorizzati possono essere rifiutati.",
    ],
    sections: [
      {
        title: "1. Ambito e prodotti",
        paragraphs: [
          "Shop NFC Bitora vende beni fisici NFC (sticker, tessere, braccialetti, tag industriali e schermati, gadget, lettori/scrittori) e servizi accessori (programmazione, stampa, encoding, confezionamento). La quantità minima d’ordine e i lotti custom sono parte del modello B2B del Venditore.",
          "Le presenti regole si applicano a ogni ordine concluso sul sito, anche da ospite, e prevalgono su richieste informali (chat, telefono, WhatsApp) se contrastanti, salvo accordo scritto del Venditore.",
        ],
      },
      {
        title: "2. Consumatore o professionista",
        paragraphs: [
          "Ai fini di questa policy:",
        ],
        bullets: [
          "È consumatore la persona fisica che agisce per scopi estranei all’attività imprenditoriale, commerciale, artigianale o professionale (art. 3, comma 1, lett. a), D.Lgs. 206/2005).",
          "È professionista chi agisce nell’esercizio della propria attività, incluse aziende, ditte, enti, rivenditori e chi acquista con partita IVA o ragione sociale (art. 3, comma 1, lett. c).",
        ],
        after: [
          "Chi in checkout richiede fattura intestata ad azienda, inserisce P.IVA/VAT, SDI o PEC, oppure è registrato come rivenditore, è trattato come professionista. Il Codice del Consumo (recesso e garanzia legale di conformità) si applica solo al consumatore. Per il professionista valgono il Codice Civile e le presenti condizioni.",
        ],
      },
      {
        title: "3. Professionisti e aziende: esclusione del recesso",
        paragraphs: [
          "Agli acquisti B2B non si applica il diritto di recesso previsto per i contratti a distanza con i consumatori.",
          "Salvo diverso accordo scritto precedente alla spedizione, i prodotti conformi, ordinati, in lavorazione, spediti o consegnati non sono restituibili né rimborsabili. Errori di ordinazione, cambio idea, scorte invendute, incompatibilità non dichiarate in ordine o scelta del chip/modello errata non costituiscono difetto del Venditore.",
          "Eventuali resi di cortesia sono una facoltà discrezionale del Venditore, non un diritto. Se concessi, richiedono RMA, merce nuova e integra, e possono comportare un contributo di restocking fino al 20% del valore netto della merce, oltre alle spese di trasporto di andata e ritorno.",
        ],
      },
      {
        title: "4. Consumatori: diritto di recesso (14 giorni)",
        paragraphs: [
          "Il consumatore ha 14 giorni di calendario per recedere dal contratto, senza doverne specificare il motivo, ai sensi degli artt. 52 e seguenti del Codice del Consumo. Il termine decorre dal giorno in cui il consumatore (o un terzo da lui designato, diverso dal vettore) entra in possesso fisico dei beni; in caso di beni multipli consegnati separatamente, dal possesso dell’ultimo bene.",
          "Il recesso si esercita con dichiarazione esplicita inviata a {email} (oggetto: «Recesso ordine n. …»), indicando numero d’ordine, prodotti, quantità e un recapito. Il Venditore rilascia un codice RMA. La merce va restituita entro 14 giorni dalla comunicazione di recesso, con spedizione tracciata, al domicilio comunicato insieme al RMA.",
          "Il consumatore è responsabile della diminuzione di valore dei beni risultante da una manipolazione diversa da quella necessaria per stabilire natura, caratteristiche e funzionamento (art. 57, comma 2). L’apertura della confezione per una mera verifica è ammessa; l’uso operativo, la programmazione, la scrittura sul chip, la stampa di prova o il danneggiamento escludono il rimborso integrale o il recesso utile.",
        ],
      },
      {
        title: "5. Esclusioni del recesso (art. 59 Codice del Consumo)",
        paragraphs: [
          "Anche per i consumatori il recesso è escluso, in particolare, quando i beni sono confezionati su misura o chiaramente personalizzati (art. 59, comma 1, lett. c). Rientrano in questa esclusione, a titolo esemplificativo e non esaustivo:",
        ],
        bullets: [
          "programmazione NFC (URL, vCard, NDEF, record custom, lock bit, password, UID mirroring o encoding su specifica);",
          "stampa logo, grafiche, testi, numerazioni, QR o layout richiesti dal cliente;",
          "taglio, foratura, formati, colori o materiali non di listino;",
          "lotti prodotti, acquistati o prenotati su specifica del cliente;",
          "kit o soluzioni assemblate su progetto;",
          "servizi di programmazione o stampa la cui esecuzione sia iniziata con accordo del cliente.",
        ],
        after: [
          "Il recesso è inoltre escluso negli altri casi di legge (art. 59), ove applicabili. Completando un ordine con opzioni di personalizzazione, il cliente prende atto che quei beni non sono restituibili, salvo difetto di conformità.",
        ],
      },
      {
        title: "6. Procedura RMA obbligatoria",
        paragraphs: [
          "Nessun reso è accettato senza autorizzazione scritta. Prima di spedire qualsiasi merce:",
        ],
        bullets: [
          "invia un’email a {email} con numero d’ordine, SKU, quantità, motivo, foto della merce e dell’imballo, e, se del caso, del documento di trasporto del corriere;",
          "attendi il codice RMA e l’indirizzo di restituzione (comunicati solo dopo l’autorizzazione);",
          "spedisci solo i pezzi autorizzati, con il codice RMA visibile sul collo, a tue spese salvo diverso obbligo di legge o diverso accordo scritto;",
          "usa un corriere tracciato. Il rischio di perdita o danno durante il reso è a carico del mittente fino alla presa in carico da parte del Venditore.",
        ],
        after: [
          "I resi senza RMA, in contrassegno, a carico del destinatario o privi di tracciamento possono essere rifiutati, rispediti a spese del mittente o giacenti per 15 giorni e poi considerati abbandonati, senza rimborso. Il Venditore non ritira merce al domicilio del cliente, salvo obblighi inderogabili di legge.",
        ],
      },
      {
        title: "7. Condizioni della merce resa",
        paragraphs: [
          "Salvo recesso del consumatore nei limiti di legge, la merce deve essere nuova, non usata, non programmata dal cliente, non bloccata, completa di accessori, imballo originale e documentazione, priva di scritte, etichette extra, residui di adesivo o danni. I chip non devono risultare scritti, formattati o protetti in modo diverso dalla condizione di spedizione.",
          "Il Venditore ispeziona il reso entro tempi ragionevoli. Se le condizioni non sono rispettate, il reso è rifiutato o il rimborso è ridotto in misura della svalutazione. I costi di re-invio al cliente restano a suo carico.",
        ],
      },
      {
        title: "8. Costi di reso e rimborsi",
        paragraphs: [
          "Salvo difetto di conformità imputabile al Venditore, le spese di restituzione sono a carico del cliente. Per il consumatore che esercita il recesso, tale costo è a suo carico come qui espressamente informato ai sensi dell’art. 57, comma 1, Codice del Consumo.",
          "In caso di recesso valido del consumatore, il Venditore rimborsa i pagamenti ricevuti per i beni restituiti, comprese le spese di consegna iniziale nella misura della tariffa standard meno onerosa offerta, entro 14 giorni dalla comunicazione di recesso. Il rimborso può essere sospeso fino al ricevimento dei beni o alla prova della spedizione (art. 56). Il rimborso avviene con lo stesso mezzo di pagamento, salvo diverso accordo. Non si rimborsano dazi, tasse estere, spese di sdoganamento, assicurazioni facoltative né commissioni bancarie di terzi oltre il controllo del Venditore.",
          "I rimborsi B2B, se dovuti (difetto, errore del Venditore, o cortesia autorizzata), sono effettuati con lo stesso canale di pagamento (di regola Stripe) dopo ispezione. I tempi di accredito dipendono anche dal circuito della carta.",
        ],
      },
      {
        title: "9. Annullamento prima della spedizione",
        paragraphs: [
          "Puoi chiedere l’annullamento scrivendo a {email}. Se la merce è ancora a magazzino e non è iniziata alcuna lavorazione, il Venditore si adopera per annullare l’ordine e rimborsare l’importo pagato.",
          "Se è già iniziata la personalizzazione, l’acquisto da fornitore su commessa, il taglio, la stampa o la programmazione, l’annullamento può essere rifiutato o limitato al rimborso dell’eventuale parte non ancora lavorata. Per i professionisti, il Venditore può trattenere i costi già sostenuti e un importo commisurato al lavoro iniziato.",
        ],
      },
      {
        title: "10. Danni da trasporto e controllo alla consegna",
        paragraphs: [
          "All’arrivo verifica l’integrità del collo prima di firmare. In caso di imballo danneggiato, manomesso o non conforme, accetta con riserva specifica sul documento del corriere e scatta foto di collo, etichette e contenuto.",
          "Segnala il danno a {email} entro 8 giorni dalla consegna, allegando numero d’ordine, foto e copia della riserva. Senza riserva e senza segnalazione tempestiva, i danni da trasporto si presumono verificatisi dopo la consegna, salvo prova contraria e salvo i diritti inderogabili del consumatore in caso di difetto di conformità.",
          "Il rischio di perimento o deterioramento dei beni passa al cliente al momento della consegna al vettore nei rapporti B2B (art. 1510 c.c., se la spedizione è al di fuori della sede del Venditore). Per i consumatori restano salve le regole inderogabili sulla consegna.",
        ],
      },
      {
        title: "11. Garanzia",
        paragraphs: [
          "Consumatori. I beni sono coperti dalla garanzia legale di conformità di 2 anni dalla consegna (D.Lgs. 206/2005, come modificato dal D.Lgs. 170/2021). In caso di difetto di conformità, il consumatore ha diritto al ripristino (riparazione o sostituzione, se possibili e non sproporzionati) oppure, alle condizioni di legge, alla riduzione del prezzo o alla risoluzione. Il Venditore non risponde di difetti derivanti da uso improprio, installazione su metallo di tag non schermati, urti, umidità, manomissione, programmazione errata del cliente, lettori non compatibili o usura ordinaria.",
          "Professionisti. È concessa una garanzia convenzionale di 12 mesi dalla consegna sui soli difetti di fabbricazione del prodotto, purché denunciati per iscritto entro 8 giorni dalla scoperta (art. 1495 c.c.). L’azione si prescrive nel termine di legge. Rimedi: a scelta del Venditore, riparazione, sostituzione o rimborso del prezzo pagato per il pezzo difettoso. Sono esclusi danni indiretti, fermo, perdita di dati sul chip, mancato guadagno e costi di riprogrammazione sul campo.",
          "La garanzia decade in caso di rimozione delle protezioni, tentativi di reverse engineering, encoding incompatibile, uso fuori specifica o riparazioni non autorizzate. Un tag NFC «non letto» da un singolo smartphone non è di per sé difetto: va verificato con più dispositivi e, se richiesto, con lettore USB.",
        ],
      },
      {
        title: "12. Limitazione di responsabilità",
        paragraphs: [
          "Nei rapporti con i professionisti, fatto salvo il dolo e la colpa grave (art. 1229 c.c.), la responsabilità complessiva del Venditore per ogni pretesa connessa a un ordine è limitata al corrispettivo netto pagato per i prodotti risultati difettosi. È escluso il risarcimento di danni indiretti, consequenziali, perdita di chance, interruzione di servizio, danni reputazionali e perdita di dati.",
          "Nulla in questa policy limita i diritti inderogabili del consumatore, la responsabilità per morte o danni alla persona, né le tutele che la legge vieta di escludere.",
        ],
      },
      {
        title: "13. Legge applicabile, foro e ODR",
        paragraphs: [
          "Il contratto è regolato dalla legge italiana.",
          "Per i professionisti è competente in via esclusiva il Foro di Torino. Per i consumatori è competente il foro del luogo di residenza o domicilio del consumatore (art. 66-bis Codice del Consumo). Per i consumatori residenti in altri Stati dell’UE restano salve le tutele inderogabili previste dalla legge del Paese di residenza abituale.",
          "La piattaforma europea di risoluzione online delle controversie (ODR) è disponibile all’indirizzo https://ec.europa.eu/consumers/odr. Il Venditore non è obbligato a ricorrere a un organismo ADR, salvo obblighi di legge.",
        ],
      },
      {
        title: "14. Contatti per resi e garanzia",
        paragraphs: [
          "{legalName}",
          "P.IVA {vat} — {city}",
          "Email: {email}",
          "Tel. {phone}",
          "Oggetto consigliato: «RMA / recesso / garanzia» + numero d’ordine.",
        ],
      },
    ],
  },
  en: {
    title: "Returns, withdrawal and warranty policy",
    updated: UPDATED.en,
    intro:
      "This policy governs returns, withdrawal, refunds and warranty for purchases on Shop NFC Bitora ({url}), operated by {legalName}, VAT {vat}, {city}. It forms part of the terms of sale. By completing an order you confirm that you have read and accepted it.",
    highlightTitle: "In short, to protect both parties",
    highlight: [
      "Businesses, professionals and anyone requesting a VAT invoice: no withdrawal right. Conforming goods cannot be returned.",
      "Personalised products (NFC encoding, logo print, custom batches, cutting): withdrawal is excluded even for consumers, under Art. 59(c) of Italian Legislative Decree 206/2005.",
      "Only private consumers may withdraw within 14 days on unused, non-personalised stock, with an RMA and return shipping at their expense.",
      "No return without written authorisation (RMA code). Unauthorised parcels may be refused.",
    ],
    sections: [
      {
        title: "1. Scope and products",
        paragraphs: [
          "Shop NFC Bitora sells physical NFC goods (stickers, cards, wristbands, industrial and on-metal tags, gadgets, readers/writers) and related services (encoding, printing, packaging). Minimum order quantities and custom lots are part of the Seller’s B2B model.",
          "These rules apply to every order placed on the site, including guest checkout, and prevail over informal requests (chat, phone, WhatsApp) if inconsistent, unless the Seller agrees in writing.",
        ],
      },
      {
        title: "2. Consumer or professional",
        paragraphs: ["For the purposes of this policy:"],
        bullets: [
          "A consumer is a natural person acting for purposes unrelated to their trade, business, craft or profession (Art. 3(1)(a), Italian Legislative Decree 206/2005).",
          "A professional is anyone acting in the course of their business, including companies, sole traders, entities, resellers and anyone buying with a VAT number or company name (Art. 3(1)(c)).",
        ],
        after: [
          "Anyone who at checkout requests a company invoice, enters a VAT number, SDI or PEC, or is registered as a reseller is treated as a professional. The Italian Consumer Code (withdrawal and statutory conformity warranty) applies only to consumers. Professionals are governed by the Italian Civil Code and these terms.",
        ],
      },
      {
        title: "3. Professionals and businesses: no withdrawal",
        paragraphs: [
          "B2B purchases are not covered by the distance-selling withdrawal right granted to consumers.",
          "Unless otherwise agreed in writing before shipment, conforming goods that have been ordered, put into production, shipped or delivered are neither returnable nor refundable. Ordering mistakes, change of mind, unsold stock, undeclared incompatibility or the wrong chip/model are not defects of the Seller.",
          "Courtesy returns are at the Seller’s sole discretion, not a right. If granted, they require an RMA, unused goods in original condition, and may incur a restocking fee of up to 20% of the net value, plus outbound and return shipping.",
        ],
      },
      {
        title: "4. Consumers: 14-day withdrawal right",
        paragraphs: [
          "A consumer may withdraw from the contract within 14 calendar days without giving reasons, under Arts. 52 et seq. of the Italian Consumer Code. The period runs from the day the consumer (or a third party indicated by the consumer, other than the carrier) takes physical possession of the goods; for multiple goods delivered separately, from possession of the last item.",
          "Withdrawal is exercised by an explicit statement to {email} (subject: “Withdrawal order no. …”), stating the order number, products, quantities and a contact. The Seller issues an RMA code. Goods must be sent back within 14 days of the withdrawal notice, with tracked shipping, to the address given with the RMA.",
          "The consumer is liable for any diminished value resulting from handling beyond what is necessary to establish the nature, characteristics and functioning of the goods (Art. 57(2)). Opening the pack for inspection is allowed; operational use, encoding, writing to the chip, test printing or damage excludes a full refund or a valid withdrawal.",
        ],
      },
      {
        title: "5. Withdrawal exclusions (Art. 59 Consumer Code)",
        paragraphs: [
          "Even for consumers, withdrawal is excluded in particular where goods are made to measure or clearly personalised (Art. 59(1)(c)). This includes, without limitation:",
        ],
        bullets: [
          "NFC encoding (URL, vCard, NDEF, custom records, lock bits, password, UID mirroring or encoding on request);",
          "logo print, artwork, text, numbering, QR or layouts requested by the customer;",
          "cutting, punching, sizes, colours or materials not from the standard catalogue;",
          "lots produced, purchased or reserved to the customer’s specification;",
          "kits or solutions assembled to a project;",
          "encoding or print services whose performance has begun with the customer’s agreement.",
        ],
        after: [
          "Withdrawal is also excluded in the other cases provided by law (Art. 59), where applicable. By completing an order with personalisation options, the customer acknowledges that those goods cannot be returned except for a lack of conformity.",
        ],
      },
      {
        title: "6. Mandatory RMA procedure",
        paragraphs: [
          "No return is accepted without written authorisation. Before shipping any goods:",
        ],
        bullets: [
          "email {email} with order number, SKU, quantity, reason, photos of the goods and packaging and, where relevant, of the carrier’s delivery document;",
          "wait for the RMA code and the return address (issued only after authorisation);",
          "ship only the authorised items, with the RMA code visible on the parcel, at your expense unless a mandatory legal rule or written agreement says otherwise;",
          "use a tracked courier. Risk of loss or damage during return remains with the sender until the Seller takes charge of the goods.",
        ],
        after: [
          "Returns without an RMA, sent cash-on-delivery, billed to the recipient or without tracking may be refused, sent back at the sender’s expense, or held for 15 days and then treated as abandoned, without refund. The Seller does not collect goods from the customer’s premises, except where the law so requires.",
        ],
      },
      {
        title: "7. Condition of returned goods",
        paragraphs: [
          "Except for a consumer’s withdrawal within legal limits, goods must be new, unused, not encoded by the customer, not locked, complete with accessories, original packaging and documents, free of writing, extra labels, adhesive residue or damage. Chips must not have been written, formatted or protected differently from the condition at shipment.",
          "The Seller inspects the return within a reasonable time. If conditions are not met, the return is refused or the refund is reduced by the diminished value. Costs of sending the goods back to the customer remain with the customer.",
        ],
      },
      {
        title: "8. Return costs and refunds",
        paragraphs: [
          "Unless the goods lack conformity attributable to the Seller, return shipping is paid by the customer. For a consumer exercising withdrawal, that cost is expressly borne by the consumer as required by Art. 57(1) of the Italian Consumer Code.",
          "In the event of a valid consumer withdrawal, the Seller refunds payments received for the returned goods, including initial delivery costs limited to the least expensive standard rate offered, within 14 days of the withdrawal notice. The refund may be withheld until the goods are received or proof of shipment is provided (Art. 56). Refunds are made via the same payment method unless otherwise agreed. Customs duties, foreign taxes, brokerage, optional insurance and third-party bank fees beyond the Seller’s control are not refunded.",
          "B2B refunds, where due (defect, Seller’s error, or authorised courtesy return), are made via the same payment channel (usually Stripe) after inspection. Credit timing also depends on the card network.",
        ],
      },
      {
        title: "9. Cancellation before shipment",
        paragraphs: [
          "You may request cancellation at {email}. If the goods are still in stock and no work has started, the Seller will endeavour to cancel and refund the amount paid.",
          "If personalisation, made-to-order purchasing, cutting, printing or encoding has already started, cancellation may be refused or limited to any part not yet processed. For professionals, the Seller may retain costs already incurred and an amount commensurate with work started.",
        ],
      },
      {
        title: "10. Transit damage and delivery check",
        paragraphs: [
          "On arrival, check the parcel before signing. If the packaging is damaged, tampered with or non-conforming, accept with a specific reservation on the carrier’s document and photograph the parcel, labels and contents.",
          "Report the damage to {email} within 8 days of delivery, attaching the order number, photos and a copy of the reservation. Without a reservation and a timely notice, transit damage is presumed to have occurred after delivery, subject to proof to the contrary and to consumers’ mandatory rights in case of lack of conformity.",
          "In B2B sales the risk of loss or deterioration passes to the buyer on delivery to the carrier where shipment is made from a place other than the Seller’s premises (Art. 1510 of the Italian Civil Code). Mandatory consumer delivery rules remain unaffected.",
        ],
      },
      {
        title: "11. Warranty",
        paragraphs: [
          "Consumers. Goods are covered by the 2-year legal conformity warranty from delivery (Legislative Decree 206/2005, as amended by Legislative Decree 170/2021). In case of lack of conformity, the consumer is entitled to restoration (repair or replacement, if possible and not disproportionate) or, under the statutory conditions, to a price reduction or termination. The Seller is not liable for defects caused by misuse, mounting non-shielded tags on metal, impact, moisture, tampering, incorrect customer encoding, incompatible readers or ordinary wear.",
          "Professionals. A 12-month contractual warranty from delivery is granted solely for manufacturing defects, provided they are reported in writing within 8 days of discovery (Art. 1495 Civil Code). The action is time-barred under the statutory term. Remedies, at the Seller’s option: repair, replacement or refund of the price paid for the defective item. Indirect damage, downtime, loss of chip data, lost profit and on-site re-encoding costs are excluded.",
          "The warranty is void if protections are removed, reverse engineering is attempted, incompatible encoding is used, the product is used off-spec, or unauthorised repairs are made. An NFC tag unread by a single smartphone is not in itself a defect: it must be checked with several devices and, if requested, with a USB reader.",
        ],
      },
      {
        title: "12. Limitation of liability",
        paragraphs: [
          "In dealings with professionals, except for wilful misconduct and gross negligence (Art. 1229 Civil Code), the Seller’s aggregate liability for any claim connected with an order is limited to the net price paid for the products found to be defective. Indirect, consequential and reputational damage, loss of chance, service interruption and data loss are excluded.",
          "Nothing in this policy limits consumers’ mandatory rights, liability for death or personal injury, or protections that the law does not allow to be excluded.",
        ],
      },
      {
        title: "13. Governing law, venue and ODR",
        paragraphs: [
          "The contract is governed by Italian law.",
          "For professionals, the Court of Turin has exclusive jurisdiction. For consumers, the court of the consumer’s place of residence or domicile has jurisdiction (Art. 66-bis Consumer Code). Consumers habitually resident in other EU States retain the mandatory protections of the law of their country of residence.",
          "The European Online Dispute Resolution (ODR) platform is available at https://ec.europa.eu/consumers/odr. The Seller is not obliged to use an ADR body except where the law so requires.",
        ],
      },
      {
        title: "14. Contacts for returns and warranty",
        paragraphs: [
          "{legalName}",
          "VAT {vat} — {city}",
          "Email: {email}",
          "Tel. {phone}",
          "Recommended subject: “RMA / withdrawal / warranty” + order number.",
        ],
      },
    ],
  },
  fr: {
    title: "Politique de retours, rétractation et garantie",
    updated: UPDATED.fr,
    intro:
      "Cette politique régit les retours, le droit de rétractation, les remboursements et la garantie pour les achats sur Shop NFC Bitora ({url}), exploité par {legalName}, TVA {vat}, {city}. Elle complète les conditions de vente. En finalisant une commande, vous déclarez l’avoir lue et acceptée.",
    highlightTitle: "En résumé, pour protéger les deux parties",
    highlight: [
      "Entreprises, professionnels et quiconque demande une facture avec n° de TVA : pas de droit de rétractation. Les produits conformes ne sont pas repris.",
      "Produits personnalisés (encodage NFC, impression logo, lots sur mesure) : rétractation exclue même pour les consommateurs, art. 59, let. c), D.Lgs. italien 206/2005.",
      "Seuls les consommateurs particuliers peuvent se rétracter sous 14 jours sur du stock non personnalisé et non utilisé, avec RMA et frais de retour à leur charge.",
      "Aucun retour sans autorisation écrite (code RMA). Les colis non autorisés peuvent être refusés.",
    ],
    sections: [
      {
        title: "1. Champ d’application et produits",
        paragraphs: [
          "Shop NFC Bitora vend des biens NFC physiques (stickers, cartes, bracelets, tags industriels et blindés, gadgets, lecteurs/encodeurs) et des services associés (encodage, impression, conditionnement). Les quantités minimales et les lots personnalisés font partie du modèle B2B du Vendeur.",
          "Ces règles s’appliquent à toute commande conclue sur le site, y compris en invité, et prévalent sur les demandes informelles (chat, téléphone, WhatsApp) en cas de contradiction, sauf accord écrit du Vendeur.",
        ],
      },
      {
        title: "2. Consommateur ou professionnel",
        paragraphs: ["Pour les besoins de cette politique :"],
        bullets: [
          "Est consommateur la personne physique qui agit à des fins n’entrant pas dans le cadre de son activité professionnelle (art. 3, § 1, let. a), D.Lgs. 206/2005).",
          "Est professionnel quiconque agit dans le cadre de son activité, y compris les sociétés, entreprises individuelles, entités, revendeurs et quiconque achète avec un n° de TVA ou une raison sociale (art. 3, § 1, let. c).",
        ],
        after: [
          "Quiconque demande en caisse une facture société, saisit un n° de TVA, un code SDI ou une PEC, ou est inscrit comme revendeur, est traité comme professionnel. Le Code de la consommation italien (rétractation et garantie légale de conformité) s’applique uniquement au consommateur. Pour le professionnel s’appliquent le Code civil italien et les présentes conditions.",
        ],
      },
      {
        title: "3. Professionnels et entreprises : exclusion de la rétractation",
        paragraphs: [
          "Les achats B2B ne bénéficient pas du droit de rétractation prévu pour les contrats à distance conclus avec des consommateurs.",
          "Sauf accord écrit contraire avant expédition, les produits conformes commandés, en cours de fabrication, expédiés ou livrés ne sont ni repris ni remboursés. Une erreur de commande, un changement d’avis, un stock invendu, une incompatibilité non déclarée ou un mauvais choix de puce/modèle ne constituent pas un défaut du Vendeur.",
          "Les retours de courtoisie sont une faculté discrétionnaire du Vendeur, non un droit. S’ils sont accordés, ils exigent un RMA, une marchandise neuve et intacte, et peuvent entraîner des frais de restockage jusqu’à 20 % de la valeur nette, plus les frais d’aller et de retour.",
        ],
      },
      {
        title: "4. Consommateurs : droit de rétractation de 14 jours",
        paragraphs: [
          "Le consommateur dispose de 14 jours calendaires pour se rétracter sans motif, conformément aux art. 52 et suivants du Code de la consommation italien. Le délai court à compter du jour où le consommateur (ou un tiers désigné, autre que le transporteur) prend physiquement possession des biens ; en cas de biens multiples livrés séparément, à compter de la possession du dernier bien.",
          "La rétractation s’exerce par une déclaration explicite à {email} (objet : « Rétractation commande n° … »), indiquant le numéro de commande, les produits, les quantités et un contact. Le Vendeur délivre un code RMA. La marchandise doit être renvoyée dans les 14 jours suivant la notification, en envoi suivi, à l’adresse communiquée avec le RMA.",
          "Le consommateur est responsable de la dépréciation résultant d’une manipulation autre que celle nécessaire pour établir la nature, les caractéristiques et le fonctionnement des biens (art. 57, § 2). L’ouverture de l’emballage pour vérification est admise ; l’usage opérationnel, l’encodage, l’écriture sur la puce, une impression d’essai ou un endommagement excluent un remboursement intégral ou une rétractation utile.",
        ],
      },
      {
        title: "5. Exclusions de la rétractation (art. 59)",
        paragraphs: [
          "Même pour les consommateurs, la rétractation est exclue notamment lorsque les biens sont confectionnés selon les spécifications du client ou clairement personnalisés (art. 59, § 1, let. c). Sont notamment concernés :",
        ],
        bullets: [
          "l’encodage NFC (URL, vCard, NDEF, enregistrements custom, lock, mot de passe, mirroring d’UID ou encodage sur spécification) ;",
          "l’impression de logo, graphismes, textes, numérotations, QR ou mises en page demandées ;",
          "la découpe, le perçage, les formats, couleurs ou matières hors catalogue ;",
          "les lots produits, achetés ou réservés sur spécification du client ;",
          "les kits ou solutions assemblés sur projet ;",
          "les services d’encodage ou d’impression dont l’exécution a commencé avec l’accord du client.",
        ],
        after: [
          "La rétractation est également exclue dans les autres cas prévus par la loi (art. 59), le cas échéant. En finalisant une commande avec des options de personnalisation, le client reconnaît que ces biens ne sont pas retournables, sauf défaut de conformité.",
        ],
      },
      {
        title: "6. Procédure RMA obligatoire",
        paragraphs: [
          "Aucun retour n’est accepté sans autorisation écrite. Avant d’expédier toute marchandise :",
        ],
        bullets: [
          "écrivez à {email} avec le numéro de commande, le SKU, la quantité, le motif, des photos de la marchandise et de l’emballage et, le cas échéant, du document du transporteur ;",
          "attendez le code RMA et l’adresse de retour (communiqués uniquement après autorisation) ;",
          "expédiez uniquement les pièces autorisées, avec le code RMA visible sur le colis, à vos frais sauf obligation légale impérative ou accord écrit contraire ;",
          "utilisez un transporteur avec suivi. Le risque de perte ou d’avarie pendant le retour reste à la charge de l’expéditeur jusqu’à la prise en charge par le Vendeur.",
        ],
        after: [
          "Les retours sans RMA, en contre-remboursement, à la charge du destinataire ou sans suivi peuvent être refusés, renvoyés aux frais de l’expéditeur ou conservés 15 jours puis considérés comme abandonnés, sans remboursement. Le Vendeur n’enlève pas la marchandise au domicile du client, sauf obligation légale.",
        ],
      },
      {
        title: "7. État de la marchandise retournée",
        paragraphs: [
          "Sauf rétractation du consommateur dans les limites légales, la marchandise doit être neuve, non utilisée, non encodée par le client, non verrouillée, complète avec accessoires, emballage d’origine et documents, sans écriture, étiquette supplémentaire, résidu d’adhésif ni dommage. Les puces ne doivent pas avoir été écrites, formatées ou protégées autrement qu’à l’expédition.",
          "Le Vendeur inspecte le retour dans un délai raisonnable. Si les conditions ne sont pas respectées, le retour est refusé ou le remboursement réduit à hauteur de la dépréciation. Les frais de réexpédition au client restent à sa charge.",
        ],
      },
      {
        title: "8. Frais de retour et remboursement",
        paragraphs: [
          "Sauf défaut de conformité imputable au Vendeur, les frais de retour sont à la charge du client. Pour le consommateur qui exerce son droit de rétractation, ce coût est expressément à sa charge, conformément à l’art. 57, § 1, du Code de la consommation italien.",
          "En cas de rétractation valable du consommateur, le Vendeur rembourse les paiements reçus pour les biens retournés, y compris les frais de livraison initiale dans la limite du tarif standard le moins onéreux proposé, dans les 14 jours suivant la notification. Le remboursement peut être différé jusqu’à réception des biens ou preuve d’expédition (art. 56). Le remboursement est effectué par le même moyen de paiement, sauf accord contraire. Droits de douane, taxes étrangères, courtage, assurances facultatives et frais bancaires de tiers hors du contrôle du Vendeur ne sont pas remboursés.",
          "Les remboursements B2B, lorsqu’ils sont dus (défaut, erreur du Vendeur ou retour de courtoisie autorisé), sont effectués via le même canal de paiement (en règle générale Stripe) après inspection. Les délais de crédit dépendent aussi du réseau de la carte.",
        ],
      },
      {
        title: "9. Annulation avant expédition",
        paragraphs: [
          "Vous pouvez demander l’annulation à {email}. Si la marchandise est encore en stock et qu’aucun travail n’a commencé, le Vendeur s’efforce d’annuler et de rembourser le montant payé.",
          "Si la personnalisation, l’achat sur commande, la découpe, l’impression ou l’encodage a déjà commencé, l’annulation peut être refusée ou limitée à la part non encore traitée. Pour les professionnels, le Vendeur peut retenir les coûts déjà engagés et un montant proportionnel au travail commencé.",
        ],
      },
      {
        title: "10. Dommages de transport et contrôle à la livraison",
        paragraphs: [
          "À l’arrivée, vérifiez l’intégrité du colis avant de signer. En cas d’emballage endommagé, altéré ou non conforme, acceptez avec réserve spécifique sur le document du transporteur et photographiez le colis, les étiquettes et le contenu.",
          "Signalez le dommage à {email} dans les 8 jours suivant la livraison, en joignant le numéro de commande, des photos et une copie de la réserve. Sans réserve ni signalement rapide, les dommages de transport sont présumés survenus après la livraison, sous réserve de preuve contraire et des droits impératifs du consommateur en cas de défaut de conformité.",
          "Dans les ventes B2B, le risque de perte ou de détérioration passe à l’acheteur à la remise au transporteur lorsque l’expédition a lieu hors du siège du Vendeur (art. 1510 du Code civil italien). Les règles impératives de livraison aux consommateurs restent applicables.",
        ],
      },
      {
        title: "11. Garantie",
        paragraphs: [
          "Consommateurs. Les biens bénéficient de la garantie légale de conformité de 2 ans à compter de la livraison (D.Lgs. 206/2005, tel que modifié par le D.Lgs. 170/2021). En cas de défaut de conformité, le consommateur a droit à la mise en conformité (réparation ou remplacement, si possibles et non disproportionnés) ou, aux conditions légales, à la réduction du prix ou à la résolution. Le Vendeur n’est pas responsable des défauts dus à un usage impropre, à la pose de tags non blindés sur métal, aux chocs, à l’humidité, à une altération, à un encodage erroné du client, à des lecteurs incompatibles ou à l’usure normale.",
          "Professionnels. Une garantie conventionnelle de 12 mois à compter de la livraison est accordée uniquement pour les défauts de fabrication, à condition d’une dénonciation écrite dans les 8 jours de la découverte (art. 1495 du Code civil). L’action se prescrit dans le délai légal. Recours, au choix du Vendeur : réparation, remplacement ou remboursement du prix payé pour la pièce défectueuse. Sont exclus les dommages indirects, l’arrêt d’activité, la perte de données sur la puce, le manque à gagner et les coûts de réencodage sur site.",
          "La garantie est caduque en cas de retrait des protections, de tentative de rétro-ingénierie, d’encodage incompatible, d’usage hors spécification ou de réparations non autorisées. Un tag NFC non lu par un seul smartphone n’est pas en soi un défaut : il doit être vérifié avec plusieurs appareils et, si demandé, avec un lecteur USB.",
        ],
      },
      {
        title: "12. Limitation de responsabilité",
        paragraphs: [
          "Dans les rapports avec les professionnels, sauf dol et faute lourde (art. 1229 du Code civil), la responsabilité globale du Vendeur pour toute réclamation liée à une commande est limitée au prix net payé pour les produits reconnus défectueux. Sont exclus les dommages indirects, consécutifs, la perte de chance, l’interruption de service, le préjudice d’image et la perte de données.",
          "Rien dans cette politique ne limite les droits impératifs du consommateur, la responsabilité pour décès ou dommages corporels, ni les protections que la loi interdit d’écarter.",
        ],
      },
      {
        title: "13. Droit applicable, for et ODR",
        paragraphs: [
          "Le contrat est régi par le droit italien.",
          "Pour les professionnels, le Tribunal de Turin est exclusivement compétent. Pour les consommateurs, le for du lieu de résidence ou de domicile du consommateur est compétent (art. 66-bis du Code de la consommation). Les consommateurs résidant habituellement dans un autre État de l’UE conservent les protections impératives de la loi de leur pays de résidence.",
          "La plateforme européenne de règlement en ligne des litiges (ODR) est disponible à l’adresse https://ec.europa.eu/consumers/odr. Le Vendeur n’est pas tenu de recourir à un organisme ADR, sauf obligation légale.",
        ],
      },
      {
        title: "14. Contacts pour retours et garantie",
        paragraphs: [
          "{legalName}",
          "TVA {vat} — {city}",
          "Email : {email}",
          "Tél. {phone}",
          "Objet conseillé : « RMA / rétractation / garantie » + numéro de commande.",
        ],
      },
    ],
  },
  es: {
    title: "Política de devoluciones, desistimiento y garantía",
    updated: UPDATED.es,
    intro:
      "Esta política regula devoluciones, desistimiento, reembolsos y garantía de las compras en Shop NFC Bitora ({url}), gestionado por {legalName}, NIF-IVA {vat}, {city}. Integra las condiciones de venta. Al completar el pedido declaras haberla leído y aceptado.",
    highlightTitle: "En síntesis, para proteger a ambas partes",
    highlight: [
      "Empresas, profesionales y quien pida factura con NIF-IVA: no hay derecho de desistimiento. Los productos conformes no se devuelven.",
      "Productos personalizados (programación NFC, impresión de logo, lotes a medida): desistimiento excluido también para consumidores, art. 59, let. c), D.Lgs. italiano 206/2005.",
      "Solo los consumidores particulares pueden desistir en 14 días sobre stock no personalizado y no usado, con RMA y gastos de devolución a su cargo.",
      "Ninguna devolución sin autorización escrita (código RMA). Los paquetes no autorizados pueden rechazarse.",
    ],
    sections: [
      {
        title: "1. Ámbito y productos",
        paragraphs: [
          "Shop NFC Bitora vende bienes NFC físicos (stickers, tarjetas, pulseras, tags industriales y apantallados, gadgets, lectores/grabadores) y servicios accesorios (programación, impresión, embalaje). Las cantidades mínimas y los lotes a medida forman parte del modelo B2B del Vendedor.",
          "Estas reglas se aplican a todo pedido celebrado en el sitio, también como invitado, y prevalecen sobre solicitudes informales (chat, teléfono, WhatsApp) si hay contradicción, salvo acuerdo escrito del Vendedor.",
        ],
      },
      {
        title: "2. Consumidor o profesional",
        paragraphs: ["A efectos de esta política:"],
        bullets: [
          "Es consumidor la persona física que actúa con fines ajenos a su actividad empresarial, comercial, artesanal o profesional (art. 3, ap. 1, let. a), D.Lgs. 206/2005).",
          "Es profesional quien actúa en el ejercicio de su actividad, incluidas empresas, autónomos, entidades, revendedores y quien compra con NIF-IVA o razón social (art. 3, ap. 1, let. c).",
        ],
        after: [
          "Quien en el checkout pide factura a nombre de empresa, introduce NIF-IVA, SDI o PEC, o está registrado como revendedor, se trata como profesional. El Código de Consumo italiano (desistimiento y garantía legal de conformidad) se aplica solo al consumidor. Para el profesional rigen el Código Civil italiano y estas condiciones.",
        ],
      },
      {
        title: "3. Profesionales y empresas: exclusión del desistimiento",
        paragraphs: [
          "A las compras B2B no se aplica el derecho de desistimiento previsto para los contratos a distancia con consumidores.",
          "Salvo acuerdo escrito distinto anterior al envío, los productos conformes pedidos, en elaboración, enviados o entregados no son devolubles ni reembolsables. Un error de pedido, un cambio de opinión, stock invendido, una incompatibilidad no declarada o un chip/modelo equivocado no constituyen defecto del Vendedor.",
          "Las devoluciones de cortesía son una facultad discrecional del Vendedor, no un derecho. Si se conceden, requieren RMA, mercancía nueva e íntegra, y pueden conllevar un cargo de restocking de hasta el 20 % del valor neto, más los gastos de ida y vuelta.",
        ],
      },
      {
        title: "4. Consumidores: derecho de desistimiento de 14 días",
        paragraphs: [
          "El consumidor dispone de 14 días naturales para desistir del contrato sin indicar el motivo, conforme a los arts. 52 y siguientes del Código de Consumo italiano. El plazo corre desde el día en que el consumidor (o un tercero por él indicado, distinto del transportista) adquiere la posesión material de los bienes; si hay varios bienes entregados por separado, desde la posesión del último.",
          "El desistimiento se ejerce con una declaración explícita a {email} (asunto: «Desistimiento pedido n.º …»), indicando número de pedido, productos, cantidades y un contacto. El Vendedor emite un código RMA. La mercancía debe devolverse en los 14 días siguientes a la comunicación, con envío con seguimiento, a la dirección comunicada con el RMA.",
          "El consumidor responde de la disminución de valor derivada de una manipulación distinta de la necesaria para establecer la naturaleza, las características y el funcionamiento de los bienes (art. 57, ap. 2). Abrir el embalaje para una mera comprobación está permitido; el uso operativo, la programación, la escritura en el chip, una impresión de prueba o el daño excluyen el reembolso íntegro o un desistimiento útil.",
        ],
      },
      {
        title: "5. Exclusiones del desistimiento (art. 59)",
        paragraphs: [
          "También para los consumidores el desistimiento queda excluido, en particular, cuando los bienes se confeccionan conforme a las especificaciones del cliente o están claramente personalizados (art. 59, ap. 1, let. c). Se incluyen, a título enunciativo:",
        ],
        bullets: [
          "programación NFC (URL, vCard, NDEF, registros personalizados, lock, contraseña, mirroring de UID o encoding bajo especificación);",
          "impresión de logo, artes, textos, numeraciones, QR o maquetas solicitadas;",
          "corte, perforación, formatos, colores o materiales fuera de catálogo;",
          "lotes producidos, comprados o reservados bajo especificación del cliente;",
          "kits o soluciones ensambladas sobre proyecto;",
          "servicios de programación o impresión cuya ejecución haya comenzado con el acuerdo del cliente.",
        ],
        after: [
          "El desistimiento también queda excluido en los demás casos legales (art. 59), cuando procedan. Al completar un pedido con opciones de personalización, el cliente reconoce que esos bienes no son devolubles, salvo falta de conformidad.",
        ],
      },
      {
        title: "6. Procedimiento RMA obligatorio",
        paragraphs: [
          "No se acepta ninguna devolución sin autorización escrita. Antes de enviar cualquier mercancía:",
        ],
        bullets: [
          "escribe a {email} con número de pedido, SKU, cantidad, motivo, fotos de la mercancía y del embalaje y, en su caso, del documento del transportista;",
          "espera el código RMA y la dirección de devolución (se comunican solo tras la autorización);",
          "envía solo las piezas autorizadas, con el código RMA visible en el bulto, a tu cargo salvo obligación legal imperativa o acuerdo escrito distinto;",
          "usa un transportista con seguimiento. El riesgo de pérdida o daño durante la devolución corre a cargo del remitente hasta que el Vendedor se haga cargo de la mercancía.",
        ],
        after: [
          "Las devoluciones sin RMA, contra reembolso, a cargo del destinatario o sin seguimiento pueden rechazarse, reenviarse a costa del remitente o retenerse 15 días y considerarse abandonadas, sin reembolso. El Vendedor no recoge mercancía en el domicilio del cliente, salvo obligación legal.",
        ],
      },
      {
        title: "7. Estado de la mercancía devuelta",
        paragraphs: [
          "Salvo desistimiento del consumidor en los límites legales, la mercancía debe ser nueva, no usada, no programada por el cliente, no bloqueada, completa con accesorios, embalaje original y documentación, sin escritos, etiquetas extra, restos de adhesivo ni daños. Los chips no deben haberse escrito, formateado o protegido de forma distinta a la del envío.",
          "El Vendedor inspecciona la devolución en un plazo razonable. Si no se respetan las condiciones, se rechaza o se reduce el reembolso en la medida de la depreciación. Los costes de reenvío al cliente corren a su cargo.",
        ],
      },
      {
        title: "8. Costes de devolución y reembolsos",
        paragraphs: [
          "Salvo falta de conformidad imputable al Vendedor, los gastos de devolución corren a cargo del cliente. Para el consumidor que ejerce el desistimiento, ese coste es expresamente suyo, conforme al art. 57, ap. 1, del Código de Consumo italiano.",
          "En caso de desistimiento válido del consumidor, el Vendedor reembolsa los pagos recibidos por los bienes devueltos, incluidos los gastos de entrega inicial en la medida de la tarifa estándar menos onerosa ofrecida, en un plazo de 14 días desde la comunicación. El reembolso puede retenerse hasta la recepción de los bienes o la prueba de envío (art. 56). Se realiza por el mismo medio de pago, salvo acuerdo distinto. No se reembolsan aranceles, impuestos extranjeros, corretaje, seguros opcionales ni comisiones bancarias de terceros fuera del control del Vendedor.",
          "Los reembolsos B2B, cuando procedan (defecto, error del Vendedor o cortesía autorizada), se realizan por el mismo canal de pago (por regla Stripe) tras la inspección. Los plazos de abono también dependen de la red de la tarjeta.",
        ],
      },
      {
        title: "9. Anulación antes del envío",
        paragraphs: [
          "Puedes pedir la anulación en {email}. Si la mercancía sigue en stock y no ha empezado ninguna elaboración, el Vendedor procurará anular y reembolsar el importe pagado.",
          "Si ya ha empezado la personalización, la compra bajo pedido, el corte, la impresión o la programación, la anulación puede rechazarse o limitarse a la parte aún no trabajada. Para los profesionales, el Vendedor puede retener los costes ya soportados y un importe proporcionado al trabajo iniciado.",
        ],
      },
      {
        title: "10. Daños de transporte y control en la entrega",
        paragraphs: [
          "A la llegada, comprueba la integridad del bulto antes de firmar. Si el embalaje está dañado, manipulado o no conforme, acepta con reserva específica en el documento del transportista y fotografía el bulto, las etiquetas y el contenido.",
          "Comunica el daño a {email} en un plazo de 8 días desde la entrega, adjuntando número de pedido, fotos y copia de la reserva. Sin reserva ni aviso puntual, se presume que los daños de transporte se produjeron después de la entrega, salvo prueba en contrario y salvo los derechos imperativos del consumidor en caso de falta de conformidad.",
          "En las ventas B2B el riesgo de pérdida o deterioro pasa al comprador con la entrega al transportista cuando el envío se hace fuera del establecimiento del Vendedor (art. 1510 del Código Civil italiano). Quedan a salvo las normas imperativas de entrega a consumidores.",
        ],
      },
      {
        title: "11. Garantía",
        paragraphs: [
          "Consumidores. Los bienes están cubiertos por la garantía legal de conformidad de 2 años desde la entrega (D.Lgs. 206/2005, modificado por el D.Lgs. 170/2021). En caso de falta de conformidad, el consumidor tiene derecho a la reposición (reparación o sustitución, si son posibles y no desproporcionadas) o, en las condiciones legales, a la reducción del precio o a la resolución. El Vendedor no responde de defectos por uso indebido, montaje de tags no apantallados sobre metal, golpes, humedad, manipulación, programación errónea del cliente, lectores incompatibles o desgaste ordinario.",
          "Profesionales. Se concede una garantía convencional de 12 meses desde la entrega solo por defectos de fabricación, siempre que se denuncien por escrito en los 8 días siguientes al descubrimiento (art. 1495 del Código Civil). La acción prescribe en el plazo legal. Remedios, a elección del Vendedor: reparación, sustitución o reembolso del precio pagado por la pieza defectuosa. Quedan excluidos daños indirectos, paradas, pérdida de datos en el chip, lucro cesante y costes de reprogramación in situ.",
          "La garantía decae si se retiran protecciones, se intenta ingeniería inversa, se usa encoding incompatible, se usa fuera de especificación o se hacen reparaciones no autorizadas. Un tag NFC no leído por un solo smartphone no es por sí mismo un defecto: debe comprobarse con varios dispositivos y, si se pide, con un lector USB.",
        ],
      },
      {
        title: "12. Limitación de responsabilidad",
        paragraphs: [
          "En las relaciones con profesionales, salvo dolo y culpa grave (art. 1229 del Código Civil), la responsabilidad global del Vendedor por cualquier reclamación ligada a un pedido se limita al precio neto pagado por los productos reconocidos defectuosos. Se excluyen daños indirectos, consecuenciales, pérdida de oportunidad, interrupción del servicio, daño reputacional y pérdida de datos.",
          "Nada en esta política limita los derechos imperativos del consumidor, la responsabilidad por muerte o daños personales, ni las tutelas que la ley prohíbe excluir.",
        ],
      },
      {
        title: "13. Ley aplicable, fuero y ODR",
        paragraphs: [
          "El contrato se rige por la ley italiana.",
          "Para los profesionales es competente de forma exclusiva el Juzgado de Turín. Para los consumidores es competente el fuero del lugar de residencia o domicilio del consumidor (art. 66-bis del Código de Consumo). Los consumidores con residencia habitual en otros Estados de la UE conservan las tutelas imperativas de la ley de su país de residencia.",
          "La plataforma europea de resolución de litigios en línea (ODR) está disponible en https://ec.europa.eu/consumers/odr. El Vendedor no está obligado a acudir a un organismo ADR, salvo obligación legal.",
        ],
      },
      {
        title: "14. Contactos para devoluciones y garantía",
        paragraphs: [
          "{legalName}",
          "NIF-IVA {vat} — {city}",
          "Email: {email}",
          "Tel. {phone}",
          "Asunto recomendado: «RMA / desistimiento / garantía» + número de pedido.",
        ],
      },
    ],
  },
};

function mapFilled(policy: ReturnsPolicyContent): ReturnsPolicyContent {
  return {
    title: fill(policy.title),
    updated: fill(policy.updated),
    intro: fill(policy.intro),
    highlightTitle: fill(policy.highlightTitle),
    highlight: policy.highlight.map(fill),
    sections: policy.sections.map((section) => ({
      title: fill(section.title),
      paragraphs: section.paragraphs.map(fill),
      bullets: section.bullets?.map(fill),
      after: section.after?.map(fill),
    })),
  };
}

export function getReturnsPolicy(locale: Locale): ReturnsPolicyContent {
  return mapFilled(content[locale] ?? content.it);
}
