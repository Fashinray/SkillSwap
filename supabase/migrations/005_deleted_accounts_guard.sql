-- Previously, public.users.user_id had no foreign key to auth.users at all,
-- so an admin deleting an account from the Supabase Auth dashboard left an
-- orphaned public.users row behind. Because email is UNIQUE NOT NULL there,
-- re-registering with that same email later failed. Fix: cascade delete.
ALTER TABLE users
  ADD CONSTRAINT users_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Permanent record of emails whose account was deleted, so the same email
-- cannot be used to re-register and claim another round of starter credits.
CREATE TABLE IF NOT EXISTS deleted_accounts (
  email TEXT PRIMARY KEY,
  deleted_user_id UUID,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE deleted_accounts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.handle_deleted_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.deleted_accounts (email, deleted_user_id)
  VALUES (OLD.email, OLD.id)
  ON CONFLICT (email) DO NOTHING;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_deleted_user();

-- Block signup at the database level (defense in depth: this fires no
-- matter how the account is created, not just through our own signUp()).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.deleted_accounts WHERE email = NEW.email) THEN
    RAISE EXCEPTION 'This email address was previously removed and cannot be re-registered.';
  END IF;

  INSERT INTO public.users (
    user_id,
    email,
    full_name,
    role,
    credit_balance,
    reputation_score,
    is_verified,
    escrow_free_sessions_used
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'user',
    0,
    50,
    false,
    0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
