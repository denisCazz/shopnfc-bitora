import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getDb } from "@/db";
import { products, categories } from "@/db/schema";
import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { getUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return new NextResponse("Non autorizzato", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q") || "";
  const categoryFilter = searchParams.get("category") || "";

  const db = getDb();
  const conds: SQL[] = [];
  if (search) {
    const t = `%${search}%`;
    conds.push(or(ilike(products.nameIt, t), ilike(products.sku, t))!);
  }
  if (categoryFilter) {
    conds.push(eq(products.categoryId, parseInt(categoryFilter, 10)));
  }
  const whereClause = conds.length ? and(...conds) : undefined;

  const query = db
    .select({
      id: products.id,
      nameIt: products.nameIt,
      slug: products.slug,
      sku: products.sku,
      price: products.price,
      wholesalePrice: products.wholesalePrice,
      stockQuantity: products.stockQuantity,
      active: products.active,
      catName: categories.nameIt,
      descriptionIt: products.descriptionIt,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(desc(products.id));

  const rows = whereClause ? await query.where(whereClause) : await query;

  const data = rows.map((p) => ({
    ID: p.id,
    SKU: p.sku || "",
    "Nome IT": p.nameIt,
    Slug: p.slug,
    Categoria: p.catName || "",
    "Prezzo (€)": p.price != null ? Number(p.price) : "",
    "Prezzo ingrosso (€)": p.wholesalePrice != null ? Number(p.wholesalePrice) : "",
    Quantità: p.stockQuantity ?? "",
    Attivo: p.active ? "Sì" : "No",
    Descrizione: p.descriptionIt || "",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Prodotti");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="prodotti.xlsx"`,
    },
  });
}
