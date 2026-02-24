'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function AddRaceForm() {
  const supabase = createSupabaseBrowserClient()
  const router = useRouter()

  const [name, setName] = useState('')
  const [trackName, setTrackName] = useState('')
  const [raceNumber, setRaceNumber] = useState<number>(1)
  const [raceDate, setRaceDate] = useState('')
  const [lineupLockTime, setLineupLockTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { data: season } = await supabase
      .from('seasons')
      .select('id')
      .order('year', { ascending: false })
      .limit(1)
      .single()

    if (!season) {
      setMessage('No active season found.')
      setLoading(false)
      return
    }

    const isoLockTime = new Date(lineupLockTime).toISOString()

    const { error } = await supabase.from('races').insert({
      name,
      track_name: trackName,
      race_number: raceNumber,
      race_date: raceDate,
      lineup_lock_time: isoLockTime,
      season_id: season.id,
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Race added successfully.')
      setName('')
      setTrackName('')
      setRaceNumber(raceNumber + 1)
      setRaceDate('')
      setLineupLockTime('')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Add New Race</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Race Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full border rounded p-2"
        />

        <input
          type="text"
          placeholder="Track Name"
          value={trackName}
          onChange={(e) => setTrackName(e.target.value)}
          required
          className="w-full border rounded p-2"
        />

        <input
          type="number"
          placeholder="Race Number"
          value={raceNumber}
          onChange={(e) => setRaceNumber(Number(e.target.value))}
          required
          className="w-full border rounded p-2"
        />

        <input
          type="date"
          value={raceDate}
          onChange={(e) => setRaceDate(e.target.value)}
          required
          className="w-full border rounded p-2"
        />

        <input
          type="datetime-local"
          value={lineupLockTime}
          onChange={(e) => setLineupLockTime(e.target.value)}
          required
          className="w-full border rounded p-2"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? 'Adding...' : 'Add Race'}
        </button>

        {message && <div className="text-sm">{message}</div>}
      </form>
    </div>
  )
}