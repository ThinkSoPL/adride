'use client'

import { useState } from 'react'

export interface AdminFirmCampaign {
  id: string
  name: string
  package: string
  status: string
}

export interface AdminFirmRow {
  id: string
  companyName: string
  industry: string | null
  districtFocus: string[] | null
  vatId: string | null
  createdAt: string
  contactName: string | null
  contactPhone: string | null
  campaigns: AdminFirmCampaign[]
}

const CAMPAIGN_STATUS: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-400',
  pending_payment: 'bg-yellow-500/20 text-yellow-400',
  active: 'bg-green-500/20 text-green-400',
  paused: 'bg-orange-500/20 text-orange-400',
  completed: 'bg-blue-500/20 text-blue-400',
  cancelled: 'bg-red-500/20 text-red-400',
}

export function AdminFirmsAccordion({ firms }: { firms: AdminFirmRow[] }) {
  // Single-open: tylko jeden element rozwinięty naraz (otwarcie nowego zwija poprzedni)
  const [openId, setOpenId] = useState<string | null>(null)

  if (firms.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-gray-400 text-sm">
        Brak firm w systemie.
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {firms.map(f => {
        const open = openId === f.id
        return (
          <div key={f.id} className="bg-gray-900 border border-gray-800 rounded-xl">
            <button
              type="button"
              onClick={() => setOpenId(open ? null : f.id)}
              aria-expanded={open}
              className="w-full text-left p-4 cursor-pointer hover:bg-gray-800/40 rounded-xl transition"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-white">{f.companyName}</div>
                <span className={`text-gray-500 text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
              </div>
              <div className="text-sm text-gray-400 mt-1">
                {f.industry || 'Branża nieokreślona'}
                {f.districtFocus?.length ? ` · ${f.districtFocus.join(', ')}` : ''}
                {` · ${f.campaigns.length} kampanii`}
              </div>
            </button>
            {open && (
              <div className="px-4 pb-4 border-t border-gray-800 pt-3 text-sm space-y-2">
                <div className="text-gray-400">
                  <span className="text-gray-500">Kontakt:</span>{' '}
                  {f.contactName || '—'}{f.contactPhone ? ` · ${f.contactPhone}` : ''}
                </div>
                <div className="text-gray-400">
                  <span className="text-gray-500">NIP:</span> {f.vatId || '—'}
                  {' · '}
                  <span className="text-gray-500">W systemie od:</span>{' '}
                  {new Date(f.createdAt).toLocaleDateString('pl-PL')}
                </div>
                {f.campaigns.length > 0 ? (
                  <ul className="space-y-1.5 pt-1">
                    {f.campaigns.map(c => (
                      <li key={c.id} className="flex items-center justify-between gap-2">
                        <span className="text-gray-300 truncate">
                          {c.name} <span className="text-gray-500">({c.package})</span>
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${CAMPAIGN_STATUS[c.status] ?? 'bg-gray-500/20 text-gray-400'}`}>
                          {c.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-500 pt-1">Brak kampanii.</div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
