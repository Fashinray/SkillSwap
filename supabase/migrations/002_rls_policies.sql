-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- USERS
CREATE POLICY users_select_authenticated ON users
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY users_update_own ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- SKILLS
CREATE POLICY skills_select_all ON skills
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY skills_admin_insert ON skills
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY skills_admin_update ON skills
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'admin')
  );

-- USER_SKILLS
CREATE POLICY user_skills_select ON user_skills
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'admin')
    OR EXISTS (
      SELECT 1 FROM sessions
      WHERE (teacher_id = auth.uid() OR learner_id = auth.uid())
        AND (teacher_id = user_skills.user_id OR learner_id = user_skills.user_id)
    )
  );

CREATE POLICY user_skills_insert_own ON user_skills
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY user_skills_delete_own ON user_skills
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- MATCHES
CREATE POLICY matches_select_own ON matches
  FOR SELECT TO authenticated
  USING (
    requester_id = auth.uid()
    OR recipient_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY matches_insert_own ON matches
  FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY matches_update_recipient ON matches
  FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- SESSIONS
CREATE POLICY sessions_select_own ON sessions
  FOR SELECT TO authenticated
  USING (
    teacher_id = auth.uid()
    OR learner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY sessions_insert_own ON sessions
  FOR INSERT TO authenticated
  WITH CHECK (teacher_id = auth.uid() OR learner_id = auth.uid());

CREATE POLICY sessions_update_own ON sessions
  FOR UPDATE TO authenticated
  USING (teacher_id = auth.uid() OR learner_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid() OR learner_id = auth.uid());

-- ESCROW_RECORDS
CREATE POLICY escrow_select_own ON escrow_records
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.session_id = escrow_records.session_id
        AND (sessions.teacher_id = auth.uid() OR sessions.learner_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'admin')
  );

-- TRANSACTIONS
CREATE POLICY transactions_select_own ON transactions
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'admin')
  );

-- CHAT_MESSAGES
CREATE POLICY chat_select_session_member ON chat_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.session_id = chat_messages.session_id
        AND (sessions.teacher_id = auth.uid() OR sessions.learner_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY chat_insert_session_member ON chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.session_id = chat_messages.session_id
        AND (sessions.teacher_id = auth.uid() OR sessions.learner_id = auth.uid())
    )
  );

-- REVIEWS
CREATE POLICY reviews_select_own ON reviews
  FOR SELECT TO authenticated
  USING (
    rater_id = auth.uid()
    OR ratee_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY reviews_insert_own ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    rater_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.session_id = reviews.session_id
        AND (sessions.teacher_id = auth.uid() OR sessions.learner_id = auth.uid())
        AND sessions.status = 'completed'
    )
  );

-- AI_EVALUATIONS
CREATE POLICY ai_eval_select_own ON ai_evaluations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.session_id = ai_evaluations.session_id
        AND (sessions.teacher_id = auth.uid() OR sessions.learner_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'admin')
  );

-- DISPUTES
CREATE POLICY disputes_select_own ON disputes
  FOR SELECT TO authenticated
  USING (
    filer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.session_id = disputes.session_id
        AND (sessions.teacher_id = auth.uid() OR sessions.learner_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY disputes_insert_own ON disputes
  FOR INSERT TO authenticated
  WITH CHECK (
    filer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.session_id = disputes.session_id
        AND (sessions.teacher_id = auth.uid() OR sessions.learner_id = auth.uid())
    )
  );

CREATE POLICY disputes_admin_update ON disputes
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'admin')
  );

-- PLATFORM_SETTINGS
CREATE POLICY platform_settings_select ON platform_settings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY platform_settings_admin_update ON platform_settings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'admin')
  );
