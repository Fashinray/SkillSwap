-- ============================================================
-- FIX: activate_escrow was setting session status to 'active'
-- immediately when escrow locks, before the session time has
-- arrived. This caused the "Enter session room" link and the
-- room itself to behave inconsistently between the two parties.
--
-- Session lifecycle is now:
--   'scheduled' = booked, escrow locked, waiting for session time
--   'active'    = a participant has entered the room
--   'completed' = both parties confirmed it happened
-- ============================================================
CREATE OR REPLACE FUNCTION activate_escrow(
  p_session_id UUID,
  p_teacher_id UUID,
  p_learner_id UUID,
  p_deposit_amount INTEGER
)
RETURNS escrow_records
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_teacher_balance INTEGER;
  v_learner_balance INTEGER;
  v_escrow escrow_records;
  v_grace_minutes INTEGER;
  v_scheduled_time TIMESTAMPTZ;
BEGIN
  SELECT credit_balance INTO v_teacher_balance
    FROM users WHERE user_id = p_teacher_id FOR UPDATE;
  SELECT credit_balance INTO v_learner_balance
    FROM users WHERE user_id = p_learner_id FOR UPDATE;

  IF v_teacher_balance < p_deposit_amount THEN
    RAISE EXCEPTION 'Teacher has insufficient credits for escrow deposit';
  END IF;
  IF v_learner_balance < p_deposit_amount THEN
    RAISE EXCEPTION 'Learner has insufficient credits for escrow deposit';
  END IF;

  SELECT scheduled_time INTO v_scheduled_time
    FROM sessions WHERE session_id = p_session_id;

  v_grace_minutes := COALESCE(get_setting('GHOST_GRACE_PERIOD_MINUTES')::INTEGER, 15);

  UPDATE users SET credit_balance = credit_balance - p_deposit_amount
    WHERE user_id = p_teacher_id;
  INSERT INTO transactions (user_id, type, amount, balance_after, session_id, description)
    VALUES (p_teacher_id, 'escrow_lock', -p_deposit_amount,
            v_teacher_balance - p_deposit_amount, p_session_id,
            'Escrow deposit locked for session');

  UPDATE users SET credit_balance = credit_balance - p_deposit_amount
    WHERE user_id = p_learner_id;
  INSERT INTO transactions (user_id, type, amount, balance_after, session_id, description)
    VALUES (p_learner_id, 'escrow_lock', -p_deposit_amount,
            v_learner_balance - p_deposit_amount, p_session_id,
            'Escrow deposit locked for session');

  INSERT INTO escrow_records (
    session_id, teacher_deposit, learner_deposit, status,
    grace_period_expires_at
  ) VALUES (
    p_session_id, p_deposit_amount, p_deposit_amount, 'locked',
    v_scheduled_time + (v_grace_minutes || ' minutes')::INTERVAL
  )
  ON CONFLICT (session_id) DO UPDATE SET
    status = 'locked',
    teacher_deposit = p_deposit_amount,
    learner_deposit = p_deposit_amount,
    grace_period_expires_at = v_scheduled_time + (v_grace_minutes || ' minutes')::INTERVAL
  RETURNING * INTO v_escrow;

  -- Keep session as 'scheduled' so the room link stays visible
  -- Status moves to 'active' when participants enter the room
  UPDATE sessions SET status = 'scheduled' WHERE session_id = p_session_id;

  RETURN v_escrow;
END;
$$;

-- ============================================================
-- FIX: enable Realtime replication on chat_messages and sessions
-- so postgres_changes subscriptions in SessionRoom actually fire.
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
