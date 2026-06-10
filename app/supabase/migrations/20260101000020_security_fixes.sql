-- =============================================================================
-- AdRide: Security hardening
-- 1. Prevent role escalation via raw_user_meta_data in handle_new_user trigger
--    (users could register with role='admin' and get admin access)
-- =============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role user_role;
BEGIN
  -- Whitelist: only 'advertiser' is allowed via self-registration.
  -- Any other value (including 'admin') falls back to 'driver'.
  -- Admins must be promoted manually via the Supabase dashboard / service-role API.
  v_role := CASE
    WHEN NEW.raw_user_meta_data->>'role' = 'advertiser' THEN 'advertiser'::user_role
    ELSE 'driver'::user_role
  END;

  INSERT INTO profiles (id, role, full_name, phone)
  VALUES (
    NEW.id,
    v_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
