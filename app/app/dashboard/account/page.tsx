import { requireUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/modules/dashboard/DashboardShell'
import { AccountDeletion } from './AccountDeletion'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const profile = await requireUser()
  const supabase = await createClient()

  const { data } = await supabase
    .from('profiles')
    .select('deletion_requested_at')
    .eq('id', profile.id)
    .single()

  return (
    <DashboardShell role={profile.role} fullName={profile.full_name} email={profile.email}>
      <h1 className="text-2xl font-bold mb-1">Ustawienia konta</h1>
      <p className="text-gray-400 mb-8">Zarządzaj swoim kontem AdRide</p>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 max-w-xl">
        <h2 className="text-lg font-semibold mb-4">Dane konta</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-gray-400">Imię i nazwisko</dt>
            <dd className="text-white">{profile.full_name || '—'}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-400">Email</dt>
            <dd className="text-white">{profile.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-400">Telefon</dt>
            <dd className="text-white">{profile.phone || '—'}</dd>
          </div>
        </dl>
      </div>

      <AccountDeletion deletionRequestedAt={data?.deletion_requested_at ?? null} />
    </DashboardShell>
  )
}
