'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DriverActions({ driverId }: { driverId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function setStatus(status: 'approved' | 'rejected') {
    setLoading(status)
    const res = await fetch(`/api/admin/drivers/${driverId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setLoading(null)
    if (res.ok) {
      router.refresh()
    } else {
      alert('Nie udało się zaktualizować statusu.')
    }
  }

  return (
    <div className="flex gap-2 justify-end">
      <button
        onClick={() => setStatus('approved')}
        disabled={loading !== null}
        className="text-xs px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium transition"
      >
        {loading === 'approved' ? '...' : 'Zatwierdź'}
      </button>
      <button
        onClick={() => setStatus('rejected')}
        disabled={loading !== null}
        className="text-xs px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-700 disabled:opacity-50 text-white font-medium transition"
      >
        {loading === 'rejected' ? '...' : 'Odrzuć'}
      </button>
    </div>
  )
}
