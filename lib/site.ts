export const SITE = {
  name: "Shop NFC",
  shortName: "Shop NFC",
  tagline: "Tag, card, braccialetti e lettori NFC",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://shopnfc.bitora.it",
  legalName: "Bitora di Denis Cazzulo",
  vat: "13359170019",
  email: "info@bitora.it",
  phone: "351 497 9670",
  phoneTel: "+393514979670",
  whatsapp: "393514979670",
  addressLine: "Carmagnola",
  addressCity: "10022 Carmagnola (TO)",
  mapsQuery: "Bitora+Carmagnola+TO",
  bankHolder: "Bitora di Denis Cazzulo",
  logo: "/bitora.png",
  parentUrl: "https://bitora.it",
  parentName: "bitora.it",
} as const;

export const BRANDS = [
  "NXP NTAG",
  "MIFARE",
  "DESFire",
  "ICODE",
  "Fudan",
] as const;
