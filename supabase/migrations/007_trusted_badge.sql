-- Add trusted badge and session count to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_trusted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS completed_sessions_count INTEGER NOT NULL DEFAULT 0;

-- Function to recompute trusted status for a user
-- Called after every session completion
CREATE OR REPLACE FUNCTION recompute_trusted_status(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_completed INTEGER;
  v_reputation INTEGER;
  v_has_negative BOOLEAN;
  v_is_trusted BOOLEAN;
BEGIN
  -- Count completed sessions
  SELECT COUNT(*) INTO v_completed
  FROM sessions
  WHERE (teacher_id = p_user_id OR learner_id = p_user_id)
    AND status = 'completed';

  -- Get reputation score
  SELECT reputation_score INTO v_reputation
  FROM users WHERE user_id = p_user_id;

  -- Check for any ghosting or dispute history
  SELECT EXISTS (
    SELECT 1 FROM sessions
    WHERE (teacher_id = p_user_id OR learner_id = p_user_id)
      AND status IN ('ghosted', 'disputed')
  ) INTO v_has_negative;

  -- Trusted criteria: 3+ completed sessions, rep > 70, no negative history
  v_is_trusted := v_completed >= 3 AND v_reputation > 70 AND NOT v_has_negative;

  UPDATE users SET
    is_trusted = v_is_trusted,
    completed_sessions_count = v_completed
  WHERE user_id = p_user_id;

  RETURN v_is_trusted;
END;
$$;

-- Update platform_settings to include trusted badge threshold
INSERT INTO platform_settings (key, value, description)
VALUES
  ('TRUSTED_MIN_SESSIONS', '3', 'Minimum completed sessions to earn Trusted badge'),
  ('TRUSTED_MIN_REPUTATION', '70', 'Minimum reputation score to earn Trusted badge')
ON CONFLICT (key) DO NOTHING;
