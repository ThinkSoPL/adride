import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/modules/dashboard/DashboardShell'
import { StripeConnectButton } from '@/modules/dashboard/StripeConnectButton'

export const dynamic = 'force-dynamic'

export default async function DriverStripePage() {
  const profile = await requireRole('driver')
  const supabase = await createClient()

  const { data: driver } = await supabase
    .from('drivers')
    .select('stripe_payouts_enabled')
    .eq('id', profile.id)
    .maybeSingle()

  if (!driver) {
    redirect('/onboarding/driver')
  }

  return (
    <DashboardShell role="driver" fullName={profile.full_name} email={profile.email}>
      <Link href="/dashboard/driver" className="text-sm text-gray-400 hover:text-white">← Wróć do pulpitu</Link>
      <h1 className="text-2xl font-bold mt-3 mb-1">Wypłaty Stripe</h1>
      <p className="text-gray-400 mb-6">Połącz konto Stripe, aby otrzymywać wypłaty za przejechane kilometry.</p>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-lg">
        {driver.stripe_payouts_enabled ? (
          <div className="flex items-center gap-3 text-green-400">
            <span className="text-2xl">✓</span>
            <div>
              <div className="font-semibold">Konto połączone</div>
              <div className="text-sm text-gray-400">Twoje wypłaty są aktywne.</div>
            </div>
          </div>
        ) : (
          <>
            <p className="text-gray-300 mb-4 text-sm">
              Stripe Connect bezpiecznie obsługuje wypłaty. Potrzebujesz dowodu tożsamości
              i numeru konta bankowego (IBAN).
            </p>
            <StripeConnectButton driverId={profile.id} />
          </>
        )}
      </div>
    </DashboardShell>
  )
}
