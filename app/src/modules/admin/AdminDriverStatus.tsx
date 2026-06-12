'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUSES: { value: string; label: string }[] = [
  { value: 'pending', label: 'Oczekuje KYC' },
  { value: 'approved', label: 'Zatwierdzony' },
  { value: 'active', label: 'Aktywny' },
  { value: 'paused', label: 'Wstrzymany' },
  { value: 'rejected', label: 'Odrzucony' },
]

export function AdminDriverStatus({ driverId, current }: { driverId: string; current: string }) {
  const router = useRouter()
  const [status, setStatus] = useState(current)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  async function save(next: string) {
    setSaving(true)
    setMsg(null)
    const res = await fetch(`/api/admin/drivers/${driverId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    }).catch(() => null)
    setSaving(false)
    if (res?.ok) {
      setStatus(next)
      setMsg({ kind: 'ok', text: 'Status zaktualizowany.' })
      router.refresh()
    } else {
      setMsg({ kind: 'err', text: 'Nie udało się zaktualizować statusu.' })
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {STATUSES.map(s => (
          <button
            key={s.value}
            type="button"
            onClick={() => save(s.value)}
            disabled={saving || s.value === status}
            className={`text-sm px-3 py-1.5 rounded-lg border transition disabled:opacity-100 ${
              s.value === status
                ? 'border-orange-500 bg-orange-500/15 text-orange-300 font-medium'
                : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white disabled:opacity-50'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      {msg && (
        <p className={`text-sm mt-2 ${msg.kind === 'ok' ? 'text-green-400' : 'text-red-400'}`}>{msg.text}</p>
      )}
    </div>
  )
}
