import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getDb } from "@/db";
import { dealerProfiles, profiles } from "@/db/schema";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { getUser } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return new NextResponse("Non autorizzato", { status: 401 });
  }

  const db = getDb();
  const rows = await db
    .select({
      ...getTableColumns(dealerProfiles),
      email: profiles.email,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      phone: profiles.phone,
    })
    .from(dealerProfiles)
    .innerJoin(profiles, eq(dealerProfiles.id, profiles.id))
    .orderBy(desc(dealerProfiles.createdAt));

  const statusLabels: Record<string, string> = {
    pending: "In attesa",
    approved: "Approvato",
    rejected: "Rifiutato",
  };

  const data = rows.map((r) => ({
    ID: r.id,
    "Ragione sociale": r.companyName,
    "P.IVA": r.vatNumber,
    Email: r.email,
    Nome: r.firstName || "",
    Cognome: r.lastName || "",
    Telefono: r.phone || "",
    Stato: statusLabels[r.status] ?? r.status,
    "Sconto (%)": r.discountPercent,
    "Motivo rifiuto": r.rejectionReason || "",
    "Data richiesta": r.createdAt
      ? new Date(r.createdAt).toLocaleDateString("it-IT")
      : "",
    "Data approvazione": r.approvedAt
      ? new Date(r.approvedAt).toLocaleDateString("it-IT")
      : "",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dealer");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="dealer.xlsx"`,
    },
  });
}
