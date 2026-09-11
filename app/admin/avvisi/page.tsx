import { Megaphone } from "lucide-react";
import { getAnnouncements } from "@/app/admin/actions/announcements";
import AvvisiClient from "./AvvisiClient";

export default async function AdminAvvisiPage() {
  const items = await getAnnouncements();

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center">
          <Megaphone className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Avvisi</h1>
          <p className="text-sm text-muted mt-0.5">
            {items.length} avvisi · popup per utenti e/o admin
          </p>
        </div>
      </div>

      <AvvisiClient initialItems={items} />
    </div>
  );
}
