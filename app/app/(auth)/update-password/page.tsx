'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/browser'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Hasło musi mieć co najmniej 8 znaków.')
      return
    }
    if (password !== confirm) {
      setError('Hasła nie są identyczne.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setError('Nie udało się zmienić hasła. Link mógł wygasnąć — poproś o nowy.')
        setLoading(false)
        return
      }
      setDone(true)
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 1500)
    } catch {
      setError('Błąd połączenia. Sprawdź internet i spróbuj ponownie.')
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-white mb-2">Hasło zmienione</h1>
          <p className="text-gray-400">Przekierowujemy Cię do panelu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            Ad<span className="text-orange-500">Ride</span>
          </h1>
          <p className="text-gray-400 mt-2">Ustaw nowe hasło</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nowe hasło</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition"
                placeholder="Min. 8 znaków"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Powtórz hasło</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition"
                placeholder="Powtórz nowe hasło"
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
              {loading ? 'Zapisywanie...' : 'Zmień hasło'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            <Link href="/login" className="text-orange-500 hover:text-orange-400">
              ← Wróć do logowania
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
