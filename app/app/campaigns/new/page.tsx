'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const DISTRICTS = [
  'Śródmieście', 'Mokotów', 'Wola', 'Ursynów', 'Praga-Południe', 'Praga-Północ',
  'Ochota', 'Żoliborz', 'Bielany', 'Bemowo', 'Targówek', 'Wilanów',
]

const PACKAGES = [
  { id: 'START', name: 'START', desc: 'Pakiet startowy — 3 pojazdy, jedna dzielnica', price: '2 800 zł / mc' },
  { id: 'SCALE', name: 'SCALE', desc: 'Pakiet skalowania — 7+ pojazdów, premium targetowanie', price: 'od 17 500 zł / mc' },
]

export default function NewCampaignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [pkg, setPkg] = useState('START')
  const [startDate, setStartDate] = useState('')
  const [minKm, setMinKm] = useState('1500')
  const [districts, setDistricts] = useState<string[]>([])

  function toggleDistrict(d: string) {
    setDistricts(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        package: pkg,
        start_date: startDate || null,
        min_km_per_vehicle_monthly: parseInt(minKm, 10) || 1500,
        target_districts: districts,
      }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data.error || 'Wystąpił błąd.')
      setLoading(false)
      return
    }

    router.push(`/campaign/${data.id}`)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard/advertiser" className="text-sm text-gray-400 hover:text-white">← Wróć do pulpitu</Link>
        <h1 className="text-2xl font-bold mt-3 mb-1">Nowa kampania</h1>
        <p className="text-gray-400 mb-6">Skonfiguruj kampanię reklamy mobilnej</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nazwa */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <label className="block text-sm font-medium text-gray-300 mb-2">Nazwa kampanii *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
              placeholder="np. Promocja wiosenna 2026"
            />
          </div>

          {/* Pakiet */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <label className="block text-sm font-medium text-gray-300 mb-3">Pakiet</label>
            <div className="grid sm:grid-cols-2 gap-3">
              {PACKAGES.map(p => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPkg(p.id)}
                  className={`text-left p-4 rounded-xl border-2 transition ${
                    pkg === p.id ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="font-bold text-white">{p.name}</div>
                  <div className="text-xs text-gray-400 mt-1">{p.desc}</div>
                  <div className="text-sm text-orange-400 mt-2 font-medium">{p.price}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Dzielnice */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <label className="block text-sm font-medium text-gray-300 mb-3">Docelowe dzielnice (Warszawa)</label>
            <div className="flex flex-wrap gap-2">
              {DISTRICTS.map(d => (
                <button
                  type="button"
                  key={d}
                  onClick={() => toggleDistrict(d)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition ${
                    districts.includes(d)
                      ? 'border-orange-500 bg-orange-500/20 text-orange-300'
                      : 'border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Parametry */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Data startu</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Min. km / pojazd / mc</label>
              <input
                type="number"
                value={minKm}
                onChange={e => setMinKm(e.target.value)}
                min={1}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition"
            >
              {loading ? 'Tworzenie...' : 'Utwórz kampanię (szkic)'}
            </button>
          </div>
          <p className="text-xs text-gray-600 text-center">
            Kampania zostanie utworzona jako szkic. Płatność i przypisanie pojazdów skonfigurujesz w kolejnym kroku.
          </p>
        </form>
      </div>
    </div>
  )
}
