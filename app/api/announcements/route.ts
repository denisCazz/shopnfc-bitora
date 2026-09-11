import { NextResponse } from "next/server";
import {
  getActiveAnnouncementsForSurface,
  type AnnouncementSurface,
} from "@/lib/announcements";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const surfaceParam = searchParams.get("surface");
  const surface: AnnouncementSurface =
    surfaceParam === "admin" ? "admin" : "store";

  try {
    const rows = await getActiveAnnouncementsForSurface(surface);
    return NextResponse.json({
      announcements: rows.map((r) => ({
        id: r.id,
        messageIt: r.messageIt,
        messageEn: r.messageEn,
        messageFr: r.messageFr,
        messageEs: r.messageEs,
        severity: r.severity,
        audience: r.audience,
        scheduleMode: r.scheduleMode,
        startsAt: r.startsAt?.toISOString() ?? null,
        endsAt: r.endsAt?.toISOString() ?? null,
      })),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Errore", announcements: [] },
      { status: 500 }
    );
  }
}
