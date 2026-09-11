import { headers } from "next/headers";
import {
  getDaneaImportLogs,
  getDaneaOrdersExportLogs,
  type DaneaLogRow,
  type DaneaOrdersExportLogRow,
} from "@/app/admin/actions/danea";
import DaneaClient from "./DaneaClient";

async function getBaseUrl(): Promise<string> {
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AUTH_URL ||
    process.env.VERCEL_URL;
  if (envUrl) {
    const u = envUrl.startsWith("http") ? envUrl : `https://${envUrl}`;
    return u.replace(/\/$/, "");
  }
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (host) {
    return `${proto}://${host}`;
  }
  return "http://localhost:3000";
}

export default async function AdminDaneaPage() {
  const baseUrl = await getBaseUrl();
  let logs: DaneaLogRow[] = [];
  let ordersLogs: DaneaOrdersExportLogRow[] = [];
  try {
    logs = await getDaneaImportLogs(80);
  } catch {
    logs = [];
  }
  try {
    ordersLogs = await getDaneaOrdersExportLogs(60);
  } catch {
    ordersLogs = [];
  }

  return <DaneaClient baseUrl={baseUrl} initialLogs={logs} initialOrdersLogs={ordersLogs} />;
}
