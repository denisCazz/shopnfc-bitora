export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  name_it?: string;
  name_en?: string;
  name_fr?: string;
  name_es?: string;
}

export const categories: Category[] = [
  { id: 1, name: "Sticker NFC", slug: "sticker-nfc", icon: "StickyNote" },
  { id: 2, name: "Tessere NFC", slug: "tessere-nfc", icon: "CreditCard" },
  { id: 3, name: "Braccialetti NFC", slug: "braccialetti-nfc", icon: "Watch" },
  { id: 4, name: "Tag industriali", slug: "tag-industriali", icon: "Gauge" },
  { id: 5, name: "Tag schermati", slug: "tag-schermati", icon: "Shield" },
  { id: 6, name: "Gadget NFC", slug: "gadget-nfc", icon: "Package" },
  { id: 7, name: "Lettori e scrittori", slug: "lettori-nfc", icon: "Radio" },
  { id: 8, name: "Soluzioni NFC", slug: "soluzioni-nfc", icon: "Wrench" },
];
