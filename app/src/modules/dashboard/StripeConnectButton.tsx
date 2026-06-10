'use client'

import { useState } from 'react'

export function StripeConnectButton({ driverId }: { driverId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function connect() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/connect-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.message || 'Nie udało się utworzyć linku Stripe. Sprawdź konfigurację.')
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Błąd połączenia.')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={connect}
        disabled={loading}
        className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-lg transition"
      >
        {loading ? 'Przekierowywanie...' : 'Połącz konto Stripe'}
      </button>
      {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
    </div>
  )
}
