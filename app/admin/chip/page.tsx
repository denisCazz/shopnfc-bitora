import { getChips } from "@/app/admin/actions/chips";
import ChipsClient from "./ChipsClient";
import { Cpu } from "lucide-react";
import ExportExcelButton from "@/components/admin/ExportExcelButton";

export default async function ChipAdminPage() {
  const chips = await getChips();

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
        <ExportExcelButton href="/api/admin/export/chip" label="Scarica Excel" />
      </div>

      <ChipsClient initialChips={chips} />
    </div>
  );
}
