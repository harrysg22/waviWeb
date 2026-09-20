-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: tabla de solicitudes de cambio desde el portal de negocios
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS business_edit_request (
  id           SERIAL PRIMARY KEY,
  site_id      INTEGER NOT NULL REFERENCES site(id) ON DELETE CASCADE,
  auth_id      UUID    NOT NULL,
  type         TEXT    NOT NULL CHECK (type IN ('profile', 'service', 'promo', 'event')),
  action       TEXT    NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  payload      JSONB   NOT NULL DEFAULT '{}',
  status       TEXT    NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes  TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_business_edit_request_site_id
  ON business_edit_request(site_id);

CREATE INDEX IF NOT EXISTS idx_business_edit_request_status
  ON business_edit_request(status);

CREATE INDEX IF NOT EXISTS idx_business_edit_request_auth_id
  ON business_edit_request(auth_id);

-- RLS
ALTER TABLE business_edit_request ENABLE ROW LEVEL SECURITY;

-- El negocio ve y crea sus propias solicitudes
CREATE POLICY "business_own" ON business_edit_request
  FOR ALL
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

-- El admin ve y modifica todas
CREATE POLICY "admin_all" ON business_edit_request
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM account
      WHERE account.auth_id = auth.uid()
        AND account.tipo = 'admin'
    )
  );
