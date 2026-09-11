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
  { id: 6, name: "Motoriduttori", slug: "motoriduttori", icon: "Cog" },
  { id: 7, name: "Ventilatori Fumi", slug: "ventilatori-fumi", icon: "Wind" },
  { id: 8, name: "Ventilatori Aria", slug: "ventilatori-aria", icon: "Fan" },
  { id: 9, name: "Resistenze Accensione", slug: "resistenze-accensione", icon: "Zap" },
  { id: 10, name: "Display, Cavi, Telecomandi", slug: "display-cavi-telecomandi", icon: "Monitor" },
  { id: 11, name: "Schede Elettroniche e Sensori", slug: "schede-elettroniche-sensori", icon: "Cpu" },
  { id: 12, name: "Bracieri e Camere Combustione", slug: "bracieri-camere-combustione", icon: "Flame" },
  { id: 13, name: "Sonde, Depressori, Termostati", slug: "sonde-depressori-termostati", icon: "Thermometer" },
  { id: 14, name: "Guarnizioni e Silicone Alta Temp.", slug: "guarnizioni-silicone", icon: "CircleDot" },
  { id: 16, name: "Coclee", slug: "coclee", icon: "RotateCw" },
  { id: 17, name: "Stufe a Pellet", slug: "stufe-a-pellet", icon: "Home" },
  { id: 18, name: "Porta Pellet e Aspiracenere", slug: "porta-pellet-aspiracenere", icon: "Package" },
  { id: 19, name: "Pompe e Sensori", slug: "pompe-sensori", icon: "Gauge" },
  { id: 20, name: "Accessori", slug: "accessori", icon: "Wrench" },
];
