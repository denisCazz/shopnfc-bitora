-- Multilingual announcement messages
-- psql "$DATABASE_URL" -f db/migrations/0010_announcements_i18n.sql

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS message_it TEXT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS message_en TEXT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS message_fr TEXT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS message_es TEXT;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'announcements' AND column_name = 'message'
  ) THEN
    EXECUTE 'UPDATE announcements SET message_it = message WHERE message_it IS NULL OR message_it = ''''';
    EXECUTE 'ALTER TABLE announcements DROP COLUMN message';
  END IF;
END $$;

UPDATE announcements
SET message_it = COALESCE(NULLIF(message_it, ''), '(senza testo)')
WHERE message_it IS NULL OR message_it = '';

ALTER TABLE announcements ALTER COLUMN message_it SET NOT NULL;
