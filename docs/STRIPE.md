# Stripe — pagamenti checkout

Il checkout usa **Stripe Checkout** (pagina ospitata da Stripe). I metodi visibili al cliente (carte e altri) si gestiscono dal [Dashboard Stripe](https://dashboard.stripe.com/settings/payment_methods), senza cambiare codice.

Flusso: ordine in stato `pending` → sessione Checkout → pagamento → conferma via webhook `checkout.session.completed` (e, in backup, al ritorno su `/api/stripe/return`).

## Variabili d'ambiente

```env
STRIPE_SECRET_KEY=rk_test_...   # o sk_test_... / rk_live_... / sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Preferisci una [restricted API key](https://docs.stripe.com/keys/restricted-api-keys) (`rk_`) rispetto a una secret key (`sk_`).

`AUTH_URL` deve essere l'URL pubblico HTTPS (es. `https://shopnfc.bitora.it`): Stripe lo usa per `success_url`, `cancel_url` e il webhook.

## Setup

1. Crea (o usa) un account su [dashboard.stripe.com](https://dashboard.stripe.com/).
2. Copia la chiave segreta (test o live) in `STRIPE_SECRET_KEY`.
3. Crea un webhook endpoint:
   - URL: `https://shopnfc.bitora.it/api/stripe/webhook`
   - Eventi: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`
4. Copia il signing secret (`whsec_...`) in `STRIPE_WEBHOOK_SECRET`.
5. In locale: `stripe listen --forward-to localhost:3000/api/stripe/webhook` e usa il `whsec_` stampato dal CLI.
6. In admin → **Impostazioni** → **Testa Stripe**. Deve risultare OK.

## Diagnostica

- Admin → Impostazioni → card **Stripe** (lettura saldo, senza creare pagamenti).
- Log server: `Stripe checkout session create failed` / `Stripe webhook signature verification failed`.
