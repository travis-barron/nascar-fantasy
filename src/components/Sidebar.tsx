'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import Image from 'next/image'

export default function Sidebar() {
  const supabase = createSupabaseBrowserClient()

  const router = useRouter()

  const handleLogout = async () => {
    console.log('Logout clicked')
    const { error } = await supabase.auth.signOut()

    console.log('Sign out result:', error)
    router.refresh()
  }

  return (
    <>
      <div className="w-64 bg-white border-r min-h-screen fixed space-y-3 text-gray-600">
        <div className="text-center p-6 bg-black">
          <Image src="/logo.png" alt="logo" width={200} height={21} className="bg-black"></Image>
        </div>
        <div className="px-6 space-y-6">
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
      </div>
    </>
  )
}
