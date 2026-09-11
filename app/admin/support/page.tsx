import Link from "next/link";
import { ExternalLink, Phone, Clock } from "lucide-react";

const CONTATTI_URL = "https://bitora.it/contattaci";
const PHONE_DISPLAY = "+39 351 497 9670";
const PHONE_TEL = "+393514979670";

export const metadata = {
  title: "Supporto | Admin",
};

export default function AdminSupportPage() {
  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Supporto</h1>
        <p className="text-sm text-muted mt-1">
          Per assistenza sul sito, sull&apos;integrazione o problemi tecnici contatta Bitora.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 space-y-5">
        <div className="flex gap-3">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center">
            <ExternalLink className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Sito web</h2>
            <Link
              href={CONTATTI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline inline-flex items-center gap-1 mt-1"
            >
              bitora.it/contattaci
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </Link>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center">
            <Phone className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Telefono</h2>
            <a
              href={`tel:${PHONE_TEL}`}
              className="text-lg font-medium text-foreground hover:text-accent mt-1 inline-block"
            >
              {PHONE_DISPLAY}
            </a>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center">
            <Clock className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Orari</h2>
            <p className="text-muted mt-1">Lunedì–sabato, 8:00–19:00</p>
          </div>
        </div>
      </div>
    </div>
  );
}
