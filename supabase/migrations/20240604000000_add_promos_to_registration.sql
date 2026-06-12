-- Add promos JSONB column to business_registration staging table
-- Each element: { id, titulo, descripcion, image_url }
ALTER TABLE business_registration
  ADD COLUMN IF NOT EXISTS promos JSONB NOT NULL DEFAULT '[]';
