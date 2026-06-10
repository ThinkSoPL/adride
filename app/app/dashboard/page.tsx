import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

/**
 * Router dashboardu: kieruje użytkownika do właściwego panelu
 * lub do onboardingu, jeśli nie uzupełnił jeszcze danych roli.
 */
export default async function DashboardRouter() {
  const profile = await requireUser()
  const supabase = await createClient()

  if (profile.role === 'admin') {
    redirect('/admin')
  }

  if (profile.role === 'driver') {
    const { data: driver } = await supabase
      .from('drivers')
      .select('id')
      .eq('id', profile.id)
      .maybeSingle()

    if (!driver) {
      redirect('/onboarding/driver')
    }
    redirect('/dashboard/driver')
  }

  if (profile.role === 'advertiser') {
    const { data: advertiser } = await supabase
      .from('advertisers')
      .select('id')
      .eq('id', profile.id)
      .maybeSingle()

    if (!advertiser) {
      redirect('/onboarding/advertiser')
    }
    redirect('/dashboard/advertiser')
  }

  redirect('/login')
}
