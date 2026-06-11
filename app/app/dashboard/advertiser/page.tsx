import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import { DashboardShell } from '@/modules/dashboard/DashboardShell'

export const dynamic = 'force-dynamic'

const CAMPAIGN_STATUS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Szkic', color: 'bg-gray-500/20 text-gray-400' },
  pending_payment: { label: 'Oczekuje na płatność', color: 'bg-yellow-500/20 text-yellow-400' },
  active: { label: 'Aktywna', color: 'bg-green-500/20 text-green-400' },
  paused: { label: 'Wstrzymana', color: 'bg-orange-500/20 text-orange-400' },
  completed: { label: 'Zakończona', color: 'bg-blue-500/20 text-blue-400' },
  cancelled: { label: 'Anulowana', color: 'bg-red-500/20 text-red-400' },
}

export default async function AdvertiserDashboard() {
  const profile = await requireRole('advertiser')
  const supabase = await createClient()

  const { data: advertiser } = await supabase
    .from('advertisers')
    .select('company_name, industry')
    .eq('id', profile.id)
    .maybeSingle()

  if (!advertiser) {
    redirect('/onboarding/advertiser')
  }

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, name, package, status, start_date, end_date, target_districts, vehicle_ids')
    .eq('advertiser_id', profile.id)
    .order('created_at', { ascending: false })

  const activeCount = (campaigns ?? []).filter(c => c.status === 'active').length
  const totalVehicles = (campaigns ?? [])
    .filter(c => c.status === 'active')
    .reduce((sum, c) => sum + ((c.vehicle_ids as string[] | null)?.length ?? 0), 0)

  return (
    <DashboardShell role="advertiser" fullName={profile.full_name} email={profile.email}>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Pulpit reklamodawcy</h1>
          <p className="text-gray-400">{advertiser.company_name}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/advertiser/drivers"
            className="border border-gray-700 hover:border-gray-500 text-gray-200 font-medium px-4 py-2.5 rounded-lg transition whitespace-nowrap"
          >
            🚗 Kierowcy
          </Link>
          <Link
            href="/campaigns/new"
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2.5 rounded-lg transition whitespace-nowrap"
          >
            + Nowa kampania
          </Link>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="text-gray-400 text-sm">Aktywne kampanie</div>
          <div className="text-2xl font-bold mt-1">{activeCount}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="text-gray-400 text-sm">Pojazdy w terenie</div>
          <div className="text-2xl font-bold mt-1">{totalVehicles}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="text-gray-400 text-sm">Wszystkie kampanie</div>
          <div className="text-2xl font-bold mt-1">{campaigns?.length ?? 0}</div>
        </div>
      </div>

      {/* Campaigns */}
      <section id="campaigns">
        <h2 className="text-lg font-semibold mb-3">Twoje kampanie</h2>
        {campaigns && campaigns.length > 0 ? (
          <div className="grid gap-3">
            {campaigns.map(c => {
              const st = CAMPAIGN_STATUS[c.status as string] ?? { label: c.status as string, color: 'bg-gray-500/20 text-gray-400' }
              return (
                <Link
                  key={c.id}
                  href={`/campaign/${c.id}`}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition flex items-center justify-between gap-4 flex-wrap"
                >
                  <div>
                    <div className="font-semibold text-white">{c.name}</div>
                    <div className="text-sm text-gray-400 mt-1">
                      {c.package} · {(c.target_districts as string[] | null)?.join(', ') || 'Brak dzielnic'}
                      {c.start_date ? ` · od ${c.start_date}` : ''}
                    </div>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full ${st.color}`}>{st.label}</span>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
            <div className="text-4xl mb-3">📢</div>
            <div className="text-white font-medium mb-1">Nie masz jeszcze żadnej kampanii</div>
            <div className="text-gray-400 text-sm mb-4">Uruchom pierwszą kampanię i dotrzyj do klientów na ulicach miasta.</div>
            <Link
              href="/campaigns/new"
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-medium px-5 py-2.5 rounded-lg transition"
            >
              Utwórz kampanię
            </Link>
          </div>
        )}
      </section>
    </DashboardShell>
  )
}
