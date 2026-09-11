import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { uploadToR2 } from "@/lib/r2";
import { verifyPayload } from "@/lib/signed-payload";
import { sendReceiptUploadedAdminNotification } from "@/lib/email";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
];
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
  "application/pdf": ".pdf",
};

interface ReceiptToken {
  orderId: number;
  scope: "receipt";
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const orderId = parseInt(id, 10);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return NextResponse.json({ error: "Ordine non valido" }, { status: 400 });
  }

  const db = getDb();
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) {
    return NextResponse.json({ error: "Ordine non trovato" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const token = formData.get("token") as string | null;

  // --- Authorization: logged-in owner OR valid signed receipt token ---
  const session = await auth();
  const userId = session?.user?.id;
  const isOwner = !!userId && order.userId === userId;

  let tokenValid = false;
  if (!isOwner && token) {
    const payload = verifyPayload<ReceiptToken>(token);
    tokenValid =
      !!payload && payload.scope === "receipt" && payload.orderId === orderId;
  }

  if (!isOwner && !tokenValid) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  if (order.paymentMethod !== "bank_transfer") {
    return NextResponse.json(
      { error: "La contabile è richiesta solo per ordini con bonifico" },
      { status: 400 }
    );
  }

  if (!file) {
    return NextResponse.json({ error: "File mancante" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Formato non supportato. Usa JPG, PNG, WebP o PDF." },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File troppo grande. Massimo 10 MB." },
      { status: 400 }
    );
  }

  if (!process.env.R2_ACCOUNT_ID) {
    return NextResponse.json(
      { error: "Storage non configurato" },
      { status: 500 }
    );
  }

  const ext = EXT_BY_TYPE[file.type] || ".bin";
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const r2Key = `receipts/${orderId}/${safeName}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  let receiptUrl: string;
  try {
    receiptUrl = await uploadToR2(r2Key, Buffer.from(bytes), file.type);
  } catch (err) {
    console.error("Receipt upload to R2 failed:", err);
    return NextResponse.json(
      { error: "Errore durante il caricamento" },
      { status: 500 }
    );
  }

  await db
    .update(orders)
    .set({ bankTransferReceiptUrl: receiptUrl, updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  // Notify admin (non-blocking failure)
  const shipping = order.shippingAddress as Record<string, string> | null;
  await sendReceiptUploadedAdminNotification({
    orderId,
    customerName: shipping?.name || order.guestEmail || "Cliente",
    receiptUrl,
  });

  return NextResponse.json({ url: receiptUrl });
}
