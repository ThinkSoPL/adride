import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import { DashboardShell } from '@/modules/dashboard/DashboardShell'
import { getDriverCampaigns } from '@/features/driver-campaigns/queries'

export const dynamic = 'force-dynamic'

const CAMPAIGN_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  draft: { label: 'Szkic', color: 'bg-gray-500/20 text-gray-400' },
  pending_payment: { label: 'Oczekuje na płatność', color: 'bg-yellow-500/20 text-yellow-400' },
  active: { label: 'W trakcie', color: 'bg-green-500/20 text-green-400' },
  paused: { label: 'Wstrzymana', color: 'bg-orange-500/20 text-orange-400' },
  completed: { label: 'Zakończona', color: 'bg-blue-500/20 text-blue-400' },
  cancelled: { label: 'Anulowana', color: 'bg-red-500/20 text-red-400' },
}

const STATUS_INFO: Record<string, { label: string; color: string; desc: string }> = {
  pending: { label: 'Oczekuje na weryfikację', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40', desc: 'Twoje konto jest sprawdzane. Damy znać, gdy zostanie zatwierdzone.' },
  approved: { label: 'Zatwierdzony', color: 'bg-blue-500/20 text-blue-400 border-blue-500/40', desc: 'Możesz już przyjmować kampanie. Skonfiguruj wypłaty Stripe.' },
  active: { label: 'Aktywny', color: 'bg-green-500/20 text-green-400 border-green-500/40', desc: 'Świetnie! Uczestniczysz w kampanii i zarabiasz.' },
  paused: { label: 'Wstrzymany', color: 'bg-gray-500/20 text-gray-400 border-gray-500/40', desc: 'Twoje konto jest tymczasowo wstrzymane.' },
  rejected: { label: 'Odrzucony', color: 'bg-red-500/20 text-red-400 border-red-500/40', desc: 'Niestety Twoje zgłoszenie zostało odrzucone. Skontaktuj się z nami.' },
}

export default async function DriverDashboard() {
  const profile = await requireRole('driver')
  const supabase = await createClient()

  const { data: driver } = await supabase
    .from('drivers')
    .select('status, city, referral_code, stripe_payouts_enabled, bank_account_verified')
    .eq('id', profile.id)
    .maybeSingle()

  if (!driver) {
    redirect('/onboarding/driver')
  }

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, registration_plate_masked, make, model, year, color, status, mileage_monthly_estimate')
    .eq('driver_id', profile.id)
    .order('created_at', { ascending: true })

  const { data: payouts } = await supabase
    .from('payouts')
    .select('id, amount_grosze, status, period_start, period_end, created_at')
    .eq('driver_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(12)

  const totalPaid = (payouts ?? [])
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amount_grosze ?? 0), 0)

  // Kampanie, w których jeździ kierowca (nazwa firmy przez service_role — brak RLS na advertisers)
  const driverCampaigns = await getDriverCampaigns(profile.id)

  const status = driver.status as string
  const info = STATUS_INFO[status] ?? { label: status, color: 'bg-gray-500/20 text-gray-400 border-gray-500/40', desc: '' }

  return (
    <DashboardShell role="driver" fullName={profile.full_name} email={profile.email}>
      <h1 className="text-2xl font-bold mb-1">Pulpit kierowcy</h1>
      <p className="text-gray-400 mb-6">Cześć, {profile.full_name || 'kierowco'}! 👋</p>

      {/* Status banner */}
      <div className={`rounded-xl border px-5 py-4 mb-6 ${info.color}`}>
        <div className="font-semibold">{info.label}</div>
        <div className="text-sm opacity-80 mt-1">{info.desc}</div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="text-gray-400 text-sm">Łączne wypłaty</div>
          <div className="text-2xl font-bold mt-1">{(totalPaid / 100).toFixed(2)} zł</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="text-gray-400 text-sm">Pojazdy</div>
          <div className="text-2xl font-bold mt-1">{vehicles?.length ?? 0}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="text-gray-400 text-sm">Kod polecający</div>
          <div className="text-xl font-bold mt-1 font-mono text-orange-400">{driver.referral_code || '—'}</div>
        </div>
      </div>

      {/* Stripe payouts CTA */}
      {!driver.stripe_payouts_enabled && status !== 'rejected' && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-5 mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="font-semibold text-orange-300">Skonfiguruj wypłaty 💳</div>
            <div className="text-sm text-gray-400 mt-1">Połącz konto Stripe, aby otrzymywać wypłaty za przejechane kilometry.</div>
          </div>
          <Link
            href="/dashboard/driver/stripe"
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 rounded-lg transition whitespace-nowrap"
          >
            Połącz Stripe
          </Link>
        </div>
      )}

      {/* Moje kampanie */}
      <section id="campaigns" className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Moje kampanie</h2>
        {driverCampaigns.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {driverCampaigns.map(c => {
              const st = CAMPAIGN_STATUS_LABEL[c.campaignStatus] ?? { label: c.campaignStatus, color: 'bg-gray-500/20 text-gray-400' }
              return (
                <div key={`${c.campaignId}-${c.vehiclePlateMasked}`} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-white truncate">{c.campaignName}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${st.color}`}>{st.label}</span>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    Jeździsz dla: <span className="text-gray-200">{c.firmName}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2 flex items-center justify-between gap-2">
                    <span className="font-mono">{c.vehiclePlateMasked} · {c.vehicleMakeModel}</span>
                    <span className="text-orange-400 font-medium">{c.kmThisMonth.toLocaleString('pl-PL')} km / mc</span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
            <div className="text-3xl mb-2">🚗</div>
            <div className="text-white font-medium mb-1">Nie jeździsz jeszcze w żadnej kampanii</div>
            <div className="text-gray-400 text-sm">
              {status === 'pending'
                ? 'Najpierw zatwierdzimy Twoje konto. Potem dopasujemy Cię do kampanii reklamodawcy.'
                : 'Gdy dopasujemy Cię do kampanii reklamodawcy, pojawi się tutaj wraz z nazwą firmy i przejechanymi kilometrami.'}
            </div>
          </div>
        )}
      </section>

      {/* Vehicles */}
      <section id="vehicles" className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Moje pojazdy</h2>
        {vehicles && vehicles.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {vehicles.map(v => (
              <div key={v.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-sm text-gray-300">{v.registration_plate_masked}</div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">{v.status}</span>
                </div>
                <div className="mt-2 text-white font-medium">{[v.make, v.model].filter(Boolean).join(' ') || 'Pojazd'}</div>
                <div className="text-sm text-gray-400">
                  {[v.year, v.color, v.mileage_monthly_estimate ? `${v.mileage_monthly_estimate} km/mc` : null].filter(Boolean).join(' · ')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-gray-400 text-sm">
            Brak pojazdów.
          </div>
        )}
      </section>

      {/* Earnings */}
      <section id="earnings">
        <h2 className="text-lg font-semibold mb-3">Historia wypłat</h2>
        {payouts && payouts.length > 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-800/50 text-gray-400">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Okres</th>
                  <th className="text-right px-4 py-3 font-medium">Kwota</th>
                  <th className="text-right px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map(p => (
                  <tr key={p.id} className="border-t border-gray-800">
                    <td className="px-4 py-3 text-gray-300">{p.period_start} – {p.period_end}</td>
                    <td className="px-4 py-3 text-right font-medium">{((p.amount_grosze ?? 0) / 100).toFixed(2)} zł</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-gray-400 text-sm">
            Brak wypłat. Pojawią się tutaj, gdy zaczniesz uczestniczyć w kampaniach.
          </div>
        )}
      </section>
    </DashboardShell>
  )
}
