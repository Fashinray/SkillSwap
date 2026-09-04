-- Milestone 6: the public profile page (src/app/(app)/profile/[userId]/page.tsx)
-- shows a teacher's aggregate "AI Teaching Scores" to ANY authenticated viewer,
-- not just to the two participants of each underlying session. The existing
-- ai_eval_select_own policy (migration 002) only allows a session's own
-- teacher/learner (or an admin) to SELECT ai_evaluations rows, so without this
-- policy the public-profile query silently returns zero rows for every viewer
-- who wasn't personally in those sessions and the section never renders.
--
-- Only scored rows are exposed (feedback_text/transcript are never selected by
-- the profile page itself), mirroring the already-public
-- users_select_authenticated policy (USING (true)) used for reputation_score
-- and is_trusted on the same page.
CREATE POLICY ai_eval_select_scored_public ON ai_evaluations
  FOR SELECT TO authenticated
  USING (status = 'scored');
