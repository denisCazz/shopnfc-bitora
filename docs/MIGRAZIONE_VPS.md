# Shop NFC Bitora — PostgreSQL su VPS

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
RESEND_FROM_EMAIL=Shop NFC Bitora <info@bitora.it>
ADMIN_EMAIL=info@bitora.it
```

In produzione `DATABASE_URL` usa l'host Docker interno `db:5432`.

---

## 3. Schema, Migrazioni Automatiche e Catalogo

Il database si aggiorna **automaticamente in fase di deploy** tramite tre livelli di sicurezza:
1. **Avvio Container Docker (`Dockerfile`)**: esegue `node scripts/migrate-deploy.mjs --if-db` prima di avviare `node server.js`.
2. **Build & Start (`package.json`)**: `npm run build` e `npm run start` eseguono automaticamente le migrazioni idempotenti se `DATABASE_URL` è configurata.
3. **Bootstrap Server Next.js (`instrumentation.ts` + `db/migrate.ts`)**: al primo avvio del processo Node verifica e applica eventuali migrazioni o nuove colonne mancanti in modo idempotente (con `pg_advisory_lock`).

Per eseguire manualmente le migrazioni o il seed:

```bash
npm run db:migrate
npm run db:seed
```

Tabelle: `app_users`, `profiles`, `dealer_profiles`, `categories`, `products`, `product_images`, `chips`, `product_chips`, `orders`, `order_items`, `cart_items`, `app_settings`, `announcements`, `discount_codes`, `custom_trackings`, `_schema_migrations`.

Admin seed: `admin@bitora.it` / `BitoraNfc2026!`

---

## 4. Deploy (Docker Compose)

```bash
git pull
docker compose --profile prod up -d --build
```

> All'avvio del container `app`, tutte le migrazioni in `db/migrations/*.sql` vengono applicate automaticamente sul database PostgreSQL prima dell'apertura della porta `3000`.

Per il primo popolamento catalogo (solo al primo deploy):

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
