-- Grafica personalizzata allegata all'ordine (PNG/PDF).
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS custom_graphic_url TEXT,
  ADD COLUMN IF NOT EXISTS custom_graphic_original_name TEXT,
  ADD COLUMN IF NOT EXISTS custom_graphic_disclaimer_accepted_at TIMESTAMPTZ;
