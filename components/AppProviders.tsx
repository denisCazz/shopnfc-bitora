"use client";

import type { ReactNode } from "react";
import { CartProvider } from "@/lib/cart-context";
import { LocaleProvider } from "@/lib/locale-context";
import { ThemeProvider } from "@/lib/theme-context";
import { UserProvider } from "@/lib/user-context";
import CartDrawer from "@/components/CartDrawer";
import CookieBanner from "@/components/CookieBanner";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import UmamiAnalytics from "@/components/UmamiAnalytics";
import ScrollToTop from "@/components/ScrollToTop";
import QuoteFab from "@/components/QuoteFab";
import AnnouncementPopup from "@/components/AnnouncementPopup";

/** Single client boundary so context providers share one module graph / React tree reliably. */
export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <UserProvider>
          <CartProvider>
            {children}
            <CartDrawer />
            <ScrollToTop />
            <QuoteFab />
            <CookieBanner />
            <AnnouncementPopup />
            <GoogleAnalytics />
            <UmamiAnalytics />
          </CartProvider>
        </UserProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
