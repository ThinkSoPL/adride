import Link from 'next/link'
import type { ReactNode } from 'react'
import type { UserRole } from '@/lib/auth/session'

interface NavItem {
  href: string
  label: string
  icon: string
}

const NAV: Record<UserRole, NavItem[]> = {
  driver: [
    { href: '/dashboard/driver', label: 'Pulpit', icon: '📊' },
    { href: '/dashboard/driver#vehicles', label: 'Moje pojazdy', icon: '🚗' },
    { href: '/dashboard/driver#earnings', label: 'Zarobki', icon: '💰' },
  ],
  advertiser: [
    { href: '/dashboard/advertiser', label: 'Pulpit', icon: '📊' },
    { href: '/dashboard/advertiser#campaigns', label: 'Kampanie', icon: '📢' },
    { href: '/kalkulator', label: 'Kalkulator', icon: '🧮' },
  ],
  admin: [
    { href: '/admin', label: 'Pulpit', icon: '📊' },
    { href: '/admin#drivers', label: 'Kierowcy', icon: '🚗' },
    { href: '/admin#campaigns', label: 'Kampanie', icon: '📢' },
  ],
}

const ROLE_LABEL: Record<UserRole, string> = {
  driver: 'Kierowca',
  advertiser: 'Reklamodawca',
  admin: 'Administrator',
}

export function DashboardShell({
  role,
  fullName,
  email,
  children,
}: {
  role: UserRole
  fullName: string | null
  email: string
  children: ReactNode
}) {
  const nav = NAV[role]

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 bg-gray-900 border-r border-gray-800 p-5">
        <Link href="/dashboard" className="text-2xl font-bold mb-8">
          Ad<span className="text-orange-500">Ride</span>
        </Link>
        <nav className="space-y-1 flex-1">
          {nav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition"
            >
              <span>{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="border-t border-gray-800 pt-4 mt-4">
          <div className="px-3 mb-3">
            <div className="text-sm font-medium text-white truncate">{fullName || email}</div>
            <div className="text-xs text-gray-500">{ROLE_LABEL[role]}</div>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition"
            >
              ↩ Wyloguj
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Topbar (mobile) */}
        <header className="md:hidden flex items-center justify-between bg-gray-900 border-b border-gray-800 px-4 py-3">
          <Link href="/dashboard" className="text-xl font-bold">
            Ad<span className="text-orange-500">Ride</span>
          </Link>
          <form action="/auth/signout" method="post">
            <button type="submit" className="text-sm text-gray-400">Wyloguj</button>
          </form>
        </header>

        <main className="flex-1 p-5 md:p-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  )
}
