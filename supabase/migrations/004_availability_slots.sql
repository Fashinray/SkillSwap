CREATE TABLE availability_slots (
  slot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  start_min INTEGER NOT NULL CHECK (start_min >= 0 AND start_min < 1440),
  end_min INTEGER NOT NULL CHECK (end_min > start_min AND end_min <= 1440),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_availability_user ON availability_slots(user_id);
CREATE INDEX idx_availability_weekday ON availability_slots(weekday);

ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY availability_select_own ON availability_slots
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM sessions
      WHERE (teacher_id = auth.uid() OR learner_id = auth.uid())
        AND (teacher_id = availability_slots.user_id
             OR learner_id = availability_slots.user_id)
    )
  );

CREATE POLICY availability_insert_own ON availability_slots
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY availability_delete_own ON availability_slots
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
