'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/browser'
import { sendToWebhook } from '@/lib/tracking/webhook'

type Role = 'driver' | 'advertiser'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [role, setRole] = useState<Role>('driver')

  // Wstępny wybór roli z linku, np. /register?role=advertiser
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('role')
    if (param === 'driver' || param === 'advertiser') setRole(param)
  }, [])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState(false)
  const formStartedAt = useRef<number | undefined>(undefined)

  function markFormStart() {
    if (!formStartedAt.current) formStartedAt.current = Date.now()
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
            role,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      })

      if (error) {
        const SUPABASE_ERRORS: Record<string, string> = {
          'User already registered': 'Konto z tym emailem już istnieje.',
          'Password should be at least 6 characters': 'Hasło musi mieć co najmniej 8 znaków.',
          'Unable to validate email address: invalid format': 'Podaj poprawny adres email.',
        }
        setError(SUPABASE_ERRORS[error.message] ?? 'Wystąpił błąd rejestracji. Spróbuj ponownie.')
        setLoading(false)
        return
      }

      sendToWebhook('register', { name: fullName, email, phone, rola: role }, formStartedAt.current)

      if (!data.session) {
        setConfirmEmail(true)
        setLoading(false)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Błąd połączenia. Sprawdź internet i spróbuj ponownie.')
      setLoading(false)
    }
  }

  if (confirmEmail) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-5xl mb-4">📬</div>
          <h1 className="text-2xl font-bold text-white mb-2">Sprawdź swoją skrzynkę</h1>
          <p className="text-gray-400 mb-6">
            Wysłaliśmy link potwierdzający na <span className="text-white">{email}</span>.
            Kliknij go, aby aktywować konto, a następnie zaloguj się.
          </p>
          <Link
            href="/login"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg transition"
          >
            Przejdź do logowania
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            Ad<span className="text-orange-500">Ride</span>
          </h1>
          <p className="text-gray-400 mt-2">Dołącz do platformy</p>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setRole('driver')}
            className={`p-4 rounded-xl border-2 text-center transition ${
              role === 'driver'
                ? 'border-orange-500 bg-orange-500/10'
                : 'border-gray-700 bg-gray-900 hover:border-gray-600'
            }`}
          >
            <div className="text-2xl mb-1">🚗</div>
            <div className={`font-semibold text-sm ${role === 'driver' ? 'text-orange-400' : 'text-gray-300'}`}>
              Kierowca
            </div>
            <div className="text-xs text-gray-400 mt-1">Zarabiaj na reklamach</div>
          </button>
          <button
            type="button"
            onClick={() => setRole('advertiser')}
            className={`p-4 rounded-xl border-2 text-center transition ${
              role === 'advertiser'
                ? 'border-orange-500 bg-orange-500/10'
                : 'border-gray-700 bg-gray-900 hover:border-gray-600'
            }`}
          >
            <div className="text-2xl mb-1">📢</div>
            <div className={`font-semibold text-sm ${role === 'advertiser' ? 'text-orange-400' : 'text-gray-300'}`}>
              Reklamodawca
            </div>
            <div className="text-xs text-gray-400 mt-1">Reklamuj swoją firmę</div>
          </button>
        </div>

        {/* Form */}
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Imię i nazwisko
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => { markFormStart(); setFullName(e.target.value) }}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition"
                placeholder="Jan Kowalski"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Telefon
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition"
                placeholder="+48 600 000 000"
              />
            </div>

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
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Hasło
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition"
                placeholder="Min. 8 znaków"
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
              {loading ? 'Rejestracja...' : `Zarejestruj jako ${role === 'driver' ? 'Kierowca' : 'Reklamodawca'}`}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            Masz już konto?{' '}
            <Link href="/login" className="text-orange-500 hover:text-orange-400">
              Zaloguj się
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
