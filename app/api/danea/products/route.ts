import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { daneaImportLogs } from "@/db/schema";
import { writeDaneaImportLogFile } from "@/lib/danea-import-log-file";
import { syncEasyfattCatalog } from "@/lib/danea-import";
import { revalidateCatalog } from "@/lib/revalidate-catalog";

/**
 * Danea Easyfatt catalog import.
 * POST: multipart/form-data campo `file` (XML) — vedi
 * https://www.danea.it/software/easyfatt/ecommerce/integrazione/invio-prodotti/
 * Risposta testo: "OK" (Easyfatt mostra errore se non riceve OK).
 * GET: health check (stesso Basic Auth se env configurato).
 */

function checkDaneaBasicAuth(req: NextRequest): NextResponse | null {
  const apiUser = process.env.DANEA_API_USER;
  const apiPass = process.env.DANEA_API_PASSWORD;

  if (!apiUser || !apiPass) {
    return null;
  }

  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Basic ")) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Danea"' },
    });
  }

  const decoded = Buffer.from(auth.slice(6), "base64").toString("utf-8");
  const [user, pass] = decoded.split(":");

  if (user !== apiUser || pass !== apiPass) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Danea"' },
    });
  }

  return null;
}

async function readCatalogXml(req: NextRequest): Promise<string | null> {
  const ct = req.headers.get("content-type") ?? "";

  if (ct.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (file && typeof file !== "string" && "text" in file) {
      return await (file as Blob).text();
    }
    return null;
  }

  return await req.text();
}

export async function GET(req: NextRequest) {
  const deny = checkDaneaBasicAuth(req);
  if (deny) return deny;

  return NextResponse.json({
    ok: true,
    service: "danea-products",
    hint: "POST con multipart field=file (XML EasyfattProducts) o body XML",
  });
}

export async function POST(req: NextRequest) {
  const deny = checkDaneaBasicAuth(req);
  if (deny) return deny;

  let xml: string | null;
  try {
    xml = await readCatalogXml(req);
  } catch {
    return new NextResponse("Impossibile leggere il corpo della richiesta", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  if (!xml || !xml.trim()) {
    return new NextResponse("XML vuoto o parametro file mancante", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const db = getDb();
  const xmlBytes = Buffer.byteLength(xml, "utf8");
  const result = await syncEasyfattCatalog(db, xml);

  try {
    const [logRow] = await db.insert(daneaImportLogs).values({
      success: result.ok,
      mode: result.ok ? result.mode : null,
      message: result.ok ? null : result.message,
      stats: result.ok ? result.stats : null,
      xmlBytes,
    }).returning({
      id: daneaImportLogs.id,
      createdAt: daneaImportLogs.createdAt,
    });

    try {
      await writeDaneaImportLogFile({
        id: logRow.id,
        createdAt: logRow.createdAt,
        xml,
        xmlBytes,
        result,
      });
    } catch (fileErr) {
      console.error(
        "[danea-products] writeDaneaImportLogFile failed (DB log OK, file no):",
        fileErr
      );
    }
  } catch (e) {
    console.error("[danea-products] danea_import_logs insert failed", e);
  }

  if (!result.ok) {
    return new NextResponse(result.message, {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  revalidateCatalog();

  if (process.env.NODE_ENV !== "production") {
    console.info("[danea-products] import OK", result.stats);
  }

  return new NextResponse("OK", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
