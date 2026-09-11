import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DaneaImportError, DaneaImportResult, DaneaImportStats, DaneaImportTraceEntry } from "@/lib/danea-import";

const DaneaImportLogsDir = path.join(process.cwd(), "data", "danea-import-logs");

function fmtDate(value: Date | string): string {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

function fmtStats(stats: DaneaImportStats | null | undefined): string[] {
  if (!stats) return ["stats: -"];
  return [
    `stats.created=${stats.created}`,
    `stats.updated=${stats.updated}`,
    `stats.deactivatedFull=${stats.deactivatedFull}`,
    `stats.deactivatedDeleted=${stats.deactivatedDeleted}`,
    `stats.skipped=${stats.skipped}`,
  ];
}

function fmtTrace(trace: DaneaImportTraceEntry[]): string[] {
  if (!trace.length) return ["- nessuna entry -"];
  return trace.map((entry, index) => {
    const code = entry.code ? ` code=${entry.code}` : "";
    return `${index + 1}. [${entry.level}] [${entry.scope}]${code} ${entry.message}`;
  });
}

export function getDaneaImportLogFilePath(id: number): string {
  return path.join(DaneaImportLogsDir, `danea-import-${id}.txt`);
}

export async function hasDaneaImportLogFile(id: number): Promise<boolean> {
  try {
    await access(getDaneaImportLogFilePath(id));
    return true;
  } catch {
    return false;
  }
}

export async function writeDaneaImportLogFile(input: {
  id: number;
  createdAt: Date | string;
  xml: string;
  xmlBytes: number;
  result: DaneaImportResult | DaneaImportError;
}): Promise<string> {
  await mkdir(DaneaImportLogsDir, { recursive: true });

  const lines = [
    "DANEA EASYFATT IMPORT LOG",
    `id=${input.id}`,
    `createdAt=${fmtDate(input.createdAt)}`,
    `success=${input.result.ok}`,
    `mode=${input.result.ok ? input.result.mode : "-"}`,
    `xmlBytes=${input.xmlBytes}`,
    `message=${input.result.ok ? "-" : input.result.message}`,
    ...fmtStats(input.result.ok ? input.result.stats : null),
    "",
    "TRACE",
    ...fmtTrace(input.result.trace),
    "",
    "XML",
    input.xml,
    "",
  ];

  const filePath = getDaneaImportLogFilePath(input.id);
  await writeFile(filePath, `${lines.join("\n")}\n`, "utf8");
  return filePath;
}
