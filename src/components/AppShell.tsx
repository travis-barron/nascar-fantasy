'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useEffect, useState } from 'react'


export default function AppShell({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  if (pathname === '/login') {
    return <>{children}</>
  }

  const supabase = createSupabaseBrowserClient()

  const navItem = (href: string, label: string) => {
    const active = pathname === href

    return (
      <Link
        href={href}
        className={`block px-4 py-2 rounded ${active
            ? 'bg-black text-white'
            : 'text-gray-600 hover:bg-gray-100'
          }`}
      >
        {label}
      </Link>
    )
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const [leagueName, setLeagueName] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetch('/api/league')
      .then(res => res.json())
      .then(data => setLeagueName(data.name))
  }, [])

  return (
    <div>
      <div className="text-gray-600 flex min-h-screen">
        {/* Sidebar */}
        <div className="hidden md:flex ">
          <aside className="w-64 border-r bg-white p-4 space-y-4">
            <h2 className="text-xl font-bold">
              {leagueName || 'NASCAR League'}
            </h2>

            <nav className="space-y-2">
              {navItem('/', 'Dashboard')}
              {navItem('/my-team', 'My Team')}
              {navItem('/standings', 'Standings')}
              {navItem('/waivers', 'Waivers')}
              {navItem('/commissioner', 'Commissioner')}
            </nav>

            <button
              onClick={handleLogout}
              className="mt-8 text-sm text-red-600 hover:underline"
            >
              Logout
            </button>
          </aside>
        </div>

        {/* Main Content */}
        <main className="flex-1 bg-gray-100 p-8">{children}</main>
      </div>
    </div>
  )
}
