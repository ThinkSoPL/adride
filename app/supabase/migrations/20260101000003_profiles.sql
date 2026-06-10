-- =============================================================================
-- AdRide: Tabela profili użytkowników (rozszerzenie auth.users)
-- =============================================================================

CREATE TABLE profiles (
  id          UUID         NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        user_role    NOT NULL DEFAULT 'driver',
  full_name   TEXT,
  phone       TEXT,
  language    TEXT         NOT NULL DEFAULT 'pl',
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE profiles IS 'Profile użytkowników AdRide — rozszerzenie tabeli auth.users Supabase (1:1)';
COMMENT ON COLUMN profiles.id         IS 'UUID zsynchronizowany z auth.users.id; kaskadowe usunięcie przy usunięciu konta';
COMMENT ON COLUMN profiles.role       IS 'Rola biznesowa użytkownika (driver / advertiser / admin)';
COMMENT ON COLUMN profiles.full_name  IS 'Pełne imię i nazwisko użytkownika';
COMMENT ON COLUMN profiles.phone      IS 'Numer telefonu w formacie E.164 (np. +48501234567)';
COMMENT ON COLUMN profiles.language   IS 'Preferowany język interfejsu (kod BCP 47, domyślnie pl)';
COMMENT ON COLUMN profiles.avatar_url IS 'Publiczny URL do zdjęcia profilowego (Supabase Storage)';
COMMENT ON COLUMN profiles.created_at IS 'Czas utworzenia profilu';
COMMENT ON COLUMN profiles.updated_at IS 'Czas ostatniej modyfikacji profilu';

-- -----------------------------------------------------------------------------
-- Funkcja tworząca profil automatycznie po rejestracji użytkownika
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, role, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'driver'
    ),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION handle_new_user() IS 'Tworzy wiersz w profiles natychmiast po INSERT do auth.users (SECURITY DEFINER)';

-- Trigger wywoływany przez Supabase Auth po każdej rejestracji
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
