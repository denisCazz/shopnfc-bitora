import { desc, eq, getTableColumns } from "drizzle-orm";
import { getDb } from "@/db";
import { dealerProfiles, profiles } from "@/db/schema";
import DealerActions from "./DealerActions";
import ExportExcelButton from "@/components/admin/ExportExcelButton";

export default async function AdminDealersPage() {
  const db = getDb();
  const rows = await db
    .select({
      ...getTableColumns(dealerProfiles),
      email: profiles.email,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      phone: profiles.phone,
      addressLine1: profiles.addressLine1,
      city: profiles.city,
      province: profiles.province,
      postalCode: profiles.postalCode,
      country: profiles.country,
    })
    .from(dealerProfiles)
    .innerJoin(profiles, eq(dealerProfiles.id, profiles.id))
    .orderBy(desc(dealerProfiles.createdAt));

  const dealers = rows.map((r) => ({
    id: r.id,
    company_name: r.companyName,
    vat_number: r.vatNumber,
    status: r.status,
    discount_percent: r.discountPercent,
    rejection_reason: r.rejectionReason,
    created_at: r.createdAt.toISOString(),
    approved_at: r.approvedAt?.toISOString() ?? null,
    profiles: {
      email: r.email,
      first_name: r.firstName,
      last_name: r.lastName,
      phone: r.phone,
      address_line1: r.addressLine1,
      city: r.city,
      province: r.province,
      postal_code: r.postalCode,
      country: r.country,
    },
  }));

  const pending = dealers.filter((d) => d.status === "pending");
  const approved = dealers.filter((d) => d.status === "approved");
  const rejected = dealers.filter((d) => d.status === "rejected");

  const statusColors = {
    pending: "bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700",
    approved: "bg-green-50 dark:bg-green-950/40 text-green-700",
    rejected: "bg-red-50 dark:bg-red-950/40 text-red-700",
  };

  const statusLabels = {
    pending: "In attesa",
    approved: "Approvato",
    rejected: "Rifiutato",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dealer</h1>
          <p className="text-sm text-muted mt-1">
            {pending.length} in attesa · {approved.length} approvati · {rejected.length} rifiutati
          </p>
        </div>
        <ExportExcelButton href="/api/admin/export/dealers" label="Scarica Excel" />
      </div>

      {pending.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            Richieste in attesa ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((dealer) => {
              const profile = dealer.profiles;
              return (
                <div
                  key={dealer.id}
                  className="bg-surface border-2 border-yellow-200 dark:border-yellow-800 rounded-2xl p-5"
                >
                  {/* Colonna unica: il form Modifica è w-full; affiancarlo in flex-row stretta causava overflow/sovrapposizione */}
                  <div className="flex flex-col gap-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground text-base">
                        {dealer.company_name}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-2 text-sm text-muted">
                        <div>P.IVA: {dealer.vat_number}</div>
                        <div>Email: {profile?.email ?? "—"}</div>
                        <div>
                          Nome:{" "}
                          {[profile?.first_name, profile?.last_name]
                            .filter(Boolean)
                            .join(" ") || "—"}
                        </div>
                        <div>Tel: {profile?.phone || "—"}</div>
                        <div>
                          Data:{" "}
                          {new Date(dealer.created_at).toLocaleDateString("it-IT")}
                        </div>
                      </div>
                    </div>
                    <div className="w-full min-w-0 shrink-0">
                      <DealerActions
                        dealer={{
                          id: dealer.id,
                          company_name: dealer.company_name,
                          vat_number: dealer.vat_number,
                          status: dealer.status,
                          discount_percent: dealer.discount_percent,
                          profiles: profile,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-stone-50/50 dark:bg-stone-800/30">
                <th className="text-left py-3 px-4 font-medium text-muted">Azienda</th>
                <th className="text-left py-3 px-4 font-medium text-muted hidden md:table-cell">P.IVA</th>
                <th className="text-left py-3 px-4 font-medium text-muted hidden sm:table-cell">Email</th>
                <th className="text-left py-3 px-4 font-medium text-muted">Stato</th>
                <th className="text-left py-3 px-4 font-medium text-muted hidden lg:table-cell">Sconto</th>
                <th className="text-left py-3 px-4 font-medium text-muted hidden lg:table-cell">Data</th>
                <th className="text-left py-3 px-4 font-medium text-muted">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {[...pending, ...approved, ...rejected].map((dealer) => {
                const profile = dealer.profiles;
                return (
                  <tr
                    key={dealer.id}
                    className="border-b border-border last:border-0 hover:bg-stone-50/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-foreground">
                      {dealer.company_name}
                    </td>
                    <td className="py-3 px-4 text-muted hidden md:table-cell">
                      {dealer.vat_number}
                    </td>
                    <td className="py-3 px-4 text-muted hidden sm:table-cell">
                      {profile?.email ?? "—"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                          statusColors[dealer.status as keyof typeof statusColors]
                        }`}
                      >
                        {statusLabels[dealer.status as keyof typeof statusLabels]}
                      </span>
                    </td>
                    <td className="py-3 px-4 tabular-nums hidden lg:table-cell">
                      {dealer.discount_percent}%
                    </td>
                    <td className="py-3 px-4 text-muted tabular-nums hidden lg:table-cell">
                      {new Date(dealer.created_at).toLocaleDateString("it-IT")}
                    </td>
                    <td className="py-3 px-4 align-top min-w-[16rem] max-w-md">
                      <DealerActions
                        dealer={{
                          id: dealer.id,
                          company_name: dealer.company_name,
                          vat_number: dealer.vat_number,
                          status: dealer.status,
                          discount_percent: dealer.discount_percent,
                          profiles: profile,
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {dealers.length === 0 && (
          <div className="py-12 text-center text-muted">
            Nessun dealer registrato.
          </div>
        )}
      </div>
    </div>
  );
}
