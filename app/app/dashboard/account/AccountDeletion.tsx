'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const GRACE_DAYS = 30

export function AccountDeletion({ deletionRequestedAt }: { deletionRequestedAt: string | null }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const purgeDate = deletionRequestedAt
    ? new Date(new Date(deletionRequestedAt).getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000)
    : null

  async function request() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/account/delete', { method: 'POST' }).catch(() => null)
    if (!res?.ok) {
      setError('Nie udało się zgłosić usunięcia konta. Spróbuj ponownie.')
      setLoading(false)
      return
    }
    router.refresh()
    setLoading(false)
    setConfirming(false)
  }

  async function cancel() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/account/delete', { method: 'DELETE' }).catch(() => null)
    if (!res?.ok) {
      setError('Nie udało się cofnąć usunięcia konta. Spróbuj ponownie.')
      setLoading(false)
      return
    }
    router.refresh()
    setLoading(false)
  }

  if (purgeDate) {
    return (
      <div className="bg-red-950/40 border border-red-800 rounded-xl p-6 max-w-xl">
        <h2 className="text-lg font-semibold text-red-300 mb-2">Konto oczekuje na usunięcie</h2>
        <p className="text-sm text-gray-300 mb-4">
          Twoje konto zostanie trwale usunięte{' '}
          <strong className="text-white">{purgeDate.toLocaleDateString('pl-PL')}</strong>.
          Do tego czasu możesz cofnąć decyzję jednym kliknięciem.
        </p>
        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
        <button
          onClick={cancel}
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg transition"
        >
          {loading ? 'Przywracanie…' : 'Cofnij usunięcie konta'}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-xl">
      <h2 className="text-lg font-semibold mb-2">Usuń konto</h2>
      <p className="text-sm text-gray-400 mb-4">
        Konto zostanie oznaczone do usunięcia. Przez <strong className="text-gray-300">30 dni</strong>{' '}
        możesz cofnąć decyzję — po tym czasie konto i powiązane dane zostaną trwale usunięte.
      </p>
      {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
      {confirming ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-red-400">Na pewno?</span>
          <button
            onClick={request}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg transition"
          >
            {loading ? 'Usuwanie…' : 'Tak, usuń konto'}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={loading}
            className="text-gray-400 hover:text-white px-4 py-2 transition"
          >
            Anuluj
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="border border-red-800 text-red-400 hover:bg-red-950/40 font-medium px-4 py-2 rounded-lg transition"
        >
          Usuń konto
        </button>
      )}
    </div>
  )
}
