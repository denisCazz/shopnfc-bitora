-- App-wide key/value settings table
-- psql "$DATABASE_URL" -f db/migrations/0006_app_settings.sql

CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default shipping rates (net prices, IVA added separately for Italian zones)
INSERT INTO app_settings (key, value) VALUES (
  'shipping',
  '{
    "zones": {
      "italy": {
        "label": "Italia",
        "tiers": [
          {"maxKg": 10, "rate": 8.50},
          {"maxKg": 30, "rate": 12.50}
        ],
        "includesIva": true
      },
      "islands_calabria": {
        "label": "Isole e Calabria",
        "tiers": [
          {"maxKg": 10, "rate": 12.50},
          {"maxKg": 30, "rate": 16.50}
        ],
        "includesIva": true
      },
      "europe": {
        "label": "Europa",
        "tiers": [
          {"maxKg": 10, "rate": 20.00},
          {"maxKg": 30, "rate": 30.00}
        ],
        "includesIva": false
      }
    },
    "codSurcharge": 7.00,
    "ivaRate": 0.22,
    "islandsCalabriaProvincia": [
      "AG","CL","CT","EN","ME","PA","RG","SR","TP",
      "CA","CI","MD","NU","OG","OT","OR","SS","SU","VS",
      "CS","CZ","KR","RC","VV"
    ]
  }'::jsonb
) ON CONFLICT (key) DO NOTHING;
