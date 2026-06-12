-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: update approve_business_registration to handle
--   logo_url, image_urls (gallery), services, and events/promos
-- Run once in Supabase Studio → SQL Editor → Run
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
  -- new
  v_img_url     TEXT;
  v_img_id      INT;
  v_svc         JSONB;
  v_svc_id      INT;
  v_ev          JSONB;
  v_ev_id       INT;
  v_promo       JSONB;
  v_promo_id    INT;
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

  -- 2. Crear site (incluye logo_url)
  INSERT INTO site (
    company_id, name, address, details,
    location_lat, location_lng, mean_price,
    zone_id, active, logo_url
  ) VALUES (
    v_company_id,
    v_reg.business_name,
    v_reg.address,
    COALESCE(v_reg.description, ''),
    COALESCE(v_reg.location_lat, 0),
    COALESCE(v_reg.location_lng, 0),
    COALESCE(v_reg.mean_price, 0),
    v_reg.zone_id,
    true,
    NULLIF(v_reg.logo_url, '')
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

  -- 8. Galería de imágenes → image + site_image
  IF array_length(v_reg.image_urls, 1) > 0 THEN
    FOREACH v_img_url IN ARRAY v_reg.image_urls LOOP
      INSERT INTO image (img_url, type, date, visible, name, description, company_id)
      VALUES (v_img_url, 'cover', NOW(), true, v_reg.business_name, v_reg.business_name, v_company_id)
      RETURNING id INTO v_img_id;

      INSERT INTO site_image (site_id, image_id)
      VALUES (v_site_id, v_img_id);
    END LOOP;
  END IF;

  -- 9. Servicios → service + service_image
  FOR v_svc IN SELECT * FROM jsonb_array_elements(COALESCE(v_reg.services, '[]'::jsonb)) LOOP
    INSERT INTO service (
      site_id, name, price, pricing_type,
      capacity, duration_mins, description, active
    ) VALUES (
      v_site_id,
      v_svc->>'name',
      NULLIF(v_svc->>'price', '')::NUMERIC,
      CASE v_svc->>'charge_type'
        WHEN 'gratis'       THEN 'FREE'
        WHEN 'por_persona'  THEN 'PER_PERSON'
        WHEN 'con_consumo'  THEN 'VARIABLE'
        WHEN 'por_servicio' THEN 'VARIABLE'
        ELSE                     'VARIABLE'
      END,
      NULLIF(v_svc->>'capacity', '')::INT,
      NULLIF(regexp_replace(COALESCE(v_svc->>'duration', ''), '[^0-9]', '', 'g'), '')::INT,
      v_svc->>'description',
      true
    )
    RETURNING id INTO v_svc_id;

    -- Imágenes del servicio
    FOR v_img_url IN
      SELECT jsonb_array_elements_text(COALESCE(v_svc->'image_urls', '[]'::jsonb))
    LOOP
      INSERT INTO image (img_url, type, date, visible, name, description, company_id)
      VALUES (v_img_url, 'cover', NOW(), true, v_svc->>'name', v_svc->>'name', v_company_id)
      RETURNING id INTO v_img_id;

      INSERT INTO service_image (service_id, image_id)
      VALUES (v_svc_id, v_img_id);
    END LOOP;
  END LOOP;

  -- 10. Promociones/Eventos → event + event_image
  FOR v_ev IN SELECT * FROM jsonb_array_elements(COALESCE(v_reg.events, '[]'::jsonb)) LOOP
    INSERT INTO event (
      site_id, title, description,
      start_date, end_date, price, active
    ) VALUES (
      v_site_id,
      v_ev->>'titulo',
      v_ev->>'descripcion',
      NULLIF(v_ev->>'fecha_inicio', '')::TIMESTAMPTZ,
      NULLIF(v_ev->>'fecha_fin',    '')::TIMESTAMPTZ,
      NULLIF(v_ev->>'precio', '')::NUMERIC,
      true
    )
    RETURNING id INTO v_ev_id;

    -- Imágenes del evento (flyer)
    FOR v_img_url IN
      SELECT jsonb_array_elements_text(COALESCE(v_ev->'image_urls', '[]'::jsonb))
    LOOP
      INSERT INTO image (img_url, type, date, visible, name, description, company_id)
      VALUES (v_img_url, 'cover', NOW(), true, v_ev->>'titulo', v_ev->>'titulo', v_company_id)
      RETURNING id INTO v_img_id;

      INSERT INTO event_image (event_id, image_id)
      VALUES (v_ev_id, v_img_id);
    END LOOP;
  END LOOP;

  -- 10b. Promociones → event (sin fechas) + event_image
  FOR v_promo IN SELECT * FROM jsonb_array_elements(COALESCE(v_reg.promos, '[]'::jsonb)) LOOP
    INSERT INTO event (site_id, title, description, active)
    VALUES (v_site_id, v_promo->>'titulo', v_promo->>'descripcion', true)
    RETURNING id INTO v_promo_id;

    -- Flyer de la promo (image_url es string simple, no array)
    IF (v_promo->>'image_url') IS NOT NULL AND trim(v_promo->>'image_url') <> '' THEN
      INSERT INTO image (img_url, type, date, visible, name, description, company_id)
      VALUES (v_promo->>'image_url', 'cover', NOW(), true,
              v_promo->>'titulo', v_promo->>'titulo', v_company_id)
      RETURNING id INTO v_img_id;

      INSERT INTO event_image (event_id, image_id) VALUES (v_promo_id, v_img_id);
    END IF;
  END LOOP;

  -- 11. Cambiar tipo de cuenta a 'establecimiento'
  UPDATE account
  SET tipo = 'establecimiento'
  WHERE auth_id = v_reg.auth_id
    AND tipo = 'cliente';

  -- 12. Marcar solicitud como aprobada
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
