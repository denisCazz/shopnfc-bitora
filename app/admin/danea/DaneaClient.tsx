"use client";

import { useState } from "react";
import { Check, Copy, Download, Link2 } from "lucide-react";
import type { DaneaLogRow, DaneaOrdersExportLogRow } from "@/app/admin/actions/danea";

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-1">
      <span className="text-xs font-medium text-muted">{label}</span>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
        <code className="text-xs break-all flex-1 min-w-0">{value}</code>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="shrink-0 p-1.5 rounded-md hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
          title="Copia"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}

function fmtStats(s: NonNullable<DaneaLogRow["stats"]>) {
  return `creati ${s.created}, agg. ${s.updated}, disatt. full ${s.deactivatedFull}, elim. ${s.deactivatedDeleted}, saltati ${s.skipped}`;
}

export default function DaneaClient({
  baseUrl,
  initialLogs,
  initialOrdersLogs,
}: {
  baseUrl: string;
  initialLogs: DaneaLogRow[];
  initialOrdersLogs: DaneaOrdersExportLogRow[];
}) {
  const ordersUrl = `${baseUrl}/api/danea/orders`;
  const productsUrl = `${baseUrl}/api/danea/products`;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Danea / Easyfatt</h1>
        <p className="text-sm text-muted mt-1">
          URL da configurare in Easyfatt (stesso Basic Auth:{" "}
          <code className="text-xs bg-surface px-1 rounded">DANEA_API_USER</code> /{" "}
          <code className="text-xs bg-surface px-1 rounded">DANEA_API_PASSWORD</code>
          ).
        </p>
      </div>

      <section className="rounded-xl border border-border bg-surface p-4 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Link2 className="w-4 h-4 text-accent" />
          Endpoint
        </h2>
        <div className="grid gap-4 sm:grid-cols-1">
          <CopyField label="Import ordini (GET, XML)" value={ordersUrl} />
          <CopyField label="Aggiornamento catalogo (POST multipart file)" value={productsUrl} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-3">Ultimi export ordini</h2>
        {initialOrdersLogs.length === 0 ? (
          <p className="text-sm text-muted rounded-lg border border-dashed border-border px-4 py-8 text-center">
            Nessun log ancora. Comparirà qui dopo la prima sincronizzazione ordini da Easyfatt.
          </p>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-stone-100 dark:bg-stone-800/80 text-muted text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-3 py-2 font-medium">Data</th>
                    <th className="px-3 py-2 font-medium">Esito</th>
                    <th className="px-3 py-2 font-medium">Ordini</th>
                    <th className="px-3 py-2 font-medium">Filtro date</th>
                    <th className="px-3 py-2 font-medium">ID ordini</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {initialOrdersLogs.map((row) => (
                    <tr key={row.id} className="hover:bg-surface-hover/50">
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        {new Date(row.createdAt).toLocaleString("it-IT", {
                          dateStyle: "short",
                          timeStyle: "medium",
                        })}
                      </td>
                      <td className="px-3 py-2">
                        {row.success ? (
                          <span className="text-green-700 dark:text-green-400 font-medium">OK</span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400 font-medium">Errore</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs font-medium">
                        {row.orderCount}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted whitespace-nowrap">
                        {row.firstdate || row.lastdate
                          ? `${row.firstdate ?? "—"} → ${row.lastdate ?? "—"}`
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted max-w-xs truncate">
                        {row.orderIds && row.orderIds.length > 0
                          ? row.orderIds.join(", ")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-3">Ultime importazioni catalogo</h2>
        {initialLogs.length === 0 ? (
          <p className="text-sm text-muted rounded-lg border border-dashed border-border px-4 py-8 text-center">
            Nessun log ancora. Dopo il primo invio da Easyfatt (Aggiorna articoli) compare qui.
          </p>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-stone-100 dark:bg-stone-800/80 text-muted text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-3 py-2 font-medium">Data</th>
                    <th className="px-3 py-2 font-medium">Esito</th>
                    <th className="px-3 py-2 font-medium">Modalità</th>
                    <th className="px-3 py-2 font-medium">XML</th>
                    <th className="px-3 py-2 font-medium">Dettaglio</th>
                    <th className="px-3 py-2 font-medium">Log</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {initialLogs.map((row) => (
                    <tr key={row.id} className="hover:bg-surface-hover/50">
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        {new Date(row.createdAt).toLocaleString("it-IT", {
                          dateStyle: "short",
                          timeStyle: "medium",
                        })}
                      </td>
                      <td className="px-3 py-2">
                        {row.success ? (
                          <span className="text-green-700 dark:text-green-400 font-medium">OK</span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400 font-medium">Errore</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted">
                        {row.mode ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted whitespace-nowrap">
                        {row.xmlBytes != null
                          ? `${(row.xmlBytes / 1024).toFixed(1)} KB`
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-xs max-w-md">
                        {row.success && row.stats ? (
                          <span className="text-muted">{fmtStats(row.stats)}</span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400 break-words">
                            {row.message ?? "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs whitespace-nowrap">
                        {row.hasLogFile ? (
                          <a
                            href={`/api/admin/danea/import-logs/${row.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-foreground hover:bg-surface-hover transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            TXT
                          </a>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
