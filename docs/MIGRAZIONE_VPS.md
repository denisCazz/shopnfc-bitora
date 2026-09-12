# Shop NFC — PostgreSQL su VPS

Stack: **Next.js** + **Drizzle ORM** + **PostgreSQL 18** + **NextAuth JWT**.

Il VPS parte da zero: un solo file di schema, poi il seed del catalogo NFC.

---

## 1. Prerequisiti

| Strumento | Versione minima |
|-----------|-----------------|
| Node.js | 20 |
| psql | 15+ |
| Docker + Compose | per il deploy |

---

## 2. Variabili d'ambiente

Copia `.env.example` in `.env.local`:

```env
DATABASE_URL=postgresql://shopnfc:PASSWORD@db:5432/shopnfc

AUTH_SECRET=<openssl rand -base64 32>
AUTH_URL=https://shopnfc.bitora.it
NEXT_PUBLIC_APP_URL=https://shopnfc.bitora.it

RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Shop NFC <info@bitora.it>
ADMIN_EMAIL=info@bitora.it
```

In produzione `DATABASE_URL` usa l'host Docker interno `db:5432`.

---

## 3. Schema e catalogo

```bash
psql "$DATABASE_URL" -f db/migrations/0000_vps_standalone.sql
npm run db:seed
```

Tabelle: `app_users`, `profiles`, `dealer_profiles`, `categories`, `products`, `product_images`, `chips`, `product_chips`, `orders`, `order_items`, `cart_items`, `app_settings`, `announcements`.

Admin seed: `admin@bitora.it` / `BitoraNfc2026!`

---

## 4. Deploy (Docker Compose)

```bash
git pull
docker compose --profile prod up -d --build
docker compose exec db psql -U shopnfc shopnfc -f /migrations/0000_vps_standalone.sql
```

Poi dal host (con `DATABASE_URL` verso il container):

```bash
npm run db:seed
```

---

## 5. Checklist post-deploy

- [ ] `AUTH_SECRET` diverso dallo sviluppo
- [ ] `AUTH_URL` e `NEXT_PUBLIC_APP_URL` = HTTPS pubblico
- [ ] Porta DB non esposta pubblicamente
- [ ] Backup `pg_dump` schedulato
- [ ] Sitemap inviata a Google Search Console: `https://shopnfc.bitora.it/sitemap.xml`
