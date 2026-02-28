'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function Sidebar() {
  const supabase = createSupabaseBrowserClient()

  const router = useRouter()

  const handleLogout = async () => {
    console.log('Logout clicked')
    const {error} = await supabase.auth.signOut()

    console.log('Sign out result:', error)
    router.refresh()
  }

  return (
    <div className="w-64 bg-white border-r min-h-screen fixed p-6 space-y-6 text-gray-600">
      <div className="text-xl font-bold">
        NASCAR Fantasy
      </div>

      <nav className="flex flex-col gap-4">
        <Link href="/">Dashboard</Link>
        <Link href="/standings">Standings</Link>
        <Link href="/my-team">My Team</Link>
        <Link href="/waivers">Waivers</Link>
        <Link href="/trades">Trade Hub</Link>
        <Link href="/commissioner">Commissioner</Link>
      </nav>

      <button
        onClick={handleLogout}
        className="mt-8 text-red-600 hover:underline text-left"
      >
        Logout
      </button>
    </div>
  )
}
