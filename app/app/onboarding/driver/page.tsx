'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const COMMON_MAKES = [
  'BMW', 'Audi', 'Mercedes-Benz', 'Toyota', 'Honda', 'Volkswagen',
  'Skoda', 'Ford', 'Opel', 'Nissan', 'Volvo', 'Alfa Romeo',
  'Peugeot', 'Renault', 'Hyundai', 'Kia', 'Mazda', 'Suzuki',
  'Fiat', 'Seat', 'Citroen', 'Dacia', 'Lancia', 'Inne'
]

const ENGINE_TYPES = [
  'Benzyna',
  'Diesel',
  'Hybryda',
  'Plug-in hibryda',
  'Elektryczny',
  'Wodorowy',
  'Inne'
]

export default function DriverOnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)

  const [city, setCity] = useState('Warszawa')
  const [plate, setPlate] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [engineType, setEngineType] = useState('')
  const [mileage, setMileage] = useState('')

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/auth/signout', { method: 'POST' })
    router.push('/login')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/onboarding/driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city,
          vehicle: {
            registration_plate: plate.toUpperCase().replace(/\s/g, ''),
            make,
            model,
            year: year ? parseInt(year, 10) : null,
            engine_type: engineType,
            mileage_monthly_estimate: mileage ? parseInt(mileage, 10) : null,
          },
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Wystąpił błąd. Spróbuj ponownie.')
        setLoading(false)
        return
      }

      router.push('/dashboard/driver')
      router.refresh()
    } catch {
      setError('Błąd połączenia. Sprawdź internet i spróbuj ponownie.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-8">
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-white">Witaj, kierowco! 🚗</h1>
            <p className="text-gray-400 mt-2">Uzupełnij dane swojego pojazdu, aby zacząć zarabiać</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="ml-4 px-3 py-2 text-sm text-gray-400 hover:text-white transition disabled:opacity-50"
            title="Wyloguj się"
          >
            ↩ Wyjdź
          </button>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-800">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Miasto</label>
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
              >
                <option>Warszawa</option>
                <option>Kraków</option>
                <option>Wrocław</option>
                <option>Poznań</option>
                <option>Gdańsk</option>
                <option>Łódź</option>
              </select>
            </div>

            <div className="border-t border-gray-800 pt-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Pojazd</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tablica rejestracyjna *</label>
              <input
                type="text"
                value={plate}
                onChange={e => setPlate(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white uppercase placeholder-gray-500 focus:outline-none focus:border-orange-500"
                placeholder="WA12345"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Marka *</label>
                <select
                  value={make}
                  onChange={e => setMake(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="">-- Wybierz --</option>
                  {COMMON_MAKES.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Model *</label>
                <input
                  type="text"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  placeholder="Corolla"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Rok produkcji *</label>
                <input
                  type="number"
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  required
                  min={1990}
                  max={2030}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  placeholder="2020"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Typ silnika *</label>
                <select
                  value={engineType}
                  onChange={e => setEngineType(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="">-- Wybierz --</option>
                  {ENGINE_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Szacowany przebieg miesięczny (km)
              </label>
              <input
                type="number"
                value={mileage}
                onChange={e => setMileage(e.target.value)}
                min={1}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                placeholder="3000"
              />
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
