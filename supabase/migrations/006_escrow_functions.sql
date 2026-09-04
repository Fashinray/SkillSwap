-- ============================================================
-- HELPER: get a platform setting value
-- ============================================================
CREATE OR REPLACE FUNCTION get_setting(p_key TEXT)
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT value FROM platform_settings WHERE key = p_key;
$$;

-- ============================================================
-- FUNCTION 1: activate_escrow
-- Called when a session is confirmed by both parties.
-- Deducts deposits from both users and locks them.
-- Uses SELECT FOR UPDATE to prevent race conditions.
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
  -- Lock both user rows to prevent concurrent balance changes
  SELECT credit_balance INTO v_teacher_balance
    FROM users WHERE user_id = p_teacher_id FOR UPDATE;
  SELECT credit_balance INTO v_learner_balance
    FROM users WHERE user_id = p_learner_id FOR UPDATE;

  -- Check sufficient balance
  IF v_teacher_balance < p_deposit_amount THEN
    RAISE EXCEPTION 'Teacher has insufficient credits for escrow deposit';
  END IF;
  IF v_learner_balance < p_deposit_amount THEN
    RAISE EXCEPTION 'Learner has insufficient credits for escrow deposit';
  END IF;

  -- Get scheduled time for grace period
  SELECT scheduled_time INTO v_scheduled_time
    FROM sessions WHERE session_id = p_session_id;

  -- Get grace period setting
  v_grace_minutes := COALESCE(get_setting('GHOST_GRACE_PERIOD_MINUTES')::INTEGER, 15);

  -- Deduct from teacher
  UPDATE users SET credit_balance = credit_balance - p_deposit_amount
    WHERE user_id = p_teacher_id;
  INSERT INTO transactions (user_id, type, amount, balance_after, session_id, description)
    VALUES (p_teacher_id, 'escrow_lock', -p_deposit_amount,
            v_teacher_balance - p_deposit_amount, p_session_id,
            'Escrow deposit locked for session');

  -- Deduct from learner
  UPDATE users SET credit_balance = credit_balance - p_deposit_amount
    WHERE user_id = p_learner_id;
  INSERT INTO transactions (user_id, type, amount, balance_after, session_id, description)
    VALUES (p_learner_id, 'escrow_lock', -p_deposit_amount,
            v_learner_balance - p_deposit_amount, p_session_id,
            'Escrow deposit locked for session');

  -- Create or update escrow record
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

  -- Update session status
  UPDATE sessions SET status = 'active' WHERE session_id = p_session_id;

  RETURN v_escrow;
END;
$$;

-- ============================================================
-- FUNCTION 2: confirm_session_completion
-- Called when a user confirms the session is done.
-- Idempotent. Releases escrow only when BOTH confirm.
-- Uses SELECT FOR UPDATE on escrow row.
-- ============================================================
CREATE OR REPLACE FUNCTION confirm_session_completion(
  p_session_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_session sessions;
  v_escrow escrow_records;
  v_skill skills;
  v_credits_per_hour INTEGER;
  v_session_credits INTEGER;
  v_teacher_balance INTEGER;
  v_learner_balance INTEGER;
BEGIN
  -- Lock the escrow row
  SELECT * INTO v_escrow FROM escrow_records
    WHERE session_id = p_session_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Escrow record not found for session';
  END IF;

  IF v_escrow.status NOT IN ('locked', 'pending') THEN
    RETURN jsonb_build_object('status', v_escrow.status, 'already_resolved', true);
  END IF;

  -- Get session details
  SELECT * INTO v_session FROM sessions WHERE session_id = p_session_id;

  -- Record this user's confirmation
  IF p_user_id = v_session.teacher_id THEN
    UPDATE sessions SET teacher_confirmed = true WHERE session_id = p_session_id;
  ELSIF p_user_id = v_session.learner_id THEN
    UPDATE sessions SET learner_confirmed = true WHERE session_id = p_session_id;
  ELSE
    RAISE EXCEPTION 'User is not a participant in this session';
  END IF;

  -- Re-read to see if both confirmed now
  SELECT * INTO v_session FROM sessions WHERE session_id = p_session_id;

  IF NOT (v_session.teacher_confirmed AND v_session.learner_confirmed) THEN
    RETURN jsonb_build_object('status', 'waiting_for_other_party', 'already_resolved', false);
  END IF;

  -- Both confirmed — calculate credits to transfer
  SELECT * INTO v_skill FROM skills WHERE skill_id = v_session.skill_id;
  v_credits_per_hour := CASE v_skill.tier
    WHEN 'basic' THEN 1
    WHEN 'intermediate' THEN 2
    WHEN 'advanced' THEN 3
    ELSE 1
  END;
  v_session_credits := CEIL(v_session.duration_minutes::NUMERIC / 60) * v_credits_per_hour;

  -- Get current balances for ledger
  SELECT credit_balance INTO v_teacher_balance FROM users
    WHERE user_id = v_session.teacher_id FOR UPDATE;
  SELECT credit_balance INTO v_learner_balance FROM users
    WHERE user_id = v_session.learner_id FOR UPDATE;

  -- Return deposits to both
  UPDATE users SET credit_balance = credit_balance + v_escrow.teacher_deposit
    WHERE user_id = v_session.teacher_id;
  INSERT INTO transactions (user_id, type, amount, balance_after, session_id, escrow_id, description)
    VALUES (v_session.teacher_id, 'escrow_release', v_escrow.teacher_deposit,
            v_teacher_balance + v_escrow.teacher_deposit, p_session_id, v_escrow.escrow_id,
            'Escrow deposit returned after session completion');

  UPDATE users SET credit_balance = credit_balance + v_escrow.learner_deposit
    WHERE user_id = v_session.learner_id;
  INSERT INTO transactions (user_id, type, amount, balance_after, session_id, escrow_id, description)
    VALUES (v_session.learner_id, 'escrow_release', v_escrow.learner_deposit,
            v_learner_balance + v_escrow.learner_deposit, p_session_id, v_escrow.escrow_id,
            'Escrow deposit returned after session completion');

  -- Re-read balances after deposit return
  SELECT credit_balance INTO v_teacher_balance FROM users WHERE user_id = v_session.teacher_id;
  SELECT credit_balance INTO v_learner_balance FROM users WHERE user_id = v_session.learner_id;

  -- Transfer session credits: learner pays teacher
  UPDATE users SET credit_balance = credit_balance - v_session_credits
    WHERE user_id = v_session.learner_id;
  INSERT INTO transactions (user_id, type, amount, balance_after, session_id, description)
    VALUES (v_session.learner_id, 'session_spend', -v_session_credits,
            v_learner_balance - v_session_credits, p_session_id,
            'Credits paid for session: ' || v_skill.name);

  UPDATE users SET credit_balance = credit_balance + v_session_credits
    WHERE user_id = v_session.teacher_id;
  INSERT INTO transactions (user_id, type, amount, balance_after, session_id, description)
    VALUES (v_session.teacher_id, 'session_earn', v_session_credits,
            v_teacher_balance - v_escrow.teacher_deposit + v_escrow.teacher_deposit + v_session_credits,
            p_session_id,
            'Credits earned for teaching: ' || v_skill.name);

  -- Mark escrow and session as resolved
  UPDATE escrow_records SET
    status = 'released',
    resolved_by = 'system',
    resolved_at = NOW()
  WHERE escrow_id = v_escrow.escrow_id;

  UPDATE sessions SET
    status = 'completed',
    ended_at = NOW()
  WHERE session_id = p_session_id;

  RETURN jsonb_build_object(
    'status', 'completed',
    'credits_transferred', v_session_credits,
    'already_resolved', false
  );
END;
$$;

-- ============================================================
-- FUNCTION 3: process_ghost
-- Called by the ghost sweep when a user did not join.
-- Forfeits the ghost's deposit to the attendee.
-- ============================================================
CREATE OR REPLACE FUNCTION process_ghost(
  p_session_id UUID,
  p_ghost_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_escrow escrow_records;
  v_session sessions;
  v_attendee_id UUID;
  v_forfeit_amount INTEGER;
  v_attendee_balance INTEGER;
  v_ghost_balance INTEGER;
BEGIN
  SELECT * INTO v_escrow FROM escrow_records
    WHERE session_id = p_session_id FOR UPDATE;

  IF NOT FOUND OR v_escrow.status <> 'locked' THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'escrow not locked');
  END IF;

  SELECT * INTO v_session FROM sessions WHERE session_id = p_session_id;

  v_attendee_id := CASE
    WHEN p_ghost_user_id = v_session.teacher_id THEN v_session.learner_id
    ELSE v_session.teacher_id
  END;

  v_forfeit_amount := CASE
    WHEN p_ghost_user_id = v_session.teacher_id THEN v_escrow.teacher_deposit
    ELSE v_escrow.learner_deposit
  END;

  -- Return attendee's own deposit
  SELECT credit_balance INTO v_attendee_balance FROM users
    WHERE user_id = v_attendee_id FOR UPDATE;

  IF p_ghost_user_id = v_session.teacher_id THEN
    UPDATE users SET credit_balance = credit_balance + v_escrow.learner_deposit
      WHERE user_id = v_attendee_id;
    INSERT INTO transactions (user_id, type, amount, balance_after, session_id, description)
      VALUES (v_attendee_id, 'escrow_release', v_escrow.learner_deposit,
              v_attendee_balance + v_escrow.learner_deposit, p_session_id,
              'Escrow deposit returned — other party did not show');
  ELSE
    UPDATE users SET credit_balance = credit_balance + v_escrow.teacher_deposit
      WHERE user_id = v_attendee_id;
    INSERT INTO transactions (user_id, type, amount, balance_after, session_id, description)
      VALUES (v_attendee_id, 'escrow_release', v_escrow.teacher_deposit,
              v_attendee_balance + v_escrow.teacher_deposit, p_session_id,
              'Escrow deposit returned — other party did not show');
  END IF;

  -- Re-read attendee balance after return
  SELECT credit_balance INTO v_attendee_balance FROM users WHERE user_id = v_attendee_id;

  -- Transfer ghost's deposit to attendee as compensation
  UPDATE users SET credit_balance = credit_balance + v_forfeit_amount
    WHERE user_id = v_attendee_id;
  INSERT INTO transactions (user_id, type, amount, balance_after, session_id, description)
    VALUES (v_attendee_id, 'escrow_forfeit', v_forfeit_amount,
            v_attendee_balance + v_forfeit_amount, p_session_id,
            'Ghost penalty received from no-show');

  -- Reputation penalty for ghost (server-managed column)
  UPDATE users SET reputation_score = GREATEST(0, reputation_score - 10)
    WHERE user_id = p_ghost_user_id;

  -- Mark escrow and session
  UPDATE escrow_records SET
    status = 'forfeited',
    resolved_by = 'ghost_sweep',
    resolved_at = NOW()
  WHERE escrow_id = v_escrow.escrow_id;

  UPDATE sessions SET status = 'ghosted' WHERE session_id = p_session_id;

  RETURN jsonb_build_object('status', 'ghosted', 'forfeit_amount', v_forfeit_amount);
END;
$$;

-- ============================================================
-- FUNCTION 4: cancel_session
-- Handles cancellation with full or partial forfeiture
-- depending on how close to the scheduled time.
-- ============================================================
CREATE OR REPLACE FUNCTION cancel_session(
  p_session_id UUID,
  p_cancelled_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_escrow escrow_records;
  v_session sessions;
  v_hours_until NUMERIC;
  v_forfeiture_rate NUMERIC;
  v_teacher_return INTEGER;
  v_learner_return INTEGER;
  v_teacher_balance INTEGER;
  v_learner_balance INTEGER;
BEGIN
  SELECT * INTO v_escrow FROM escrow_records
    WHERE session_id = p_session_id FOR UPDATE;

  SELECT * INTO v_session FROM sessions WHERE session_id = p_session_id;

  IF v_escrow.status NOT IN ('pending', 'locked') THEN
    RAISE EXCEPTION 'Session cannot be cancelled in its current state';
  END IF;

  v_hours_until := EXTRACT(EPOCH FROM (v_session.scheduled_time - NOW())) / 3600;
  v_forfeiture_rate := CASE
    WHEN v_hours_until >= 24 THEN 0
    ELSE COALESCE(get_setting('LATE_CANCEL_FORFEITURE_RATE')::NUMERIC, 0.5)
  END;

  -- Calculate returns
  IF v_escrow.status = 'locked' THEN
    v_teacher_return := v_escrow.teacher_deposit - FLOOR(v_escrow.teacher_deposit * v_forfeiture_rate)::INTEGER;
    v_learner_return := v_escrow.learner_deposit - FLOOR(v_escrow.learner_deposit * v_forfeiture_rate)::INTEGER;

    SELECT credit_balance INTO v_teacher_balance FROM users
      WHERE user_id = v_session.teacher_id FOR UPDATE;
    SELECT credit_balance INTO v_learner_balance FROM users
      WHERE user_id = v_session.learner_id FOR UPDATE;

    UPDATE users SET credit_balance = credit_balance + v_teacher_return
      WHERE user_id = v_session.teacher_id;
    INSERT INTO transactions (user_id, type, amount, balance_after, session_id, description)
      VALUES (v_session.teacher_id,
              CASE WHEN v_forfeiture_rate = 0 THEN 'escrow_release'::transaction_type ELSE 'refund'::transaction_type END,
              v_teacher_return,
              v_teacher_balance + v_teacher_return, p_session_id,
              CASE WHEN v_forfeiture_rate = 0 THEN 'Session cancelled — full deposit returned'
                   ELSE 'Session cancelled late — partial deposit returned' END);

    UPDATE users SET credit_balance = credit_balance + v_learner_return
      WHERE user_id = v_session.learner_id;
    INSERT INTO transactions (user_id, type, amount, balance_after, session_id, description)
      VALUES (v_session.learner_id,
              CASE WHEN v_forfeiture_rate = 0 THEN 'escrow_release'::transaction_type ELSE 'refund'::transaction_type END,
              v_learner_return,
              v_learner_balance + v_learner_return, p_session_id,
              CASE WHEN v_forfeiture_rate = 0 THEN 'Session cancelled — full deposit returned'
                   ELSE 'Session cancelled late — partial deposit returned' END);
  END IF;

  UPDATE escrow_records SET
    status = 'cancelled',
    cancellation_type = CASE WHEN v_forfeiture_rate = 0 THEN 'full' ELSE 'partial' END,
    resolved_by = p_cancelled_by::TEXT,
    resolved_at = NOW()
  WHERE escrow_id = v_escrow.escrow_id;

  UPDATE sessions SET status = 'cancelled' WHERE session_id = p_session_id;

  RETURN jsonb_build_object(
    'status', 'cancelled',
    'forfeiture_rate', v_forfeiture_rate,
    'teacher_returned', v_teacher_return,
    'learner_returned', v_learner_return
  );
END;
$$;

-- ============================================================
-- FUNCTION 5: escalate_dispute
-- Locks escrow and creates a dispute record.
-- ============================================================
CREATE OR REPLACE FUNCTION escalate_dispute(
  p_session_id UUID,
  p_filer_id UUID,
  p_reason TEXT
)
RETURNS disputes
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_dispute disputes;
BEGIN
  UPDATE escrow_records SET status = 'disputed'
    WHERE session_id = p_session_id AND status = 'locked';

  UPDATE sessions SET status = 'disputed'
    WHERE session_id = p_session_id;

  INSERT INTO disputes (session_id, filer_id, reason, status)
    VALUES (p_session_id, p_filer_id, p_reason, 'open')
    RETURNING * INTO v_dispute;

  RETURN v_dispute;
END;
$$;

-- ============================================================
-- FUNCTION 6: ghost_sweep
-- Detects ghosts: sessions where grace period has expired
-- and not both participants joined.
-- Safe to call multiple times (idempotent).
-- ============================================================
CREATE OR REPLACE FUNCTION ghost_sweep()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_record RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_record IN
    SELECT e.session_id, s.teacher_id, s.learner_id,
           s.teacher_confirmed, s.learner_confirmed
    FROM escrow_records e
    JOIN sessions s ON s.session_id = e.session_id
    WHERE e.status = 'locked'
      AND e.grace_period_expires_at < NOW()
      AND s.status NOT IN ('completed', 'ghosted', 'disputed', 'cancelled')
  LOOP
    IF NOT v_record.teacher_confirmed THEN
      PERFORM process_ghost(v_record.session_id, v_record.teacher_id);
      v_count := v_count + 1;
    ELSIF NOT v_record.learner_confirmed THEN
      PERFORM process_ghost(v_record.session_id, v_record.learner_id);
      v_count := v_count + 1;
    END IF;
  END LOOP;
  RETURN v_count;
END;
$$;
