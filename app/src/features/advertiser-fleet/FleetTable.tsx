'use client'

import { useMemo, useState } from 'react'
import type { FleetDriverRow } from './queries'

const DRIVER_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Oczekuje', color: 'bg-yellow-500/20 text-yellow-400' },
  approved: { label: 'Zatwierdzony', color: 'bg-blue-500/20 text-blue-400' },
  active: { label: 'Aktywny', color: 'bg-green-500/20 text-green-400' },
  paused: { label: 'Wstrzymany', color: 'bg-orange-500/20 text-orange-400' },
  rejected: { label: 'Odrzucony', color: 'bg-red-500/20 text-red-400' },
  unknown: { label: '—', color: 'bg-gray-500/20 text-gray-400' },
}

export function FleetTable({
  rows,
  districts,
}: {
  rows: FleetDriverRow[]
  districts: string[]
}) {
  const [query, setQuery] = useState('')
  const [district, setDistrict] = useState('')
  const [status, setStatus] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter(r => {
      if (district && r.district !== district) return false
      if (status && r.driverStatus !== status) return false
      if (q) {
        const hay = `${r.driverName} ${r.plateMasked} ${r.makeModel} ${r.campaignName}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [rows, query, district, status])

  return (
    <div>
      {/* Filtry */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Szukaj kierowcy, pojazdu, kampanii…"
            aria-label="Szukaj kierowcy"
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500"
          />
          <span className="absolute left-3.5 top-2.5 text-gray-500">🔍</span>
        </div>
        <select
          value={district}
          onChange={e => setDistrict(e.target.value)}
          aria-label="Filtruj po dzielnicy"
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
        >
          <option value="">Wszystkie dzielnice</option>
          {districts.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          aria-label="Filtruj po statusie"
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
        >
          <option value="">Każdy status</option>
          <option value="active">Aktywny</option>
          <option value="approved">Zatwierdzony</option>
          <option value="paused">Wstrzymany</option>
          <option value="pending">Oczekuje</option>
        </select>
      </div>

      <p className="text-xs text-gray-500 mb-3">
        {filtered.length === rows.length
          ? `${rows.length} kierowców`
          : `${filtered.length} z ${rows.length} kierowców`}
      </p>

      {/* Tabela */}
      {filtered.length > 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-gray-800/50 text-gray-400">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Kierowca</th>
                <th className="text-left px-4 py-3 font-medium">Pojazd</th>
                <th className="text-left px-4 py-3 font-medium">Dzielnica</th>
                <th className="text-left px-4 py-3 font-medium">Kampania</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">km / mies.</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const st = DRIVER_STATUS[r.driverStatus] ?? DRIVER_STATUS.unknown
                return (
                  <tr key={`${r.vehicleId}-${i}`} className="border-t border-gray-800">
                    <td className="px-4 py-3 text-white">{r.driverName}</td>
                    <td className="px-4 py-3 text-gray-300">
                      {r.makeModel}
                      <span className="text-gray-500"> · {r.plateMasked}</span>
                      {r.year ? <span className="text-gray-600"> · {r.year}</span> : null}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{r.district}</td>
                    <td className="px-4 py-3 text-gray-400">{r.campaignName}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full ${st?.color}`}>{st?.label}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-white">
                      {r.kmThisMonth.toLocaleString('pl-PL')} km
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-400 text-sm">
          Brak kierowców pasujących do filtrów.
        </div>
      )}
    </div>
  )
}
