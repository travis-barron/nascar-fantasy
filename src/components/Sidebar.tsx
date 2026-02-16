'use client'

import Link from 'next/link'

export default function Sidebar() {
  return (
    <div className="w-64 bg-white border-r min-h-screen p-6 space-y-6 text-gray-600">
      <div className="text-xl font-bold">
        NASCAR Fantasy League
      </div>

      <nav className="flex flex-col gap-4">
        <Link href="/">Dashboard</Link>
        <Link href="/standings">Standings</Link>
        <Link href="/my-team">My Team</Link>
        <Link href="/waivers">Waivers</Link>
        <Link href="/commissioner">Commissioner</Link>
      </nav>
    </div>
  )
}
