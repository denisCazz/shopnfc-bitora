# Avvisi (announcements) — Design

## Goal

Allow admins to create site-wide popup announcements with audience, schedule, severity, and message text. Active announcements appear as dismissible modals on the storefront and/or admin area.

## Decisions

| Topic | Choice |
|-------|--------|
| Audience | `users` (guest + customer + dealer on public site), `admin` (admin area), `both` |
| Display | Modal popup (not header banner) |
| Surfaces | Public site for `users`/`both`; `/admin` for `admin`/`both` |
| Dismiss | Once per browser via `localStorage`; re-show if message/content fingerprint changes |
| Severity | `info` \| `warning` \| `critical` |
| Message | Plain text, IT required; optional EN / FR / ES (fallback IT) |
| Multiple active | Queue: show one at a time, then next undismissed |
| Storage | Postgres table + Drizzle; admin CRUD via server actions |

## Data model

Table `announcements`:

- `id` serial PK
- `message_it` text not null
- `message_en` / `message_fr` / `message_es` text nullable (fallback to IT)
- `severity` enum: `info`, `warning`, `critical` (default `info`)
- `audience` enum: `users`, `admin`, `both` (default `users`)
- `schedule_mode` enum: `always`, `range` (default `always`)
- `starts_at` timestamptz nullable (required when `range`)
- `ends_at` timestamptz nullable (required when `range`)
- `active` boolean not null default true
- `created_at` / `updated_at` timestamptz

**Active filter:** `active = true` AND (`schedule_mode = always` OR now between `starts_at` and `ends_at` inclusive).

## Admin UI

- Nav item **Avvisi** → `/admin/avvisi`
- List + create/edit/delete inline (same pattern as Categorie)
- Fields: message, severity, audience, schedule mode, date range (when range), active toggle

## Public API / fetch

- `GET /api/announcements?surface=store|admin` returns active announcements for that surface, ordered by severity (critical first) then `created_at` desc
- Client popup mounts in `AppProviders`; picks surface from pathname (`/admin` → admin, else store)

## Popup UX

- Overlay modal with severity styling, message, primary “Ho capito” / close
- On dismiss: store key `shopnfc-avviso:{id}:{fingerprint}` in `localStorage`
- Fingerprint = short hash of `message|severity|audience|schedule_mode|starts_at|ends_at` so edits re-prompt
- Skip if already dismissed; if several pending, show first in queue after close

## Out of scope

- Per-user DB dismiss sync
- HTML/markdown in message
- Separate customer vs dealer targeting
- Email / push notifications
