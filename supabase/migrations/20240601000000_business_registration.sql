-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: business_registration staging table + approval function
-- Run once via: Supabase Studio → SQL Editor, or `supabase db push`
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Agregar 'establecimiento' al enum account_tipo (si aún no existe)
ALTER TYPE account_tipo ADD VALUE IF NOT EXISTS 'establecimiento';

-- 2. Tabla staging — guarda el formulario completo hasta que el admin apruebe
CREATE TABLE IF NOT EXISTS business_registration (
  id               SERIAL PRIMARY KEY,

  -- Auth
  auth_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email            TEXT NOT NULL,

  -- Info del negocio
  business_name    TEXT          NOT NULL,
  description      TEXT,
  category_ids     INT[]         NOT NULL DEFAULT '{}',
  cuisine_type_ids INT[]         NOT NULL DEFAULT '{}',
  mean_price       NUMERIC(10,2),

  -- Ubicación
  address          TEXT          NOT NULL,
  zone_id          INT           REFERENCES zone(id),
  location_lat     FLOAT,
  location_lng     FLOAT,

  -- Horarios JSONB: [{ "weekday": 1, "start_time": "10:00 AM", "end_time": "8:00 PM" }]
  -- start_time / end_time en formato "H:MM AM/PM" — requerido por la app Flutter
  business_hours   JSONB         NOT NULL DEFAULT '[]',

  -- Comodidades
  amenity_ids      INT[]         NOT NULL DEFAULT '{}',

  -- Contactos JSONB: [{ "method": "whatsapp", "link": "+57 310 000 0000" }]
  contacts         JSONB         NOT NULL DEFAULT '[]',

  -- Estado
  status           TEXT          NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes      TEXT,
  submitted_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  reviewed_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_business_registration_status
  ON business_registration(status);

CREATE INDEX IF NOT EXISTS idx_business_registration_auth_id
  ON business_registration(auth_id);

-- 3. RLS
ALTER TABLE business_registration ENABLE ROW LEVEL SECURITY;

-- El dueño ve su propia solicitud
CREATE POLICY "owner_select"
  ON business_registration FOR SELECT
  USING (auth_id = auth.uid());

-- El dueño puede insertar su solicitud (solo una por auth_id — el form valida esto)
CREATE POLICY "owner_insert"
  ON business_registration FOR INSERT
  WITH CHECK (auth_id = auth.uid());

-- El admin (account.tipo = 'admin') puede ver y modificar todas
CREATE POLICY "admin_all"
  ON business_registration FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM account
      WHERE account.auth_id = auth.uid()
        AND account.tipo = 'admin'
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Función de aprobación atómica
--    SECURITY DEFINER → corre con permisos del owner (bypasea RLS)
--    Llamada exclusivamente desde la Edge Function approve-registration
--    que ya verificó que el caller es admin.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION approve_business_registration(
  p_registration_id INT,
  p_admin_notes     TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reg         business_registration%ROWTYPE;
  v_company_id  INT;
  v_site_id     INT;
  v_id          INT;
  v_hour        JSONB;
  v_contact     JSONB;
BEGIN
  -- Solo procesar si está pendiente
  SELECT * INTO v_reg
  FROM business_registration
  WHERE id = p_registration_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registro % no encontrado o ya procesado', p_registration_id;
  END IF;

  -- 1. Crear company
  INSERT INTO company (name)
  VALUES (v_reg.business_name)
  RETURNING id INTO v_company_id;

  -- 2. Crear site (active = true desde el momento de aprobación)
  INSERT INTO site (
    company_id, name, address, details,
    location_lat, location_lng, mean_price,
    zone_id, active
  ) VALUES (
    v_company_id,
    v_reg.business_name,
    v_reg.address,
    COALESCE(v_reg.description, ''),
    COALESCE(v_reg.location_lat, 0),
    COALESCE(v_reg.location_lng, 0),
    COALESCE(v_reg.mean_price, 0),
    v_reg.zone_id,
    true
  )
  RETURNING id INTO v_site_id;

  -- 3. Categorías del negocio
  FOREACH v_id IN ARRAY v_reg.category_ids LOOP
    INSERT INTO company_category (company_id, category_id)
    VALUES (v_company_id, v_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- 4. Tipos de cocina (solo si aplica)
  IF array_length(v_reg.cuisine_type_ids, 1) > 0 THEN
    FOREACH v_id IN ARRAY v_reg.cuisine_type_ids LOOP
      INSERT INTO site_cuisine (site_id, cuisine_type_id)
      VALUES (v_site_id, v_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- 5. Horarios (start_time / end_time en formato "H:MM AM/PM" para Flutter)
  FOR v_hour IN SELECT * FROM jsonb_array_elements(v_reg.business_hours) LOOP
    INSERT INTO business_hours (site_id, weekday, start_time, end_time)
    VALUES (
      v_site_id,
      (v_hour->>'weekday')::INT,
       v_hour->>'start_time',
       v_hour->>'end_time'
    );
  END LOOP;

  -- 6. Comodidades / amenidades
  IF array_length(v_reg.amenity_ids, 1) > 0 THEN
    FOREACH v_id IN ARRAY v_reg.amenity_ids LOOP
      INSERT INTO site_additional_services (site_id, additional_service_id, details)
      VALUES (v_site_id, v_id, '')
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- 7. Contactos (solo los que tienen link no vacío)
  FOR v_contact IN SELECT * FROM jsonb_array_elements(v_reg.contacts) LOOP
    IF (v_contact->>'link') IS NOT NULL AND trim(v_contact->>'link') <> '' THEN
      INSERT INTO company_contact (company_id, link, method)
      VALUES (
        v_company_id,
        v_contact->>'link',
        v_contact->>'method'
      );
    END IF;
  END LOOP;

  -- 8. Cambiar tipo de cuenta a 'establecimiento'
  --    Nunca degradar un 'admin' — solo aplica si sigue siendo 'cliente'
  UPDATE account
  SET tipo = 'establecimiento'
  WHERE auth_id = v_reg.auth_id
    AND tipo = 'cliente';

  -- 9. Marcar solicitud como aprobada
  UPDATE business_registration
  SET status      = 'approved',
      admin_notes = p_admin_notes,
      reviewed_at = NOW()
  WHERE id = p_registration_id;

  RETURN json_build_object(
    'success',    true,
    'company_id', v_company_id,
    'site_id',    v_site_id
  );

EXCEPTION WHEN OTHERS THEN
  RAISE; -- rollback automático de toda la transacción
END;
$$;
