import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env.local','utf8').split('\n')
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim()] })
)
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})
for (const t of ['profiles','drivers','advertisers','vehicles','campaigns','campaign_vehicles','gps_sessions','payouts','calculator_leads']) {
  const { count, error } = await sb.from(t).select('*', { count: 'exact', head: true })
  console.log(error ? `❌ ${t}: ${error.message}` : `✅ ${t}: ${count} wierszy`)
}
const { data: users, error: ue } = await sb.auth.admin.listUsers()
console.log(ue ? `❌ auth: ${ue.message}` : `✅ auth.users: ${users.users.length} kont`)
