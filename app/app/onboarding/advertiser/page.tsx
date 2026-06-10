'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const INDUSTRIES = [
  'Gastronomia', 'Zdrowie i uroda', 'Medycyna / klinika', 'Fitness / sport',
  'Motoryzacja', 'Nieruchomości', 'Handel detaliczny', 'Usługi lokalne', 'Inne',
]

export default function AdvertiserOnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [companyName, setCompanyName] = useState('')
  const [vatId, setVatId] = useState('')
  const [industry, setIndustry] = useState(INDUSTRIES[0])
  const [street, setStreet] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [billingCity, setBillingCity] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/onboarding/advertiser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          vat_id: vatId,
          industry,
          billing_address: { street, postal_code: postalCode, city: billingCity, country: 'PL' },
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Wystąpił błąd. Spróbuj ponownie.')
        setLoading(false)
        return
      }

      router.push('/dashboard/advertiser')
      router.refresh()
    } catch {
      setError('Błąd połączenia. Sprawdź internet i spróbuj ponownie.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Witaj! 📢</h1>
          <p className="text-gray-400 mt-2">Uzupełnij dane firmy, aby uruchamiać kampanie</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-800">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nazwa firmy *</label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                placeholder="Moja Firma Sp. z o.o."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">NIP</label>
                <input
                  type="text"
                  value={vatId}
                  onChange={e => setVatId(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  placeholder="1234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Branża</label>
                <select
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                >
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Adres rozliczeniowy</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Ulica i numer</label>
              <input
                type="text"
                value={street}
                onChange={e => setStreet(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                placeholder="ul. Przykładowa 1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Kod pocztowy</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={e => setPostalCode(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  placeholder="00-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Miasto</label>
                <input
                  type="text"
                  value={billingCity}
                  onChange={e => setBillingCity(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  placeholder="Warszawa"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition"
            >
              {loading ? 'Zapisywanie...' : 'Zakończ rejestrację'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
