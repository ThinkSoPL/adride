import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth/session'
import { DashboardShell } from '@/modules/dashboard/DashboardShell'
import { AdminDriverStatus } from '@/modules/admin/AdminDriverStatus'
import { getAdminDriverDetail } from '@/features/admin-driver-detail/queries'

export const dynamic = 'force-dynamic'

const DRIVER_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Oczekuje KYC', color: 'bg-yellow-500/20 text-yellow-400' },
  approved: { label: 'Zatwierdzony', color: 'bg-blue-500/20 text-blue-400' },
  active: { label: 'Aktywny', color: 'bg-green-500/20 text-green-400' },
  paused: { label: 'Wstrzymany', color: 'bg-orange-500/20 text-orange-400' },
  rejected: { label: 'Odrzucony', color: 'bg-red-500/20 text-red-400' },
}

const CAMPAIGN_STATUS: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-400',
  pending_payment: 'bg-yellow-500/20 text-yellow-400',
  active: 'bg-green-500/20 text-green-400',
  paused: 'bg-orange-500/20 text-orange-400',
  completed: 'bg-blue-500/20 text-blue-400',
  cancelled: 'bg-red-500/20 text-red-400',
}

export default async function AdminDriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireUser()
  if (profile.role !== 'admin') redirect('/dashboard')

  const { id } = await params
  const driver = await getAdminDriverDetail(id)
  if (!driver) notFound()

  const st = DRIVER_STATUS[driver.status] ?? { label: driver.status, color: 'bg-gray-500/20 text-gray-400' }

  return (
    <DashboardShell role="admin" fullName={profile.full_name} email={profile.email}>
      <Link href="/admin#all-drivers" className="text-sm text-gray-400 hover:text-white transition">
        ← Wróć do listy kierowców
      </Link>

      <div className="flex items-center justify-between gap-4 flex-wrap mt-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{driver.fullName || 'Kierowca'}</h1>
          <p className="text-gray-400">{driver.email || '—'}</p>
        </div>
        <span className={`text-sm px-3 py-1 rounded-full ${st.color}`}>{st.label}</span>
      </div>

      {/* Dane + zarządzanie statusem */}
      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Dane kierowcy</h2>
          <dl className="space-y-3 text-sm">
            <Row label="Telefon" value={driver.phone || '—'} />
            <Row label="Miasto" value={driver.city || '—'} />
            <Row label="Kod polecający" value={driver.referralCode || '—'} mono />
            <Row label="Wypłaty Stripe" value={driver.stripePayoutsEnabled ? 'Skonfigurowane ✓' : 'Brak'} />
            <Row label="KYC zatwierdzone" value={driver.kycCompletedAt ? new Date(driver.kycCompletedAt).toLocaleDateString('pl-PL') : '—'} />
            <Row label="W systemie od" value={driver.createdAt ? new Date(driver.createdAt).toLocaleDateString('pl-PL') : '—'} />
          </dl>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Zmień status</h2>
          <AdminDriverStatus driverId={driver.id} current={driver.status} />
          <p className="text-xs text-gray-600 mt-4">
            Status steruje dostępem kierowcy do kampanii. „Zatwierdzony" oznacza zakończone KYC.
          </p>
        </div>
      </div>

      {/* Kampanie / dla jakiej firmy jeździ */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Kampanie i firmy</h2>
        {driver.campaigns.length > 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
            {driver.campaigns.map(c => (
              <div key={c.campaignId} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-white font-medium truncate">{c.campaignName}</div>
                  <div className="text-sm text-gray-400">dla firmy: {c.firmName}</div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full shrink-0 ${CAMPAIGN_STATUS[c.campaignStatus] ?? 'bg-gray-500/20 text-gray-400'}`}>
                  {c.campaignStatus}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-gray-400 text-sm">
            Kierowca nie jest obecnie przypisany do żadnej kampanii.
          </div>
        )}
      </section>

      {/* Pojazdy */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Pojazdy ({driver.vehicles.length})</h2>
        {driver.vehicles.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {driver.vehicles.map(v => (
              <div key={v.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-white">{v.plate}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">{v.status}</span>
                </div>
                <div className="mt-2 text-white font-medium">{v.makeModel}</div>
                <div className="text-sm text-gray-400">
                  {[v.year, v.engineType].filter(Boolean).join(' · ') || '—'}
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
    </DashboardShell>
  )
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500">{label}</dt>
      <dd className={`text-white text-right ${mono ? 'font-mono text-orange-400' : ''}`}>{value}</dd>
    </div>
  )
}
