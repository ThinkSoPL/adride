import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/session'
import { DashboardShell } from '@/modules/dashboard/DashboardShell'
import { DriverActions } from '@/modules/admin/DriverActions'

export const dynamic = 'force-dynamic'

async function count(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string,
  filter?: { col: string; val: string }
): Promise<number> {
  let q = supabase.from(table).select('*', { count: 'exact', head: true })
  if (filter) q = q.eq(filter.col, filter.val)
  const { count: c } = await q
  return c ?? 0
}

export default async function AdminDashboard() {
  const profile = await requireUser()
  if (profile.role !== 'admin') {
    redirect('/dashboard')
  }

  const supabase = await createClient()

  const [driversTotal, driversPending, campaignsActive, advertisersTotal] = await Promise.all([
    count(supabase, 'drivers'),
    count(supabase, 'drivers', { col: 'status', val: 'pending' }),
    count(supabase, 'campaigns', { col: 'status', val: 'active' }),
    count(supabase, 'advertisers'),
  ])

  // Wypłaty — suma zrealizowanych
  const { data: paidPayouts } = await supabase
    .from('payouts')
    .select('amount_grosze')
    .eq('status', 'paid')
  const totalPaid = (paidPayouts ?? []).reduce((s, p) => s + (p.amount_grosze ?? 0), 0)

  // Kierowcy oczekujący na KYC (join z profiles)
  const { data: pending } = await supabase
    .from('drivers')
    .select('id, city, created_at, profiles(full_name, phone)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(20)

  type PendingRow = {
    id: string
    city: string
    created_at: string
    profiles: { full_name: string | null; phone: string | null } | null
  }
  const pendingRows = (pending ?? []) as unknown as PendingRow[]

  return (
    <DashboardShell role="admin" fullName={profile.full_name} email={profile.email}>
      <h1 className="text-2xl font-bold mb-1">Panel administratora</h1>
      <p className="text-gray-400 mb-6">Przegląd platformy AdRide</p>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="text-gray-400 text-sm">Kierowcy</div>
          <div className="text-2xl font-bold mt-1">{driversTotal}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="text-gray-400 text-sm">Oczekuje KYC</div>
          <div className="text-2xl font-bold mt-1 text-yellow-400">{driversPending}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="text-gray-400 text-sm">Aktywne kampanie</div>
          <div className="text-2xl font-bold mt-1 text-green-400">{campaignsActive}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="text-gray-400 text-sm">Wypłacono łącznie</div>
          <div className="text-2xl font-bold mt-1">{(totalPaid / 100).toFixed(0)} zł</div>
        </div>
      </div>
      <p className="text-xs text-gray-600 mb-8">Reklamodawcy w systemie: {advertisersTotal}</p>

      {/* Pending KYC */}
      <section id="drivers">
        <h2 className="text-lg font-semibold mb-3">Kierowcy oczekujący na weryfikację (KYC)</h2>
        {pendingRows.length > 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="bg-gray-800/50 text-gray-400">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Imię i nazwisko</th>
                  <th className="text-left px-4 py-3 font-medium">Telefon</th>
                  <th className="text-left px-4 py-3 font-medium">Miasto</th>
                  <th className="text-left px-4 py-3 font-medium">Zgłoszenie</th>
                  <th className="text-right px-4 py-3 font-medium">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {pendingRows.map(d => (
                  <tr key={d.id} className="border-t border-gray-800">
                    <td className="px-4 py-3 text-white">{d.profiles?.full_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{d.profiles?.phone || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{d.city}</td>
                    <td className="px-4 py-3 text-gray-400">{new Date(d.created_at).toLocaleDateString('pl-PL')}</td>
                    <td className="px-4 py-3"><DriverActions driverId={d.id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-gray-400 text-sm">
            Brak kierowców oczekujących na weryfikację. 🎉
          </div>
        )}
      </section>
    </DashboardShell>
  )
}
