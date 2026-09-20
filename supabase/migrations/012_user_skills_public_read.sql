-- Discovered while live-testing Milestone 8 by actually driving the app:
-- user_skills' original RLS policy (migration 002, user_skills_select) only
-- lets a user see their own skills, an 'admin', or someone they share a
-- session with. That means the public profile page
-- (src/app/(app)/profile/[userId]/page.tsx) can never actually show a
-- stranger's "Skills they teach" / "Skills they want to learn" sections for
-- a typical viewer -- and this milestone's proficiency badges (Part O/P),
-- which render inside that same section, would never be visible either.
-- (The original policy's admin check also predates the super_admin role
-- from migration 011 and only matched role = 'admin'.)
--
-- Skills are meant to be public browsing information -- the same as
-- reputation score and the trusted badge, both already fully public via
-- users_select_authenticated (USING (true)) -- so grant unconditional
-- SELECT to any authenticated user. This is additive: it does not touch or
-- replace the original policy from migration 002, it just OR's in a
-- broader allowance, same pattern as migration 010's ai_eval_select_scored_public.
CREATE POLICY user_skills_select_public ON user_skills
  FOR SELECT TO authenticated
  USING (true);
