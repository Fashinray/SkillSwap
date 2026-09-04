-- Private storage bucket for files shared inside a session room's chat.
-- Uploads and signed-URL generation both happen server-side via the
-- service-role client (src/lib/actions/session.ts: uploadSessionFile),
-- which verifies the uploader is a participant in the session before
-- writing, so no public bucket access or storage.objects RLS policy
-- is required.
INSERT INTO storage.buckets (id, name, public)
VALUES ('session-files', 'session-files', false)
ON CONFLICT (id) DO NOTHING;
