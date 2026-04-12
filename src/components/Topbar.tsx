'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import Image from 'next/image'

export default function TopBar() {
  const [open, setOpen] = useState(false)
    const supabase = createSupabaseBrowserClient()
  
    const router = useRouter()
  
    const handleLogout = async () => {
      console.log('Logout clicked')
      const {error} = await supabase.auth.signOut()
  
      console.log('Sign out result:', error)
      router.refresh()
    }

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white text-gray-600">
        <div className="font-bold">
          NASCAR Fantasy
        </div>

        <button
          className="text-2xl"
          onClick={() => setOpen(true)}
        >
          ☰
        </button>
      </div>

      {/* Drawer */}
      <div
        className={`fixed inset-0 z-40 bg-black bg-opacity-40 transition-opacity text-gray-600 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
      >
        <div
          className={`fixed top-0 right-0 w-64 h-full bg-white shadow-lg p-6 space-y-6 transform transition-transform duration-300 ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center p-0 bg-black">
                    <Image src="/logo.png" alt="logo" width={200} height={21} className="bg-black"></Image>
                  </div>
          <button
            className="text-xl mb-4"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>

          <nav className="flex flex-col gap-4 text-lg">
            <Link href="/" onClick={() => setOpen(false)}>
              Dashboard
            </Link>
            <Link href="/standings" onClick={() => setOpen(false)}>
              Standings
            </Link>
            <Link href="/my-team" onClick={() => setOpen(false)}>
              My Team
            </Link>
            <Link href="/waivers" onClick={() => setOpen(false)}>
              Waivers
            </Link>
            <Link href="/trades" onClick={() => setOpen(false)}>
              Trade Hub
            </Link>
            <Link href="/commissioner" onClick={() => setOpen(false)}>Commissioner</Link>
            <Link href="#" onClick={handleLogout} className="mt-8 text-red-600">Logout</Link>
          </nav>
        </div>
      </div>
    </>
  )
}
