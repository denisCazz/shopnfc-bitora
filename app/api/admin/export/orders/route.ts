import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getDb } from "@/db";
import { orders, orderItems, profiles } from "@/db/schema";
import { desc, eq, and, inArray, type SQL } from "drizzle-orm";
import { getUser } from "@/lib/auth";
import type { OrderStatus } from "@/lib/types";
import { formatOrderNumber } from "@/lib/order-number";

export async function GET(request: Request) {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return new NextResponse("Non autorizzato", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status") || "";

  const db = getDb();
  const conds: SQL[] = [];
  if (statusFilter && statusFilter !== "all") {
    conds.push(eq(orders.status, statusFilter as OrderStatus));
  }
  const whereClause = conds.length ? and(...conds) : undefined;

  const orderRows = whereClause
    ? await db.select().from(orders).where(whereClause).orderBy(desc(orders.id))
    : await db.select().from(orders).orderBy(desc(orders.id));

  const orderIds = orderRows.map((o) => o.id);
  const itemRows =
    orderIds.length > 0
      ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds))
      : [];

  const userIds = orderRows.map((o) => o.userId).filter((id): id is string => !!id);
  let profileMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const profs = await db
      .select({ id: profiles.id, email: profiles.email })
      .from(profiles)
      .where(inArray(profiles.id, userIds));
    profileMap = Object.fromEntries(profs.map((p) => [p.id, p.email]));
  }

  // One row per order
  const data = orderRows.map((o) => {
    const items = itemRows.filter((i) => i.orderId === o.id);
    const addr = o.shippingAddress as Record<string, unknown>;
    return {
      "ID Ordine": formatOrderNumber(o.id),
      "Data": new Date(o.createdAt).toLocaleDateString("it-IT"),
      "Email cliente": profileMap[o.userId ?? ""] ?? o.guestEmail ?? "",
      "Stato": o.status,
      "Pagamento": o.paymentMethod ?? "",
      "Stato pagamento": o.paymentStatus,
      "Subtotale (€)": Number(o.subtotal),
      "Spedizione (€)": Number(o.shippingCost),
      "IVA (€)": Number(o.taxAmount),
      "Totale (€)": Number(o.total),
      "Articoli": items.map((i) => `${i.productName} x${i.quantity}`).join("; "),
      "N. tracking": o.trackingNumber ?? "",
      "Indirizzo spedizione": [addr.address, addr.city, addr.zip, addr.country]
        .filter(Boolean)
        .join(", "),
      "Note": o.notes ?? "",
      "Esportato Danea": o.daneaExported ? "Sì" : "No",
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ordini");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="ordini.xlsx"`,
    },
  });
}
