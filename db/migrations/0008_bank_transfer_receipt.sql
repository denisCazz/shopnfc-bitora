-- Store the URL of the bank transfer receipt (contabile) uploaded by the customer
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bank_transfer_receipt_url TEXT;
