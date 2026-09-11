import { Suspense } from "react";
import Footer from "@/components/Footer";
import CheckoutClient from "./CheckoutClient";

export default function CheckoutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="max-w-6xl mx-auto px-4 py-10 text-sm text-muted">
              Caricamento checkout…
            </div>
          }
        >
          <CheckoutClient />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
