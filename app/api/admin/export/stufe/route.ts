import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getDb } from "@/db";
import { stoves } from "@/db/schema";
import { asc } from "drizzle-orm";
import { getUser } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return new NextResponse("Non autorizzato", { status: 401 });
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(stoves)
    .orderBy(asc(stoves.sortOrder), asc(stoves.nameIt));

  const data = rows.map((s) => ({
    ID: s.id,
    Modello: s.nameIt,
    "Nome EN": s.nameEn || "",
    "Nome FR": s.nameFr || "",
    "Nome ES": s.nameEs || "",
    Slug: s.slug,
    Categoria: s.categoria || "",
    Potenza: s.potenza || "",
    Dimensioni: s.dimensioni || "",
    Peso: s.peso || "",
    Attivo: s.active ? "Sì" : "No",
    Ordine: s.sortOrder,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Stufe");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="stufe.xlsx"`,
    },
  });
}
