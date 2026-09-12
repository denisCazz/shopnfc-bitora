import { TicketPercent } from "lucide-react";
import { getDiscountCodes } from "@/app/admin/actions/discounts";
import ScontiClient from "./ScontiClient";

export default async function AdminScontiPage() {
  const items = await getDiscountCodes();

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center">
          <TicketPercent className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Codici sconto</h1>
          <p className="text-sm text-muted mt-0.5">
            {items.length} {items.length === 1 ? "codice" : "codici"} · applicabili al checkout
          </p>
        </div>
      </div>

      <ScontiClient initialItems={items} />
    </div>
  );
}
