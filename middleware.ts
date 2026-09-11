import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const COUNTRY_CURRENCY: Record<string, string> = {
  GB: "GBP",
  US: "USD",
};

const LANG_MAP: Record<string, string> = {
  it: "it",
  en: "en",
  fr: "fr",
  es: "es",
};

function detectLocale(acceptLang: string | null): string | null {
  if (!acceptLang) return null;
  const parts = acceptLang.split(",").map((p) => {
    const [lang, qStr] = p.trim().split(";q=");
    return { lang: lang.trim().toLowerCase(), q: qStr ? parseFloat(qStr) : 1 };
  });
  parts.sort((a, b) => b.q - a.q);
  for (const { lang } of parts) {
    const prefix = lang.split("-")[0];
    if (LANG_MAP[prefix]) return LANG_MAP[prefix];
  }
  return null;
}

function applyLocaleCookie(request: NextRequest, response: NextResponse) {
  const hasPrefs = request.cookies.has("shopnfc_detected");
  const hasManualPrefs = request.cookies.has("shopnfc_locale_set");

  if (!hasPrefs && !hasManualPrefs) {
    const acceptLang = request.headers.get("accept-language");
    const country = request.headers.get("x-vercel-ip-country") || "";
    const detectedLocale = detectLocale(acceptLang) || "it";
    const detectedCurrency = COUNTRY_CURRENCY[country] || "EUR";
    response.cookies.set(
      "shopnfc_detected",
      JSON.stringify({
        locale: detectedLocale,
        currency: detectedCurrency,
      }),
      {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      }
    );
  }
  return response;
}

export default auth((request) => {
  const { auth: session, nextUrl } = request;
  const path = nextUrl.pathname;
  const response = NextResponse.next();

  if (path.startsWith("/admin")) {
    if (!session?.user) {
      const url = nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", path);
      return applyLocaleCookie(request, NextResponse.redirect(url));
    }
    if (session.user.role !== "admin") {
      const url = nextUrl.clone();
      url.pathname = "/";
      return applyLocaleCookie(request, NextResponse.redirect(url));
    }
  }

  if (path.startsWith("/dealer")) {
    if (!session?.user) {
      const url = nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", path);
      return applyLocaleCookie(request, NextResponse.redirect(url));
    }
    if (session.user.role !== "dealer" && session.user.role !== "admin") {
      const url = nextUrl.clone();
      url.pathname = "/";
      return applyLocaleCookie(request, NextResponse.redirect(url));
    }
  }

  if (path.startsWith("/account")) {
    if (!session?.user) {
      const url = nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", path);
      return applyLocaleCookie(request, NextResponse.redirect(url));
    }
  }

  return applyLocaleCookie(request, response);
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/danea|api/health|api/stripe|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
