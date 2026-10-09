import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { verifyPayload } from "@/lib/signed-payload";
import {
  MIME_BY_EXT,
  privateOrderFilePath,
  type PrivateOrderFileKind,
} from "@/lib/private-storage";

export const dynamic = "force-dynamic";

const KINDS: PrivateOrderFileKind[] = ["graphics", "receipts"];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ kind: string; orderId: string; file: string }> }
) {
  const { kind, orderId: rawId, file } = await params;
  const orderId = Number(rawId);
  if (!KINDS.includes(kind as PrivateOrderFileKind)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const filePath = privateOrderFilePath(kind as PrivateOrderFileKind, orderId, file);
  if (!filePath) return new NextResponse("Not found", { status: 404 });

  const user = await getUser();
  let allowed = user?.role === "admin";

  if (!allowed && user) {
    const [order] = await getDb()
      .select({ userId: orders.userId })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    allowed = !!order && order.userId === user.id;
  }

  if (!allowed && kind === "receipts") {
    const token = req.nextUrl.searchParams.get("t");
    const payload = token ? verifyPayload<{ orderId: number; scope: string }>(token) : null;
    allowed = !!payload && payload.scope === "receipt" && payload.orderId === orderId;
  }

  if (!allowed) {
    if (user) return new NextResponse("Forbidden", { status: 403 });
    const login = new URL("/login", req.nextUrl.origin);
    login.searchParams.set("redirect", req.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  let bytes: Buffer;
  try {
    bytes = await readFile(filePath);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": MIME_BY_EXT[path.extname(file)] ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${file}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex",
    },
  });
}
