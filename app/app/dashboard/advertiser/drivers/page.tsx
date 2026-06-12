import Link from 'next/link'
import { requireRole } from '@/lib/auth/session'
import { DashboardShell } from '@/modules/dashboard/DashboardShell'
import { getAdvertiserFleet } from '@/features/advertiser-fleet/queries'
import { FleetTable } from '@/features/advertiser-fleet/FleetTable'

export const dynamic = 'force-dynamic'

export default async function AdvertiserDriversPage() {
  const profile = await requireRole('advertiser')
  const fleet = await getAdvertiserFleet(profile.id)

  return (
    <DashboardShell role="advertiser" fullName={profile.full_name} email={profile.email}>
      <div className="mb-6">
        <Link href="/dashboard/advertiser" className="text-sm text-gray-400 hover:text-white transition">
          ← Powrót do pulpitu
        </Link>
        <h1 className="text-2xl font-bold mt-2 mb-1">Kierowcy w Twoich kampaniach</h1>
        <p className="text-gray-400">Przeszukuj flotę i sprawdzaj aktywność w bieżącym miesiącu</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="text-gray-400 text-sm">Kierowcy w kampaniach</div>
          <div className="text-2xl font-bold mt-1">{fleet.totalDrivers}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="text-gray-400 text-sm">km w tym miesiącu</div>
          <div className="text-2xl font-bold mt-1 text-orange-400">
            {fleet.totalKmThisMonth.toLocaleString('pl-PL')} km
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="text-gray-400 text-sm">Dzielnice objęte</div>
          <div className="text-2xl font-bold mt-1">{fleet.districts.length}</div>
        </div>
      </div>

      {fleet.rows.length > 0 ? (
        <FleetTable rows={fleet.rows} districts={fleet.districts} />
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <div className="text-4xl mb-3">🚗</div>
          <div className="text-white font-medium mb-1">Brak kierowców w kampaniach</div>
          <div className="text-gray-400 text-sm mb-4">
            Gdy uruchomisz kampanię i przypiszemy do niej pojazdy, pojawią się tutaj wraz z aktywnością GPS.
          </div>
          <Link
            href="/campaigns/new"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-medium px-5 py-2.5 rounded-lg transition"
          >
            Utwórz kampanię
          </Link>
        </div>
      )}
    </DashboardShell>
  )
}
