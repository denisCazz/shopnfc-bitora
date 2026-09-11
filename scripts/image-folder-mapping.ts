/**
 * Mapping tra le cartelle di "foto sito ricambi" e le categorie del DB.
 * 
 * folderName  → nome esatto della cartella su disco
 * categoryId  → ID nella tabella categories
 * categorySlug → slug per verifica
 */

export interface FolderCategoryMapping {
  folderName: string;
  categoryId: number;
  categorySlug: string;
  description: string;
}

export const FOLDER_CATEGORY_MAP: FolderCategoryMapping[] = [
  { folderName: "ACCESSORI", categoryId: 20, categorySlug: "accessori", description: "Accessori" },
  { folderName: "BRACIERI", categoryId: 12, categorySlug: "bracieri-camere-combustione", description: "Bracieri e Camere Combustione" },
  { folderName: "COCLEA", categoryId: 16, categorySlug: "coclee", description: "Coclee" },
  { folderName: "DISPLAY-CAVI-TELECOMANDI", categoryId: 10, categorySlug: "display-cavi-telecomandi", description: "Display, Cavi, Telecomandi" },
  { folderName: "GUARNIZIONI", categoryId: 14, categorySlug: "guarnizioni-silicone", description: "Guarnizioni e Silicone Alta Temp." },
  { folderName: "MOTORIDUTTORI", categoryId: 6, categorySlug: "motoriduttori", description: "Motoriduttori" },
  { folderName: "POMPE E SENSORI", categoryId: 19, categorySlug: "pompe-sensori", description: "Pompe e Sensori" },
  { folderName: "RESISTENZE ACCENSIONE", categoryId: 9, categorySlug: "resistenze-accensione", description: "Resistenze Accensione" },
  { folderName: "SCHEDE ELETTRONICHE E SENSORI", categoryId: 11, categorySlug: "schede-elettroniche-sensori", description: "Schede Elettroniche e Sensori" },
  { folderName: "SONDE-DEPRESSORI-TERMOSTATI", categoryId: 13, categorySlug: "sonde-depressori-termostati", description: "Sonde, Depressori, Termostati" },
  { folderName: "STUFE", categoryId: 17, categorySlug: "stufe-a-pellet", description: "Stufe a Pellet" },
  { folderName: "VENTILATORI ARIA", categoryId: 8, categorySlug: "ventilatori-aria", description: "Ventilatori Aria" },
  { folderName: "VENTILATORI FUMI", categoryId: 7, categorySlug: "ventilatori-fumi", description: "Ventilatori Fumi" },
];

/**
 * Cartelle NON mappate a categorie prodotto (asset generici / da ignorare):
 * - "Camera Roll"           → foto generiche non categorizzabili
 * - "foto stufe"            → foto ambientate stufe (usare per marketing/hero)
 * - "SCHEDE TECNICHE IPC"   → PDF schede tecniche, non immagini prodotto
 * - "sito ricambi"          → loghi e immagini del sito
 */
export const EXCLUDED_FOLDERS = [
  "Camera Roll",
  "foto stufe",
  "SCHEDE TECNICHE IPC",
  "sito ricambi",
];

/** Estensioni immagine supportate per upload */
export const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".jpe", ".tif"];

/**
 * Genera un R2 key pulito dal path del file.
 * Es: "BRACIERI/BRACIERE 6 KW.jpeg" → "products/bracieri-camere-combustione/braciere-6-kw.jpeg"
 */
export function generateR2Key(categorySlug: string, filename: string): string {
  const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf("."));

  const cleanName = nameWithoutExt
    .toLowerCase()
    .replace(/[àáâã]/g, "a")
    .replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i")
    .replace(/[òóôõ]/g, "o")
    .replace(/[ùúûü]/g, "u")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `products/${categorySlug}/${cleanName}${ext}`;
}
