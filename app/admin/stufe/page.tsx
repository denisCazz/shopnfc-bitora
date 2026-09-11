import { getStoves } from "@/app/admin/actions/stoves";
import StovesClient from "./StovesClient";
import { Cpu } from "lucide-react";
import ExportExcelButton from "@/components/admin/ExportExcelButton";

export default async function StovePage() {
  const stoves = await getStoves();

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Chip NFC</h1>
            <p className="text-sm text-muted mt-0.5">Gestisci i chip da associare ai prodotti del catalogo</p>
          </div>
        </div>
        <ExportExcelButton href="/api/admin/export/stufe" label="Scarica Excel" />
      </div>

      <StovesClient initialStoves={stoves} />
    </div>
  );
}
