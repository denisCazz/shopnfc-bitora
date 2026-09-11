import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Shop NFC — Bitora",
    short_name: "Shop NFC",
    description: "Tag, tessere, braccialetti e lettori NFC. Programmazione inclusa.",
    start_url: "/",
    display: "standalone",
    background_color: "#f1f5f9",
    theme_color: "#64748b",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
