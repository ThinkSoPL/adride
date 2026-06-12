'use client'

import { useMemo, useState } from 'react'

export interface AdminCampaignRow {
  id: string
  name: string
  firmName: string
  package: string
  status: string
  startDate: string | null
  endDate: string | null
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  draft: { label: 'Szkic', color: 'bg-gray-500/20 text-gray-400' },
  pending_payment: { label: 'Oczekuje płatności', color: 'bg-yellow-500/20 text-yellow-400' },
  active: { label: 'W trakcie', color: 'bg-green-500/20 text-green-400' },
  paused: { label: 'Wstrzymana', color: 'bg-orange-500/20 text-orange-400' },
  completed: { label: 'Zakończona', color: 'bg-blue-500/20 text-blue-400' },
  cancelled: { label: 'Anulowana', color: 'bg-red-500/20 text-red-400' },
}

// Grupy filtra: „W trakcie" = active; „Zakończone" = completed/cancelled; reszta = draft/pending/paused
const FILTERS: { key: string; label: string; match: (s: string) => boolean }[] = [
  { key: 'all', label: 'Wszystkie', match: () => true },
  { key: 'active', label: 'W trakcie', match: s => s === 'active' },
  { key: 'pending', label: 'W przygotowaniu', match: s => s === 'draft' || s === 'pending_payment' || s === 'paused' },
  { key: 'done', label: 'Zakończone', match: s => s === 'completed' || s === 'cancelled' },
]

function fmtDate(d: string | null): string {
  return d ? new Date(d).toLocaleDateString('pl-PL') : '—'
}

export function AdminCampaignsTable({ rows }: { rows: AdminCampaignRow[] }) {
  const [filter, setFilter] = useState('all')

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const f of FILTERS) c[f.key] = rows.filter(r => f.match(r.status)).length
    return c
  }, [rows])

  const active = FILTERS.find(f => f.key === filter)
  const matchFn = active ? active.match : () => true
  const filtered = rows.filter(r => matchFn(r.status))

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {FILTERS.map(f => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`text-sm px-3 py-1.5 rounded-full border transition ${
              filter === f.key
                ? 'border-orange-500 bg-orange-500/15 text-orange-300 font-medium'
                : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
            }`}
          >
            {f.label} <span className="text-gray-500">({counts[f.key]})</span>
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-gray-800/50 text-gray-400">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Nazwa</th>
                <th className="text-left px-4 py-3 font-medium">Firma</th>
                <th className="text-left px-4 py-3 font-medium">Pakiet</th>
                <th className="text-left px-4 py-3 font-medium">Okres</th>
                <th className="text-right px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const meta = STATUS_META[c.status] ?? { label: c.status, color: 'bg-gray-500/20 text-gray-400' }
                return (
                  <tr key={c.id} className="border-t border-gray-800">
                    <td className="px-4 py-3 text-white">{c.name}</td>
                    <td className="px-4 py-3 text-gray-400">{c.firmName}</td>
                    <td className="px-4 py-3 text-gray-400">{c.package}</td>
                    <td className="px-4 py-3 text-gray-400">{fmtDate(c.startDate)} – {fmtDate(c.endDate)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs px-2.5 py-1 rounded-full ${meta.color}`}>{meta.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-gray-400 text-sm text-center">
          {rows.length === 0 ? 'Brak kampanii w systemie.' : 'Brak kampanii w tej kategorii.'}
        </div>
      )}
    </div>
  )
}
