import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getDb } from "@/db";
import { profiles, appUsers } from "@/db/schema";
import { desc, eq, ilike, and, or, type SQL } from "drizzle-orm";
import { getUser } from "@/lib/auth";
import type { UserRole } from "@/lib/types";

export async function GET(request: Request) {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return new NextResponse("Non autorizzato", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q") || "";
  const roleFilter = searchParams.get("role") || "";

  const db = getDb();
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

  const query = db
    .select({
      id: profiles.id,
      email: profiles.email,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      role: profiles.role,
      company: profiles.company,
      phone: profiles.phone,
      createdAt: profiles.createdAt,
      emailVerifiedAt: appUsers.emailVerifiedAt,
    })
    .from(profiles)
    .leftJoin(appUsers, eq(appUsers.id, profiles.id))
    .orderBy(desc(profiles.createdAt));

  const rows = whereClause ? await query.where(whereClause) : await query;

  const data = rows.map((u) => ({
    ID: u.id,
    Email: u.email,
    Nome: u.firstName || "",
    Cognome: u.lastName || "",
    Azienda: u.company || "",
    Telefono: u.phone || "",
    Ruolo: u.role,
    "Email verificata": u.emailVerifiedAt ? "Sì" : "No",
    "Data registrazione": u.createdAt
      ? new Date(u.createdAt).toLocaleDateString("it-IT")
      : "",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Utenti");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="utenti.xlsx"`,
    },
  });
}
