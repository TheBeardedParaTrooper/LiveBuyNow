-- Migration: add mobile payment columns to orders
ALTER TABLE IF EXISTS orders
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS provider_tx_id TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'TZS';

-- Ensure payment_status and payment_method exist (if your schema differs, adjust accordingly)
ALTER TABLE IF EXISTS orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'mobile_money';
