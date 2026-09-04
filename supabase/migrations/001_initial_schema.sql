-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUMS
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE skill_tier AS ENUM ('basic', 'intermediate', 'advanced');
CREATE TYPE skill_category AS ENUM ('academic_technical', 'creative', 'practical_life');
CREATE TYPE user_skill_role AS ENUM ('teach', 'learn');
CREATE TYPE match_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');
CREATE TYPE session_status AS ENUM ('scheduled', 'active', 'completed', 'cancelled', 'ghosted', 'disputed');
CREATE TYPE escrow_status AS ENUM ('pending', 'locked', 'released', 'forfeited', 'disputed', 'cancelled');
CREATE TYPE cancellation_type AS ENUM ('full', 'partial');
CREATE TYPE dispute_status AS ENUM ('open', 'under_review', 'resolved', 'dismissed');
CREATE TYPE dispute_decision AS ENUM ('resolved_teacher_favour', 'resolved_learner_favour', 'resolved_split', 'dismissed');
CREATE TYPE transaction_type AS ENUM ('credit_grant', 'escrow_lock', 'escrow_release', 'escrow_forfeit', 'session_earn', 'session_spend', 'penalty', 'refund');
CREATE TYPE ai_evaluation_status AS ENUM ('pending', 'transcribed', 'scored', 'failed');

-- TABLE: users
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  role user_role NOT NULL DEFAULT 'user',
  credit_balance INTEGER NOT NULL DEFAULT 0,
  reputation_score INTEGER NOT NULL DEFAULT 50,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  escrow_free_sessions_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT credit_balance_non_negative CHECK (credit_balance >= 0),
  CONSTRAINT reputation_score_range CHECK (reputation_score >= 0 AND reputation_score <= 100)
);

-- TABLE: skills
CREATE TABLE skills (
  skill_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  tier skill_tier NOT NULL,
  category skill_category NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE: user_skills
CREATE TABLE user_skills (
  user_skill_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
  role user_skill_role NOT NULL,
  proficiency INTEGER CHECK (proficiency >= 1 AND proficiency <= 5),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, skill_id, role)
);

-- TABLE: matches
CREATE TABLE matches (
  match_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
  status match_status NOT NULL DEFAULT 'pending',
  compatibility_score NUMERIC(5,4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE: sessions
CREATE TABLE sessions (
  session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
  scheduled_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status session_status NOT NULL DEFAULT 'scheduled',
  chat_room_id TEXT NOT NULL,
  teacher_confirmed BOOLEAN NOT NULL DEFAULT false,
  learner_confirmed BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE: escrow_records
CREATE TABLE escrow_records (
  escrow_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL UNIQUE REFERENCES sessions(session_id) ON DELETE CASCADE,
  teacher_deposit INTEGER NOT NULL DEFAULT 0,
  learner_deposit INTEGER NOT NULL DEFAULT 0,
  status escrow_status NOT NULL DEFAULT 'pending',
  cancellation_type cancellation_type,
  grace_period_expires_at TIMESTAMPTZ,
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE: transactions
CREATE TABLE transactions (
  tx_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  session_id UUID REFERENCES sessions(session_id) ON DELETE SET NULL,
  escrow_id UUID REFERENCES escrow_records(escrow_id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE: chat_messages
CREATE TABLE chat_messages (
  msg_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  content TEXT,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT message_has_content CHECK (content IS NOT NULL OR file_url IS NOT NULL)
);

-- TABLE: reviews
CREATE TABLE reviews (
  review_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  ratee_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  teaching_quality INTEGER NOT NULL CHECK (teaching_quality >= 1 AND teaching_quality <= 5),
  punctuality INTEGER NOT NULL CHECK (punctuality >= 1 AND punctuality <= 5),
  communication INTEGER NOT NULL CHECK (communication >= 1 AND communication <= 5),
  overall_experience INTEGER NOT NULL CHECK (overall_experience >= 1 AND overall_experience <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, rater_id)
);

-- TABLE: ai_evaluations
CREATE TABLE ai_evaluations (
  eval_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL UNIQUE REFERENCES sessions(session_id) ON DELETE CASCADE,
  status ai_evaluation_status NOT NULL DEFAULT 'pending',
  teaching_clarity INTEGER CHECK (teaching_clarity >= 0 AND teaching_clarity <= 100),
  content_coverage INTEGER CHECK (content_coverage >= 0 AND content_coverage <= 100),
  engagement_quality INTEGER CHECK (engagement_quality >= 0 AND engagement_quality <= 100),
  responsiveness INTEGER CHECK (responsiveness >= 0 AND responsiveness <= 100),
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  feedback_text TEXT,
  transcript_text TEXT,
  applied_to_reputation BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE: disputes
CREATE TABLE disputes (
  dispute_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
  filer_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status dispute_status NOT NULL DEFAULT 'open',
  admin_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  decision dispute_decision,
  decision_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE: platform_settings
CREATE TABLE platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_user_skills_user ON user_skills(user_id);
CREATE INDEX idx_user_skills_skill ON user_skills(skill_id);
CREATE INDEX idx_matches_requester ON matches(requester_id);
CREATE INDEX idx_matches_recipient ON matches(recipient_id);
CREATE INDEX idx_sessions_teacher ON sessions(teacher_id);
CREATE INDEX idx_sessions_learner ON sessions(learner_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_scheduled ON sessions(scheduled_time);
CREATE INDEX idx_escrow_session ON escrow_records(session_id);
CREATE INDEX idx_escrow_status ON escrow_records(status);
CREATE INDEX idx_escrow_grace ON escrow_records(grace_period_expires_at)
  WHERE status = 'locked';
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_session ON transactions(session_id);
CREATE INDEX idx_chat_session ON chat_messages(session_id);
CREATE INDEX idx_chat_created ON chat_messages(session_id, created_at);
CREATE INDEX idx_reviews_session ON reviews(session_id);
CREATE INDEX idx_disputes_status ON disputes(status);

-- UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_escrow_updated_at
  BEFORE UPDATE ON escrow_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_ai_eval_updated_at
  BEFORE UPDATE ON ai_evaluations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- MONEY GUARD TRIGGER
CREATE OR REPLACE FUNCTION guard_protected_user_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('request.jwt.claims', true)::json->>'role'
     IS DISTINCT FROM 'service_role' THEN
    IF NEW.credit_balance IS DISTINCT FROM OLD.credit_balance THEN
      RAISE EXCEPTION 'credit_balance is server-managed and cannot be modified directly';
    END IF;
    IF NEW.reputation_score IS DISTINCT FROM OLD.reputation_score THEN
      RAISE EXCEPTION 'reputation_score is server-managed and cannot be modified directly';
    END IF;
    IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
      RAISE EXCEPTION 'is_verified is server-managed and cannot be modified directly';
    END IF;
    IF NEW.escrow_free_sessions_used IS DISTINCT FROM OLD.escrow_free_sessions_used THEN
      RAISE EXCEPTION 'escrow_free_sessions_used is server-managed and cannot be modified directly';
    END IF;
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'role is server-managed and cannot be modified directly';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_guard_protected_user_columns
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION guard_protected_user_columns();

-- APPEND-ONLY GUARD ON TRANSACTIONS
CREATE OR REPLACE FUNCTION block_transaction_mutations()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('request.jwt.claims', true)::json->>'role'
     IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'transactions table is append-only and server-managed';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_block_transaction_update
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION block_transaction_mutations();

CREATE TRIGGER trg_block_transaction_delete
  BEFORE DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION block_transaction_mutations();

-- PLATFORM SETTINGS SEED DATA
INSERT INTO platform_settings (key, value, description) VALUES
('ESCROW_FREE_SESSION_LIMIT', '1', 'Number of escrow-free sessions each new user gets'),
('LATE_CANCEL_FORFEITURE_RATE', '0.5', 'Fraction of deposit forfeited for cancellations within 24 hours'),
('GHOST_GRACE_PERIOD_MINUTES', '15', 'Minutes after scheduled start before a no-show is flagged as ghosting'),
('INITIAL_REPUTATION_SCORE', '50', 'Starting reputation score for all verified users'),
('MAX_REPUTATION_SCORE', '100', 'Maximum possible reputation score'),
('MATCHING_WEIGHT_SKILL', '0.4', 'Weight of SkillCompatibility in matching formula'),
('MATCHING_WEIGHT_REPUTATION', '0.3', 'Weight of ReputationDelta in matching formula'),
('MATCHING_WEIGHT_AVAILABILITY', '0.2', 'Weight of AvailabilityOverlap in matching formula'),
('MATCHING_WEIGHT_HISTORY', '0.1', 'Weight of PastSessionHistory in matching formula'),
('PORTFOLIO_MAX_FILE_SIZE_MB', '5', 'Maximum portfolio file size in megabytes'),
('PORTFOLIO_MAX_FILES_PER_USER', '5', 'Maximum number of portfolio files per user'),
('CHAT_MAX_FILE_SIZE_MB', '10', 'Maximum chat attachment size in megabytes');
