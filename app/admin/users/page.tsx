import {
  and,
  count,
  desc,
  eq,
  ilike,
  or,
  type SQL,
} from "drizzle-orm";
import Link from "next/link";
import { getDb } from "@/db";
import { profiles, appUsers, dealerProfiles } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { Search } from "lucide-react";
import UserRoleSelect from "./UserRoleSelect";
import CreateUserModal from "./CreateUserModal";
import VerifyEmailButton from "./VerifyEmailButton";
import DeleteUserButton from "./DeleteUserButton";
import type { UserRole } from "@/lib/types";
import ExportExcelButton from "@/components/admin/ExportExcelButton";

const PAGE_SIZE = 30;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; role?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const search = params.q || "";
  const roleFilter = params.role || "";
  const offset = (page - 1) * PAGE_SIZE;

  const db = getDb();
  const admin = await getUser();
  const conds: SQL[] = [];
  if (search) {
    const t = `%${search}%`;
    conds.push(
      or(
        ilike(profiles.email, t),
        ilike(profiles.firstName, t),
        ilike(profiles.lastName, t),
        ilike(profiles.company, t)
      )!
    );
  }
  if (roleFilter) {
    conds.push(eq(profiles.role, roleFilter as UserRole));
  }
  const whereClause = conds.length ? and(...conds) : undefined;

  const countQuery = db.select({ n: count() }).from(profiles);
  const [countRes] = whereClause
    ? await countQuery.where(whereClause)
    : await countQuery;

  const userRows = whereClause
    ? await db
        .select({
          id: profiles.id,
          email: profiles.email,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
          role: profiles.role,
          company: profiles.company,
          vatNumber: profiles.vatNumber,
          phone: profiles.phone,
          createdAt: profiles.createdAt,
          emailVerifiedAt: appUsers.emailVerifiedAt,
          dealerStatus: dealerProfiles.status,
          dealerDiscount: dealerProfiles.discountPercent,
        })
        .from(profiles)
        .leftJoin(appUsers, eq(appUsers.id, profiles.id))
        .leftJoin(dealerProfiles, eq(dealerProfiles.id, profiles.id))
        .where(whereClause)
        .orderBy(desc(profiles.createdAt))
        .limit(PAGE_SIZE)
        .offset(offset)
    : await db
        .select({
          id: profiles.id,
          email: profiles.email,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
          role: profiles.role,
          company: profiles.company,
          vatNumber: profiles.vatNumber,
          phone: profiles.phone,
          createdAt: profiles.createdAt,
          emailVerifiedAt: appUsers.emailVerifiedAt,
          dealerStatus: dealerProfiles.status,
          dealerDiscount: dealerProfiles.discountPercent,
        })
        .from(profiles)
        .leftJoin(appUsers, eq(appUsers.id, profiles.id))
        .leftJoin(dealerProfiles, eq(dealerProfiles.id, profiles.id))
        .orderBy(desc(profiles.createdAt))
        .limit(PAGE_SIZE)
        .offset(offset);

  const totalCount = Number(countRes.n);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const buildPageHref = (targetPage: number) => {
    const sp = new URLSearchParams();
    if (search) sp.set("q", search);
    if (roleFilter) sp.set("role", roleFilter);
    sp.set("page", String(Math.min(Math.max(1, targetPage), totalPages)));
    return `?${sp.toString()}`;
  };

  const users = userRows.map((u) => ({
    id: u.id,
    email: u.email,
    first_name: u.firstName,
    last_name: u.lastName,
    role: u.role,
    company: u.company,
    vat_number: u.vatNumber,
    phone: u.phone,
    created_at: u.createdAt.toISOString(),
    emailVerified: !!u.emailVerifiedAt,
    dealer_status: u.dealerStatus,
    dealer_discount: u.dealerDiscount,
    dealer_profile_missing: u.role === "dealer" && !u.dealerStatus,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Utenti</h1>
        <div className="flex items-center gap-3">
          <ExportExcelButton
            href={`/api/admin/export/users${search || roleFilter ? `?q=${encodeURIComponent(search)}&role=${encodeURIComponent(roleFilter)}` : ""}`}
            label="Scarica Excel"
          />
          <CreateUserModal />
        </div>
      </div>
      <div className="bg-surface border border-border rounded-2xl p-4 mb-4">
        <form className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input
              type="text"
              name="q"
              defaultValue={search}
              placeholder="Cerca per email, nome, azienda..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-background border border-border text-sm"
            />
          </div>
          <select
            name="role"
            defaultValue={roleFilter}
            className="py-2 px-3 rounded-xl bg-background border border-border text-sm"
          >
            <option value="">Tutti i ruoli</option>
            <option value="customer">Cliente</option>
            <option value="dealer">Rivenditore</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-foreground text-white text-sm"
          >
            Filtra
          </button>
        </form>
      </div>
      <p className="text-sm text-muted mb-3">{totalCount} utenti</p>
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-stone-50/50">
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4 hidden md:table-cell">Nome</th>
                <th className="text-left py-3 px-4 hidden lg:table-cell">Azienda</th>
                <th className="text-left py-3 px-4">Ruolo</th>
                <th className="text-left py-3 px-4 hidden lg:table-cell">Sconto</th>
                <th className="text-left py-3 px-4">Email verificata</th>
                <th className="text-left py-3 px-4 hidden sm:table-cell">Data</th>
                <th className="text-left py-3 px-4">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-border last:border-0 hover:bg-stone-50/50"
                >
                  <td className="py-3 px-4 font-medium">{u.email}</td>
                  <td className="py-3 px-4 text-muted hidden md:table-cell">
                    {u.first_name} {u.last_name}
                  </td>
                  <td className="py-3 px-4 text-muted hidden lg:table-cell">
                    {u.company || "—"}
                  </td>
                  <td className="py-3 px-4">
                    <UserRoleSelect
                      userId={u.id}
                      currentRole={u.role as UserRole}
                      email={u.email}
                      company={u.company}
                      vatNumber={u.vat_number}
                      dealerProfileMissing={u.dealer_profile_missing}
                    />
                  </td>
                  <td className="py-3 px-4 hidden lg:table-cell">
                    {u.dealer_profile_missing ? (
                      <span className="text-xs text-amber-700 dark:text-amber-400">Profilo incompleto</span>
                    ) : u.dealer_status === "approved" ? (
                      <span className="text-xs font-medium text-green-700 dark:text-green-400">
                        {u.dealer_discount}%
                      </span>
                    ) : u.dealer_status === "pending" ? (
                      <span className="text-xs text-yellow-700 dark:text-yellow-400">In attesa</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {u.emailVerified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                        ✓ Sì
                      </span>
                    ) : (
                      <VerifyEmailButton userId={u.id} />
                    )}
                  </td>
                  <td className="py-3 px-4 text-muted text-xs hidden sm:table-cell">
                    {u.created_at.slice(0, 10)}
                  </td>
                  <td className="py-3 px-4">
                    {u.role !== "admin" && u.id !== admin?.id && (
                      <DeleteUserButton userId={u.id} email={u.email} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <p className="p-6 text-center text-muted">Nessun utente</p>
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <Link
            href={buildPageHref(page - 1)}
            aria-disabled={page <= 1}
            className={`px-3 py-1.5 rounded-lg border border-border text-sm ${
              page <= 1
                ? "pointer-events-none opacity-40"
                : "hover:bg-stone-50/50"
            }`}
          >
            ← Precedente
          </Link>
          <span className="text-sm text-muted">
            Pagina {page} / {totalPages}
          </span>
          <Link
            href={buildPageHref(page + 1)}
            aria-disabled={page >= totalPages}
            className={`px-3 py-1.5 rounded-lg border border-border text-sm ${
              page >= totalPages
                ? "pointer-events-none opacity-40"
                : "hover:bg-stone-50/50"
            }`}
          >
            Successiva →
          </Link>
        </div>
      )}
    </div>
  );
}
