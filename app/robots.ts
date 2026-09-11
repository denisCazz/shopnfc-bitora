import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = SITE.url.replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/auth/",
          "/checkout",
          "/account/",
          "/login",
          "/register",
          "/recupera-password",
          "/reimposta-password",
          "/ordine/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
