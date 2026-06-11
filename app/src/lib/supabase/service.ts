import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Klient Supabase z rolą service_role (BYPASSRLS).
 *
 * UŻYWAJ TYLKO PO STRONIE SERWERA i wyłącznie po zweryfikowaniu uprawnień
 * w kodzie aplikacji (np. „czy ten advertiser jest właścicielem kampanii").
 * service_role omija RLS — odpowiedzialność za autoryzację spada na nas.
 *
 * Powód istnienia: po naprawie rekursji RLS reklamodawca nie ma bezpośredniego
 * SELECT na `drivers`/`vehicles`. Dane o kierowcach w swoich kampaniach czyta
 * przez tę warstwę, z jawną kontrolą własności.
 */
export function createServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('[service] Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
