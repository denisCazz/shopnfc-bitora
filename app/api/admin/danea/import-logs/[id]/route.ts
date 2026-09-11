import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { daneaImportLogs } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { getDaneaImportLogFilePath } from "@/lib/danea-import-log-file";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return new NextResponse("Non autorizzato", { status: 401 });
  }

  const { id } = await context.params;
  const logId = Number.parseInt(id, 10);
  if (!Number.isFinite(logId) || logId <= 0) {
    return new NextResponse("ID log non valido", { status: 400 });
  }

  const db = getDb();
  const [row] = await db
    .select({ id: daneaImportLogs.id, createdAt: daneaImportLogs.createdAt })
    .from(daneaImportLogs)
    .where(eq(daneaImportLogs.id, logId))
    .limit(1);

  if (!row) {
    return new NextResponse("Log non trovato", { status: 404 });
  }

  try {
    const file = await readFile(getDaneaImportLogFilePath(row.id), "utf8");
    const safeDate = row.createdAt.toISOString().replace(/[:.]/g, "-");
    return new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="danea-import-${row.id}-${safeDate}.txt"`,
      },
    });
  } catch {
    return new NextResponse("File log non trovato", { status: 404 });
  }
}
