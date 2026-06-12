import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/session'
import { DashboardShell } from '@/modules/dashboard/DashboardShell'
import { DriverActions } from '@/modules/admin/DriverActions'
import { AdminCampaignsTable } from '@/modules/admin/AdminCampaignsTable'
import { AdminFirmsAccordion } from '@/modules/admin/AdminFirmsAccordion'

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

  // Wszyscy kierowcy (różne statusy) — przegląd
  const { data: allDrivers } = await supabase
    .from('drivers')
    .select('id, status, city, profiles(full_name, phone)')
    .order('status', { ascending: true })
    .limit(100)

  type DriverRow = {
    id: string
    status: string
    city: string
    profiles: { full_name: string | null; phone: string | null } | null
  }
  const driverRows = (allDrivers ?? []) as unknown as DriverRow[]

  // Firmy reklamodawcy (z kontaktem)
  const { data: firms } = await supabase
    .from('advertisers')
    .select('id, company_name, industry, district_focus, vat_id, created_at, profiles(full_name, phone)')
    .order('company_name', { ascending: true })
    .limit(100)

  type FirmRow = {
    id: string
    company_name: string
    industry: string | null
    district_focus: string[] | null
    vat_id: string | null
    created_at: string
    profiles: { full_name: string | null; phone: string | null } | null
  }
  const firmRows = (firms ?? []) as unknown as FirmRow[]

  // Wszystkie kampanie (z firmą)
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, name, package, status, start_date, end_date, advertiser_id, advertisers(company_name)')
    .order('created_at', { ascending: false })
    .limit(100)

  type CampaignRow = {
    id: string
    name: string
    package: string
    status: string
    start_date: string | null
    end_date: string | null
    advertiser_id: string
    advertisers: { company_name: string | null } | null
  }
  const campaignRows = (campaigns ?? []) as unknown as CampaignRow[]
  const campaignsByFirm = new Map<string, CampaignRow[]>()
  for (const c of campaignRows) {
    const list = campaignsByFirm.get(c.advertiser_id) ?? []
    list.push(c)
    campaignsByFirm.set(c.advertiser_id, list)
  }

  const DRIVER_STATUS: Record<string, { label: string; color: string }> = {
    pending: { label: 'Oczekuje KYC', color: 'bg-yellow-500/20 text-yellow-400' },
    approved: { label: 'Zatwierdzony', color: 'bg-blue-500/20 text-blue-400' },
    active: { label: 'Aktywny', color: 'bg-green-500/20 text-green-400' },
    paused: { label: 'Wstrzymany', color: 'bg-orange-500/20 text-orange-400' },
    rejected: { label: 'Odrzucony', color: 'bg-red-500/20 text-red-400' },
  }

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
                    <td className="px-4 py-3">
                      <Link href={`/admin/drivers/${d.id}`} className="text-white hover:text-orange-400 font-medium transition">
                        {d.profiles?.full_name || '—'}
                      </Link>
                    </td>
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

      {/* Wszyscy kierowcy */}
      <section id="all-drivers" className="mt-10">
        <h2 className="text-lg font-semibold mb-3">Wszyscy kierowcy ({driverRows.length})</h2>
        {driverRows.length > 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="bg-gray-800/50 text-gray-400">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Imię i nazwisko</th>
                  <th className="text-left px-4 py-3 font-medium">Telefon</th>
                  <th className="text-left px-4 py-3 font-medium">Miasto</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Szczegóły</th>
                </tr>
              </thead>
              <tbody>
                {driverRows.map(d => {
                  const st = DRIVER_STATUS[d.status] ?? { label: d.status, color: 'bg-gray-500/20 text-gray-400' }
                  return (
                    <tr key={d.id} className="border-t border-gray-800 hover:bg-gray-800/40 transition">
                      <td className="px-4 py-3">
                        <Link href={`/admin/drivers/${d.id}`} className="text-white hover:text-orange-400 font-medium transition">
                          {d.profiles?.full_name || '—'}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{d.profiles?.phone || '—'}</td>
                      <td className="px-4 py-3 text-gray-400">{d.city}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full ${st.color}`}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/drivers/${d.id}`} className="text-orange-400 hover:text-orange-300 text-sm whitespace-nowrap">
                          Otwórz →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-gray-400 text-sm">
            Brak kierowców w systemie.
          </div>
        )}
      </section>

      {/* Kampanie — z filtrem statusu */}
      <section id="campaigns" className="mt-10">
        <h2 className="text-lg font-semibold mb-3">Kampanie ({campaignRows.length})</h2>
        <AdminCampaignsTable
          rows={campaignRows.map(c => ({
            id: c.id,
            name: c.name,
            firmName: c.advertisers?.company_name || '—',
            package: c.package,
            status: c.status,
            startDate: c.start_date,
            endDate: c.end_date,
          }))}
        />
      </section>

      {/* Firmy — akordeon single-open */}
      <section id="firms" className="mt-10">
        <h2 className="text-lg font-semibold mb-3">Firmy reklamodawcy ({firmRows.length})</h2>
        <AdminFirmsAccordion
          firms={firmRows.map(f => ({
            id: f.id,
            companyName: f.company_name,
            industry: f.industry,
            districtFocus: f.district_focus,
            vatId: f.vat_id,
            createdAt: f.created_at,
            contactName: f.profiles?.full_name ?? null,
            contactPhone: f.profiles?.phone ?? null,
            campaigns: (campaignsByFirm.get(f.id) ?? []).map(c => ({
              id: c.id,
              name: c.name,
              package: c.package,
              status: c.status,
            })),
          }))}
        />
      </section>
    </DashboardShell>
  )
}
