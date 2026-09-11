"use client";

import { useState } from "react";
import { Download } from "lucide-react";

export default function ExportExcelButton({
  href,
  label = "Scarica Excel",
}: {
  href: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(href);
      if (!res.ok) throw new Error("Errore durante l'esportazione");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="([^"]+)"/);
      a.download = match ? match[1] : "export.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Errore durante il download del file Excel.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface text-sm font-medium text-foreground hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors disabled:opacity-50"
    >
      <Download className="w-4 h-4 text-accent" />
      {loading ? "Download..." : label}
    </button>
  );
}
