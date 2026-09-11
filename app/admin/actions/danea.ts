"use server";

import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { daneaImportLogs, daneaOrdersExportLogs } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { hasDaneaImportLogFile } from "@/lib/danea-import-log-file";

export type DaneaLogRow = {
  id: number;
  createdAt: string;
  success: boolean;
  source: string;
  mode: string | null;
  message: string | null;
  stats: {
    created: number;
    updated: number;
    deactivatedFull: number;
    deactivatedDeleted: number;
    skipped: number;
  } | null;
  xmlBytes: number | null;
  hasLogFile: boolean;
};

export async function getDaneaImportLogs(limit = 80): Promise<DaneaLogRow[]> {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    throw new Error("Non autorizzato");
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(daneaImportLogs)
    .orderBy(desc(daneaImportLogs.createdAt))
    .limit(limit);

  return Promise.all(rows.map(async (r) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    success: r.success,
    source: r.source,
    mode: r.mode,
    message: r.message,
    stats: r.stats,
    xmlBytes: r.xmlBytes,
    hasLogFile: await hasDaneaImportLogFile(r.id),
  })));
}

export type DaneaOrdersExportLogRow = {
  id: number;
  createdAt: string;
  success: boolean;
  orderCount: number;
  orderIds: number[] | null;
  firstdate: string | null;
  lastdate: string | null;
  message: string | null;
};

export async function getDaneaOrdersExportLogs(limit = 60): Promise<DaneaOrdersExportLogRow[]> {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    throw new Error("Non autorizzato");
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(daneaOrdersExportLogs)
    .orderBy(desc(daneaOrdersExportLogs.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    success: r.success,
    orderCount: r.orderCount,
    orderIds: r.orderIds ?? null,
    firstdate: r.firstdate ?? null,
    lastdate: r.lastdate ?? null,
    message: r.message ?? null,
  }));
}
