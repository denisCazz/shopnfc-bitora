import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import {
  deleteGraphicFile,
  saveOrderGraphic,
  validateCustomGraphic,
} from "@/lib/custom-graphic";
import { sendCustomGraphicUploadedAdminNotification } from "@/lib/email";
import { SITE } from "@/lib/site";

const LOCKED_STATUSES = new Set(["shipped", "delivered", "cancelled"]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const orderId = parseInt(id, 10);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return NextResponse.json({ error: "Ordine non valido" }, { status: 400 });
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const db = getDb();
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) {
    return NextResponse.json({ error: "Ordine non trovato" }, { status: 404 });
  }

  const isAdmin = session.user?.role === "admin";
  const isOwner = order.userId === userId;
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  if (LOCKED_STATUSES.has(order.status)) {
    return NextResponse.json(
      { error: "Non è più possibile modificare la grafica di questo ordine." },
      { status: 400 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const accepted = formData.get("disclaimerAccepted") === "true";
  if (!accepted) {
    return NextResponse.json(
      {
        error:
          "Devi confermare che la grafica è di alta qualità e che Shop NFC non è responsabile per file di bassa qualità.",
      },
      { status: 400 }
    );
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File mancante" }, { status: 400 });
  }

  const validated = await validateCustomGraphic(file);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: validated.status });
  }

  const saved = await saveOrderGraphic(orderId, validated.graphic);
  await deleteGraphicFile(order.customGraphicUrl);

  await db
    .update(orders)
    .set({
      customGraphicUrl: saved.url,
      customGraphicOriginalName: saved.originalName,
      customGraphicDisclaimerAcceptedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  const shipping = order.shippingAddress as Record<string, string> | null;
  await sendCustomGraphicUploadedAdminNotification({
    orderId,
    customerName: shipping?.name || order.guestEmail || "Cliente",
    graphicUrl: `${SITE.url}${saved.url}`,
    originalName: saved.originalName,
  });

  return NextResponse.json({
    url: saved.url,
    originalName: saved.originalName,
    kind: validated.graphic.kind,
  });
}
