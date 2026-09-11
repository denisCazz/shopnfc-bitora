import type {
  AnnouncementAudience,
  AnnouncementScheduleMode,
  AnnouncementSeverity,
} from "@/lib/types";
import type { Locale } from "@/lib/i18n";

export type AnnouncementPayload = {
  id: number;
  messageIt: string;
  messageEn: string | null;
  messageFr: string | null;
  messageEs: string | null;
  severity: AnnouncementSeverity;
  audience: AnnouncementAudience;
  scheduleMode: AnnouncementScheduleMode;
  startsAt: string | null;
  endsAt: string | null;
};

export function localizedAnnouncementMessage(
  a: Pick<AnnouncementPayload, "messageIt" | "messageEn" | "messageFr" | "messageEs">,
  locale: Locale
): string {
  if (locale === "en" && a.messageEn) return a.messageEn;
  if (locale === "fr" && a.messageFr) return a.messageFr;
  if (locale === "es" && a.messageEs) return a.messageEs;
  return a.messageIt;
}

export function availableAnnouncementLocales(
  a: Pick<AnnouncementPayload, "messageIt" | "messageEn" | "messageFr" | "messageEs">
): Locale[] {
  const list: Locale[] = ["it"];
  if (a.messageEn?.trim()) list.push("en");
  if (a.messageFr?.trim()) list.push("fr");
  if (a.messageEs?.trim()) list.push("es");
  return list;
}

export function resolveAnnouncementViewLocale(
  a: Pick<AnnouncementPayload, "messageIt" | "messageEn" | "messageFr" | "messageEs">,
  preferred: Locale
): Locale {
  const available = availableAnnouncementLocales(a);
  return available.includes(preferred) ? preferred : "it";
}

/** Simple non-crypto fingerprint so edits re-show dismissed popups. */
export function announcementFingerprint(a: AnnouncementPayload): string {
  const raw = [
    a.messageIt,
    a.messageEn ?? "",
    a.messageFr ?? "",
    a.messageEs ?? "",
    a.severity,
    a.audience,
    a.scheduleMode,
    a.startsAt ?? "",
    a.endsAt ?? "",
  ].join("|");
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return (hash >>> 0).toString(36);
}

function storageKey(id: number, fingerprint: string): string {
  return `shopnfc-avviso:${id}:${fingerprint}`;
}

export function isAnnouncementDismissed(a: AnnouncementPayload): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(storageKey(a.id, announcementFingerprint(a))) === "1";
  } catch {
    return false;
  }
}

export function dismissAnnouncement(a: AnnouncementPayload): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(a.id, announcementFingerprint(a)), "1");
  } catch {
    /* ignore quota / private mode */
  }
}
