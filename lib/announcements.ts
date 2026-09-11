import { and, desc, eq, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { announcements } from "@/db/schema";
import type { AnnouncementSeverity } from "@/lib/types";

export type AnnouncementSurface = "store" | "admin";

export async function getActiveAnnouncementsForSurface(surface: AnnouncementSurface) {
  const db = getDb();
  const audienceFilter =
    surface === "admin"
      ? or(eq(announcements.audience, "admin"), eq(announcements.audience, "both"))
      : or(eq(announcements.audience, "users"), eq(announcements.audience, "both"));

  const rows = await db
    .select()
    .from(announcements)
    .where(
      and(
        eq(announcements.active, true),
        audienceFilter,
        or(
          eq(announcements.scheduleMode, "always"),
          and(
            eq(announcements.scheduleMode, "range"),
            sql`${announcements.startsAt} IS NOT NULL`,
            sql`${announcements.endsAt} IS NOT NULL`,
            sql`now() >= ${announcements.startsAt}`,
            sql`now() <= ${announcements.endsAt}`
          )
        )
      )
    )
    .orderBy(desc(announcements.createdAt));

  const severityRank: Record<AnnouncementSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };

  return [...rows].sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}
