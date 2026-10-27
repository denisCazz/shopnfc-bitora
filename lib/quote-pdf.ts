import { jsPDF } from "jspdf";
import { SITE } from "@/lib/site";

export interface QuotePdfLineItem {
  productName: string;
  sku?: string | null;
  categoryName?: string | null;
  quantity: number;
  hasGraphic: boolean;
  printSidesLabel: string;
  baseUnitPrice: number;
  printUnitSurcharge: number;
  finalUnitPrice: number;
  lineTotal: number;
  programmingLabel?: string | null;
  notes?: string | null;
}

export interface QuotePdfData {
  quoteNumber: string;
  issueDate: string;
  validUntilDate: string;
  firstName: string;
  lastName: string;
  company?: string;
  vatNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
  items: QuotePdfLineItem[];
  subtotal: number;
  discountLabel?: string | null;
  discountAmount: number;
  subtotalAfterDiscount: number;
  shippingZoneLabel: string;
  shippingCost: number;
  totalGross: number;
  netTotal: number;
  vatAmount: number;
  vatRatePercent: number;
  pricesIncludeVat: boolean;
  paymentTerms?: string;
  deliveryEstimate?: string;
  customNotes?: string;
  logoDataUrl?: string | null;
}

function fmtEur(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n) + " €";
}

export async function loadImageAsDataUrl(src: string): Promise<string | null> {
  try {
    const res = await fetch(src, { cache: "force-cache" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function buildQuotePdfDocument(data: QuotePdfData): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;

  // Color palette (RGB)
  const colDark: [number, number, number] = [15, 23, 42]; // #0f172a
  const colDarkCard: [number, number, number] = [30, 41, 59]; // #1e293b
  const colAccent: [number, number, number] = [2, 132, 199]; // #0284c7
  const colAccentLight: [number, number, number] = [240, 249, 255]; // #f0f9ff
  const colAccentBorder: [number, number, number] = [186, 230, 253]; // #bae6fd
  const colText: [number, number, number] = [30, 41, 59]; // #1e293b
  const colMuted: [number, number, number] = [100, 116, 139]; // #64748b
  const colBorder: [number, number, number] = [226, 232, 240]; // #e2e8f0
  const colRowAlt: [number, number, number] = [248, 250, 252]; // #f8fafc
  const colGreen: [number, number, number] = [22, 163, 74]; // #16a34a
  const colGreenBg: [number, number, number] = [240, 253, 244]; // #f0fdf4

  // ── 1. HEADER BANNER ────────────────────────────────────────────────────────
  const headerH = 38;
  doc.setFillColor(...colDark);
  doc.rect(0, 0, pageWidth, headerH, "F");

  // Subtle cyan accent stripe at bottom of header
  doc.setFillColor(...colAccent);
  doc.rect(0, headerH, pageWidth, 1.4, "F");

  // Logo
  let brandTextX = marginX;
  if (data.logoDataUrl) {
    try {
      // Draw a rounded dark badge behind the logo
      doc.setFillColor(0, 0, 0);
      doc.roundedRect(marginX, 7, 24, 24, 3, 3, "F");
      doc.addImage(data.logoDataUrl, "PNG", marginX + 1, 8, 22, 22);
      brandTextX = marginX + 28;
    } catch {
      brandTextX = marginX;
    }
  }

  // Brand name & legal details in header
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("SHOP NFC BITORA", brandTextX, 14.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(186, 230, 253);
  doc.text(SITE.tagline, brandTextX, 19.5);

  doc.setTextColor(203, 213, 225);
  doc.setFontSize(8);
  doc.text(
    `${SITE.legalName} · P.IVA IT${SITE.vat} · ${SITE.addressCity}`,
    brandTextX,
    25
  );
  doc.text(
    `${SITE.email} · Tel / WhatsApp: ${SITE.phone} · shopnfc.bitora.it`,
    brandTextX,
    29.5
  );

  // Right side of header: PREVENTIVO badge & metadata
  const badgeW = 62;
  const badgeX = pageWidth - marginX - badgeW;
  doc.setFillColor(...colDarkCard);
  doc.roundedRect(badgeX, 6.5, badgeW, 25, 2.5, 2.5, "F");

  doc.setTextColor(56, 189, 248);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text("PREVENTIVO UFFICIALE", badgeX + badgeW - 3.5, 13, { align: "right" });

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`N. ${data.quoteNumber}`, badgeX + badgeW - 3.5, 18.5, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Data: ${data.issueDate}`, badgeX + badgeW - 3.5, 23.5, { align: "right" });
  doc.text(`Valido fino al: ${data.validUntilDate}`, badgeX + badgeW - 3.5, 28, {
    align: "right",
  });

  let y = headerH + 8;

  // ── 2. CLIENT & SUPPLIER INFO BOXES ─────────────────────────────────────────
  const boxGap = 6;
  const boxW = (contentWidth - boxGap) / 2;
  const customerFullName =
    `${data.firstName.trim()} ${data.lastName.trim()}`.trim() || "Cliente";

  // Measure lines for dynamic height
  const clientLines: { label?: string; text: string; bold?: boolean }[] = [
    { text: customerFullName, bold: true },
  ];
  if (data.company?.trim()) {
    clientLines.push({ label: "Azienda:", text: data.company.trim() });
  }
  if (data.vatNumber?.trim()) {
    clientLines.push({ label: "P.IVA / C.F.:", text: data.vatNumber.trim() });
  }
  if (data.email?.trim() || data.phone?.trim()) {
    const contactParts = [data.email?.trim(), data.phone?.trim()].filter(Boolean);
    clientLines.push({ label: "Contatti:", text: contactParts.join(" · ") });
  }
  if (data.address?.trim()) {
    clientLines.push({ label: "Destinazione:", text: data.address.trim() });
  }

  const infoBoxH = Math.max(30, 12 + clientLines.length * 4.7);

  // Left box: Destinatario Preventivo
  doc.setFillColor(...colRowAlt);
  doc.setDrawColor(...colBorder);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, y, boxW, infoBoxH, 2.5, 2.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...colAccent);
  doc.text("DESTINATARIO PREVENTIVO", marginX + 4, y + 5.5);

  let cy = y + 11;
  for (const line of clientLines) {
    if (line.bold) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...colText);
      doc.text(doc.splitTextToSize(line.text, boxW - 8)[0] || line.text, marginX + 4, cy);
      cy += 5;
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...colMuted);
      const lbl = line.label ? `${line.label} ` : "";
      doc.text(lbl, marginX + 4, cy);
      const lblW = lbl ? doc.getTextWidth(lbl) : 0;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colText);
      const maxValW = Math.max(20, boxW - 8 - lblW);
      const wrapped = doc.splitTextToSize(line.text, maxValW);
      doc.text(wrapped[0] || "", marginX + 4 + lblW, cy);
      cy += 4.5;
    }
  }

  // Right box: Riepilogo Condizioni Fornitura
  const rightBoxX = marginX + boxW + boxGap;
  doc.setFillColor(...colRowAlt);
  doc.setDrawColor(...colBorder);
  doc.roundedRect(rightBoxX, y, boxW, infoBoxH, 2.5, 2.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...colAccent);
  doc.text("DETTAGLI FORNITURA & SPEDIZIONE", rightBoxX + 4, y + 5.5);

  const summaryRows: [string, string][] = [
    ["Zona spedizione:", data.shippingZoneLabel],
    [
      "Consegna stimata:",
      data.deliveryEstimate?.trim() || "5–7 giorni lavorativi dalla conferma",
    ],
    [
      "Modalità pagamento:",
      data.paymentTerms?.trim() || "Bonifico bancario / Carta (Stripe)",
    ],
    [
      "Regime prezzi:",
      data.pricesIncludeVat ? "Prezzi IVA 22% inclusa" : "Esente IVA / Reverse Charge",
    ],
  ];

  let sy = y + 11;
  for (const [k, v] of summaryRows) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...colMuted);
    doc.text(k, rightBoxX + 4, sy);
    const kw = doc.getTextWidth(`${k} `);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colText);
    const wrappedV = doc.splitTextToSize(v, boxW - 8 - kw);
    doc.text(wrappedV[0] || "", rightBoxX + 4 + kw, sy);
    sy += 4.7;
  }

  y += infoBoxH + 7;

  // ── 3. LINE ITEMS TABLE ─────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...colText);
  doc.text("DETTAGLIO ARTICOLI E PERSONALIZZAZIONE", marginX, y);
  y += 3;

  // Columns definition (total = 182mm)
  // 1: Modello / Prodotto (64mm)
  // 2: Grafica & Lati stampa (42mm)
  // 3: Qtà (16mm)
  // 4: Prezzo Base (19mm)
  // 5: Stampa/pz (19mm)
  // 6: Totale Riga (22mm)
  const cols = [
    { x: marginX, w: 64, label: "MODELLO / PRODOTTO", align: "left" as const },
    { x: marginX + 64, w: 42, label: "GRAFICA & LATI STAMPA", align: "left" as const },
    { x: marginX + 106, w: 15, label: "QTÀ", align: "center" as const },
    { x: marginX + 121, w: 20, label: "BASE / PZ", align: "right" as const },
    { x: marginX + 141, w: 19, label: "STAMPA / PZ", align: "right" as const },
    { x: marginX + 160, w: 22, label: "TOTALE", align: "right" as const },
  ];

  const drawTableHeader = (topY: number): number => {
    const thH = 8;
    doc.setFillColor(...colDark);
    doc.roundedRect(marginX, topY, contentWidth, thH, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(255, 255, 255);

    for (const c of cols) {
      const ty = topY + 5.2;
      if (c.align === "left") {
        doc.text(c.label, c.x + 2.5, ty);
      } else if (c.align === "center") {
        doc.text(c.label, c.x + c.w / 2, ty, { align: "center" });
      } else {
        doc.text(c.label, c.x + c.w - 2.5, ty, { align: "right" });
      }
    }
    return topY + thH;
  };

  y = drawTableHeader(y);

  for (let idx = 0; idx < data.items.length; idx++) {
    const item = data.items[idx];

    // Prepare text lines for column 1 (product) and column 2 (graphic & sides)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    const titleLines: string[] = doc.splitTextToSize(
      item.productName || "Prodotto NFC",
      cols[0].w - 5
    );

    const subLines: string[] = [];
    if (item.sku) subLines.push(`SKU: ${item.sku}`);
    if (item.categoryName) subLines.push(item.categoryName);
    if (item.programmingLabel) subLines.push(`Chip: ${item.programmingLabel}`);
    if (item.notes?.trim()) {
      const noteWrapped: string[] = doc.splitTextToSize(
        `Nota: ${item.notes.trim()}`,
        cols[0].w - 5
      );
      subLines.push(...noteWrapped);
    }

    const graphicStatusText = item.hasGraphic ? "Grafica: SÌ (Personalizzata)" : "Grafica: NO (Neutro)";
    const sidesLines: string[] = doc.splitTextToSize(
      `Stampa: ${item.printSidesLabel}`,
      cols[1].w - 4
    );

    const col1H = titleLines.length * 4 + subLines.length * 3.5;
    const col2H = 4.2 + sidesLines.length * 3.6 + 3.6;
    const rowH = Math.max(14, Math.max(col1H, col2H) + 5);

    // Page break check
    if (y + rowH > pageHeight - 75) {
      doc.addPage();
      y = 18;
      y = drawTableHeader(y);
    }

    // Zebra background
    if (idx % 2 === 1) {
      doc.setFillColor(...colRowAlt);
      doc.rect(marginX, y, contentWidth, rowH, "F");
    }

    // Row bottom border
    doc.setDrawColor(...colBorder);
    doc.setLineWidth(0.25);
    doc.line(marginX, y + rowH, marginX + contentWidth, y + rowH);

    // Col 1: Product Name + SKU + Notes
    let c1y = y + 4.8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...colText);
    for (const tl of titleLines) {
      doc.text(tl, cols[0].x + 2.5, c1y);
      c1y += 4;
    }
    if (subLines.length > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.2);
      doc.setTextColor(...colMuted);
      for (const sl of subLines) {
        doc.text(sl, cols[0].x + 2.5, c1y);
        c1y += 3.5;
      }
    }

    // Col 2: Graphic Yes/No + Sides to print
    let c2y = y + 4.8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.8);
    if (item.hasGraphic) {
      doc.setTextColor(...colAccent);
    } else {
      doc.setTextColor(...colMuted);
    }
    doc.text(graphicStatusText, cols[1].x + 2, c2y);
    c2y += 4.2;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...colText);
    for (const sl of sidesLines) {
      doc.text(sl, cols[1].x + 2, c2y);
      c2y += 3.6;
    }

    doc.setFontSize(7);
    doc.setTextColor(...colMuted);
    doc.text(`Prezzo finito: ${fmtEur(item.finalUnitPrice)}/pz`, cols[1].x + 2, c2y);

    // Col 3: Quantity
    const midY = y + rowH / 2 + 1;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...colText);
    doc.text(`${item.quantity} pz`, cols[2].x + cols[2].w / 2, midY, {
      align: "center",
    });

    // Col 4: Base Unit Price
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...colText);
    doc.text(fmtEur(item.baseUnitPrice), cols[3].x + cols[3].w - 2.5, midY, {
      align: "right",
    });

    // Col 5: Print surcharge
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    if (item.printUnitSurcharge > 0) {
      doc.setTextColor(...colAccent);
      doc.text(`+${fmtEur(item.printUnitSurcharge)}`, cols[4].x + cols[4].w - 2.5, midY, {
        align: "right",
      });
    } else {
      doc.setTextColor(...colMuted);
      doc.text("Inclusa / 0,00 €", cols[4].x + cols[4].w - 2.5, midY, {
        align: "right",
      });
    }

    // Col 6: Line Total
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.8);
    doc.setTextColor(...colText);
    doc.text(fmtEur(item.lineTotal), cols[5].x + cols[5].w - 2.5, midY, {
      align: "right",
    });

    y += rowH;
  }

  y += 6;

  // Ensure enough space for totals & notes
  if (y + 68 > pageHeight - 20) {
    doc.addPage();
    y = 20;
  }

  // ── 4. TOTALS SUMMARY & NOTES SIDE BY SIDE ──────────────────────────────────
  const totalsW = 82;
  const totalsX = pageWidth - marginX - totalsW;
  const leftNotesW = contentWidth - totalsW - 8;

  const startSummaryY = y;

  // Left side: Note & Condizioni
  doc.setFillColor(...colAccentLight);
  doc.setDrawColor(...colAccentBorder);
  doc.setLineWidth(0.3);

  const defaultConditions = [
    "• Programmazione chip NFC (URL, vCard o testo) inclusa ove richiesta.",
    "• Per ordini con grafica personalizzata, prima della produzione viene verificata l'idoneità del file grafico.",
    "• Spedizione tramite corriere espresso tracciato con codice di tracking diretto.",
  ];
  const customNoteLines: string[] = data.customNotes?.trim()
    ? doc.splitTextToSize(data.customNotes.trim(), leftNotesW - 8)
    : [];

  const condLines: string[] = [];
  for (const c of defaultConditions) {
    condLines.push(...doc.splitTextToSize(c, leftNotesW - 8));
  }

  const notesBoxH = Math.max(
    42,
    14 +
      (customNoteLines.length > 0 ? customNoteLines.length * 3.8 + 5 : 0) +
      condLines.length * 3.5
  );

  doc.roundedRect(marginX, startSummaryY, leftNotesW, notesBoxH, 2.5, 2.5, "FD");

  let ny = startSummaryY + 5.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.8);
  doc.setTextColor(...colAccent);
  doc.text("NOTE E CONDIZIONI DI FORNITURA", marginX + 4, ny);
  ny += 4.8;

  if (customNoteLines.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.8);
    doc.setTextColor(...colText);
    for (const nl of customNoteLines) {
      doc.text(nl, marginX + 4, ny);
      ny += 3.8;
    }
    ny += 2;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(...colMuted);
  for (const cl of condLines) {
    doc.text(cl, marginX + 4, ny);
    ny += 3.5;
  }

  // Right side: Totals Breakdown Card
  let ty = startSummaryY;
  const drawSummaryRow = (
    label: string,
    val: string,
    opts?: { bold?: boolean; color?: [number, number, number]; bg?: [number, number, number] }
  ) => {
    const rH = 6.5;
    if (opts?.bg) {
      doc.setFillColor(...opts.bg);
      doc.roundedRect(totalsX, ty, totalsW, rH, 1.2, 1.2, "F");
    }
    doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
    doc.setFontSize(8.2);
    doc.setTextColor(...(opts?.color || colMuted));
    doc.text(label, totalsX + 3, ty + 4.5);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...(opts?.color || colText));
    doc.text(val, totalsX + totalsW - 3, ty + 4.5, { align: "right" });
    ty += rH;
  };

  drawSummaryRow("Subtotale articoli:", fmtEur(data.subtotal));

  if (data.discountAmount > 0) {
    const discTitle = data.discountLabel?.trim()
      ? `Sconto (${data.discountLabel.trim()}):`
      : "Sconto applicato:";
    drawSummaryRow(discTitle, `-${fmtEur(data.discountAmount)}`, {
      bold: true,
      color: colGreen,
      bg: colGreenBg,
    });
    drawSummaryRow("Subtotale scontato:", fmtEur(data.subtotalAfterDiscount));
  }

  drawSummaryRow(
    `Spedizione (${data.shippingZoneLabel}):`,
    fmtEur(data.shippingCost),
    { bold: false }
  );

  if (data.pricesIncludeVat) {
    drawSummaryRow("Imponibile netto:", fmtEur(data.netTotal));
    drawSummaryRow(`IVA (${data.vatRatePercent}% inclusa):`, fmtEur(data.vatAmount));
  } else {
    drawSummaryRow("IVA:", "0,00 € (Esente / N.I.)");
  }

  ty += 1.5;

  // Grand Total Box
  const grandH = 11.5;
  doc.setFillColor(...colDark);
  doc.roundedRect(totalsX, ty, totalsW, grandH, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(186, 230, 253);
  doc.text("TOTALE PREVENTIVO", totalsX + 3.5, ty + 7.2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(fmtEur(data.totalGross), totalsX + totalsW - 3.5, ty + 7.5, {
    align: "right",
  });

  ty += grandH + 4;

  // Bank details mini-box under totals
  const bankBoxY = Math.max(startSummaryY + notesBoxH, ty) + 5;
  if (bankBoxY + 18 < pageHeight - 16) {
    doc.setFillColor(...colRowAlt);
    doc.setDrawColor(...colBorder);
    doc.setLineWidth(0.25);
    doc.roundedRect(marginX, bankBoxY, contentWidth, 14, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...colText);
    doc.text("COORDINATE BANCARIE PER BONIFICO:", marginX + 4, bankBoxY + 5.2);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...colMuted);
    doc.text(
      `Intestatario: ${SITE.bankHolder}   ·   IBAN: IT76S0708461620000000920491   ·   Causale: Preventivo ${data.quoteNumber}`,
      marginX + 4,
      bankBoxY + 10.2
    );
  }

  // ── 5. FOOTER ON ALL PAGES ──────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    const footerY = pageHeight - 10;
    doc.setDrawColor(...colBorder);
    doc.setLineWidth(0.25);
    doc.line(marginX, footerY - 4, pageWidth - marginX, footerY - 4);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(...colMuted);
    doc.text(
      `${SITE.name} — ${SITE.legalName} · P.IVA IT${SITE.vat} · ${SITE.addressCity} · ${SITE.email} · Tel. ${SITE.phone}`,
      marginX,
      footerY
    );
    doc.text(
      `Pag. ${p} di ${pageCount}`,
      pageWidth - marginX,
      footerY,
      { align: "right" }
    );
  }

  return doc;
}
