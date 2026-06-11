-- Add services JSONB column to business_registration staging table
-- Each element: { id, name, price, duration, charge_type, capacity, description, image_urls[] }
ALTER TABLE business_registration
  ADD COLUMN IF NOT EXISTS services JSONB NOT NULL DEFAULT '[]';
