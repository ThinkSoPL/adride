'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface NavItem {
  href: string
  label: string
  icon: string
}

export function MobileNav({
  nav,
  fullName,
  email,
  roleLabel,
}: {
  nav: NavItem[]
  fullName: string | null
  email: string
  roleLabel: string
}) {
  const [open, setOpen] = useState(false)

  // Zablokuj scroll tła gdy drawer otwarty
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Zamknij na Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Otwórz menu"
        aria-expanded={open}
        className="p-2 -ml-2 text-gray-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500 rounded-lg"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Overlay + Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu nawigacji">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-0 left-0 bottom-0 w-72 max-w-[80vw] bg-gray-900 border-r border-gray-800 p-5 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <Link href="/dashboard" className="text-2xl font-bold" onClick={() => setOpen(false)}>
                Ad<span className="text-orange-500">Ride</span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Zamknij menu"
                className="p-2 -mr-2 text-gray-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500 rounded-lg"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <nav className="space-y-1 flex-1">
              {nav.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
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
                <div className="text-xs text-gray-500">{roleLabel}</div>
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
          </div>
        </div>
      )}
    </>
  )
}
