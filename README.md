# Shop NFC — Bitora

E-commerce NFC nello stile Bitora, dominio previsto **shopnfc.bitora.it**.

Catalogo NFC B2B (sticker, tessere, braccialetti, tag industriali/schermati, gadget, lettori, soluzioni).

## Avvio locale

Postgres in ascolto su `localhost:5432` (Homebrew) oppure `docker compose up -d db`.

```bash
npm install
npm run db:setup
npm run db:seed
npm run dev
```

- Shop: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin](http://localhost:3000/admin)
- Email: `admin@bitora.it`
- Password: `BitoraNfc2026!`

## Cosa gestisce l’admin

Prodotti, categorie, chip NFC, utenti, clienti B2B (dealer), ordini, spedizioni, avvisi.

## Produzione

Nginx: `nginx/shopnfc.conf` — `shopnfc.bitora.it`  
Stripe e Resend si configurano in `.env.local`.

Stack Docker:

```bash
docker compose up -d db                          # solo Postgres (sviluppo)
docker compose --profile prod up -d --build      # app + Postgres
```

L’app ascolta su `http://localhost:3100` (mappa il container `3000`).
