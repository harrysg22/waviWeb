-- Add events JSONB column to business_registration staging table
-- Each element: { id, titulo, fecha_inicio, fecha_fin, duracion, hora, precio, descripcion, image_urls[] }
ALTER TABLE business_registration
  ADD COLUMN IF NOT EXISTS events JSONB NOT NULL DEFAULT '[]';
