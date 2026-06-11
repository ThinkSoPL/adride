-- =============================================================================
-- Usunięcie konta z 30-dniowym okresem karencji (soft delete)
-- Użytkownik zgłasza chęć usunięcia → deletion_requested_at = now().
-- Przez 30 dni może cofnąć decyzję (deletion_requested_at = NULL).
-- Po 30 dniach konto kwalifikuje się do trwałego usunięcia
-- (zadanie cykliczne / ręczne przez admina — patrz widok poniżej).
-- =============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.deletion_requested_at IS
  'Data zgłoszenia usunięcia konta. NULL = konto aktywne. '
  'Po 30 dniach od tej daty konto może zostać trwale usunięte.';

-- Konta gotowe do trwałego usunięcia (do przeglądu przez admina / cron)
CREATE OR REPLACE VIEW accounts_pending_purge
WITH (security_invoker = true) AS
SELECT id, role, full_name, deletion_requested_at,
       deletion_requested_at + INTERVAL '30 days' AS purge_after
FROM profiles
WHERE deletion_requested_at IS NOT NULL
  AND deletion_requested_at + INTERVAL '30 days' < now();

COMMENT ON VIEW accounts_pending_purge IS
  'Konta po 30-dniowej karencji — kwalifikują się do trwałego usunięcia (auth.users + kaskada).';
