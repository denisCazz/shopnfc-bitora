"use server";

import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { announcements } from "@/db/schema";
import { getUser } from "@/lib/auth";
import type {
  AnnouncementAudience,
  AnnouncementScheduleMode,
  AnnouncementSeverity,
} from "@/lib/types";

async function requireAdmin() {
  const user = await getUser();
  if (!user || user.role !== "admin") throw new Error("Non autorizzato");
}

const SEVERITIES: AnnouncementSeverity[] = ["info", "warning", "critical"];
const AUDIENCES: AnnouncementAudience[] = ["users", "admin", "both"];
const SCHEDULE_MODES: AnnouncementScheduleMode[] = ["always", "range"];

function parseEnum<T extends string>(value: FormDataEntryValue | null, allowed: T[], fallback: T): T {
  const v = typeof value === "string" ? value : "";
  return (allowed as string[]).includes(v) ? (v as T) : fallback;
}

function parseOptionalDate(value: FormDataEntryValue | null): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseForm(formData: FormData) {
  const messageIt = (formData.get("message_it") as string)?.trim() ?? "";
  const messageEn = (formData.get("message_en") as string)?.trim() || null;
  const messageFr = (formData.get("message_fr") as string)?.trim() || null;
  const messageEs = (formData.get("message_es") as string)?.trim() || null;
  const severity = parseEnum(formData.get("severity"), SEVERITIES, "info");
  const audience = parseEnum(formData.get("audience"), AUDIENCES, "users");
  const scheduleMode = parseEnum(formData.get("schedule_mode"), SCHEDULE_MODES, "always");
  const active = formData.get("active") !== "false";
  const startsAt = scheduleMode === "range" ? parseOptionalDate(formData.get("starts_at")) : null;
  const endsAt = scheduleMode === "range" ? parseOptionalDate(formData.get("ends_at")) : null;

  if (!messageIt) return { error: "Il messaggio IT è obbligatorio" as const };
  if (scheduleMode === "range") {
    if (!startsAt || !endsAt) return { error: "Per il range servono data inizio e fine" as const };
    if (endsAt < startsAt) return { error: "La data di fine deve essere successiva all'inizio" as const };
  }

  return {
    values: {
      messageIt,
      messageEn,
      messageFr,
      messageEs,
      severity,
      audience,
      scheduleMode,
      startsAt,
      endsAt,
      active,
      updatedAt: new Date(),
    },
  };
}

export async function getAnnouncements() {
  await requireAdmin();
  const db = getDb();
  return db.select().from(announcements).orderBy(desc(announcements.createdAt));
}

export async function createAnnouncement(formData: FormData): Promise<{ error?: string }> {
  await requireAdmin();
  const parsed = parseForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  try {
    await getDb().insert(announcements).values(parsed.values);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Errore" };
  }
  revalidatePath("/admin/avvisi");
  return {};
}

export async function updateAnnouncement(
  id: number,
  formData: FormData
): Promise<{ error?: string }> {
  await requireAdmin();
  const parsed = parseForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  try {
    await getDb()
      .update(announcements)
      .set(parsed.values)
      .where(eq(announcements.id, id));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Errore" };
  }
  revalidatePath("/admin/avvisi");
  return {};
}

export async function deleteAnnouncement(id: number): Promise<{ error?: string }> {
  await requireAdmin();
  try {
    await getDb().delete(announcements).where(eq(announcements.id, id));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Errore" };
  }
  revalidatePath("/admin/avvisi");
  return {};
}
