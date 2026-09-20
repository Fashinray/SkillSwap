-- ── ROLE SYSTEM ──────────────────────────────────────────────────────────────
-- Add super_admin to the role enum if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'super_admin'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'super_admin';
  END IF;
EXCEPTION WHEN others THEN
  -- role column may be TEXT not enum — handle both
  NULL;
END$$;

-- If role is a plain text column just update the check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('user', 'admin', 'super_admin'));

-- ── VERIFICATION COLUMNS ON USERS ────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS admin_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_verified_by UUID,
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'under_review', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS github_url TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_url TEXT;

-- ── PROFICIENCY ON USER_SKILLS ───────────────────────────────────────────────
ALTER TABLE user_skills
  ADD COLUMN IF NOT EXISTS admin_score INTEGER CHECK (admin_score BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS proficiency_label TEXT
    CHECK (proficiency_label IN ('Beginner', 'Intermediate', 'Expert'));

-- ── VERIFICATION DOCUMENTS TABLE ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS verification_documents (
  doc_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  doc_type      TEXT NOT NULL
    CHECK (doc_type IN ('certificate', 'portfolio', 'other')),
  file_url      TEXT NOT NULL,
  file_name     TEXT NOT NULL,
  file_size     INTEGER,
  uploaded_at   TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by   UUID,
  reviewed_at   TIMESTAMPTZ,
  review_notes  TEXT
);

ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY vdocs_select_own ON verification_documents
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY vdocs_insert_own ON verification_documents
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY vdocs_admin_update ON verification_documents
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- ── COMPULSORY REVIEW TRACKING ───────────────────────────────────────────────
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS teacher_reviewed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS learner_reviewed BOOLEAN DEFAULT false;

-- ── INDEXES ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_verification_status
  ON users(verification_status);
CREATE INDEX IF NOT EXISTS idx_users_role
  ON users(role);
CREATE INDEX IF NOT EXISTS idx_vdocs_user_id
  ON verification_documents(user_id);

-- ── SEED SUPER ADMIN ROLE ON EXISTING ADMIN ACCOUNT ─────────────────────────
-- We do NOT delete the existing admin user.
-- We promote them to super_admin so they get the new super admin dashboard.
UPDATE users
  SET role = 'super_admin'
  WHERE email = 'oluwatosin5383@gmail.com';
