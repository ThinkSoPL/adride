import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Root aplikacji: zalogowany → dashboard (router ról),
 * anonim → kalkulator zasięgu (publiczne narzędzie lead-gen).
 * Marketing/landing pages żyją osobno na adride.pl (statyczne HTML).
 */
export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  redirect('/kalkulator')
}
