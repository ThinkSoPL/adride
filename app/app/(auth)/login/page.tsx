'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/browser'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setError('Nieprawidłowy email lub hasło')
        setLoading(false)
        return
      }

      const params = new URLSearchParams(window.location.search)
      const redirectTo = params.get('redirectTo')
      const safeRedirect =
        redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')
          ? redirectTo
          : '/dashboard'
      router.push(safeRedirect)
      router.refresh()
    } catch {
      setError('Błąd połączenia. Sprawdź internet i spróbuj ponownie.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            Ad<span className="text-orange-500">Ride</span>
          </h1>
          <p className="text-gray-400 mt-2">Zaloguj się do panelu</p>
        </div>

        {/* Form */}
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition"
                placeholder="twoj@email.pl"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">Hasło</label>
                <Link href="/forgot-password" className="text-xs text-orange-500 hover:text-orange-400">
                  Zapomniałem hasła
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition"
                placeholder="••••••••"
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
              {loading ? 'Logowanie...' : 'Zaloguj się'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            Nie masz konta?{' '}
            <Link href="/register" className="text-orange-500 hover:text-orange-400">
              Zarejestruj się
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
