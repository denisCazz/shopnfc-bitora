"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const UMAMI_WEBSITE_ID = "92a43f68-efe0-42d0-acd4-88c198507cf1";

export default function UmamiAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("cookie_consent") === "1") {
      setEnabled(true);
    }

    const onConsent = () => setEnabled(true);
    window.addEventListener("cookie-consent-accepted", onConsent);
    return () => window.removeEventListener("cookie-consent-accepted", onConsent);
  }, []);

  if (!enabled) return null;

  return (
    <Script
      src="https://umami.bitora.it/script.js"
      data-website-id={UMAMI_WEBSITE_ID}
      strategy="afterInteractive"
    />
  );
}
