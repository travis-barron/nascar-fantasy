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
  const [nascar_race_id, setNascarRaceId] = useState('')
  const [raceDate, setRaceDate] = useState('')
  const [lineupLockTime, setLineupLockTime] = useState('')
  const [track_type, setTrackType] = useState('')
  const [track_length, setTrackLength] = useState('')
  const [stage_1_length, setStage1Length] = useState('')
  const [stage_2_length, setStage2Length] = useState('')
  const [stage_3_length, setStage3Length] = useState('')
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

    const { data, error } = await supabase.from('races').insert({
      name,
      track_name: trackName,
      race_number: raceNumber,
      nascar_race_id: nascar_race_id,
      race_date: raceDate,
      lineup_lock_time: isoLockTime,
      season_id: season.id,
    })
    .select("id")
    .single()

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

  const addStageData = async (raceId: string) => {
    const { error } = await supabase.from('race_stages').insert([
      { race_id: raceId, stage_number: 1, ending_lap: stage_1_length },
      { race_id: raceId, stage_number: 2, ending_lap: stage_2_length }
    ]);

    if (stage_3_length.length > 0)
    {
      const {error} = await supabase.from('race_stages').insert([
        { race_id: raceId, stage_number: 3, ending_lap: stage_3_length }
      ])
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Add New Race</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label htmlFor="raceName">Race Name:</label>
        <input
          type="text"
          placeholder="Race Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full border rounded p-2"
          id="raceName"
        />

        <label htmlFor="trackName">Track Name:</label>
        <input
          type="text"
          placeholder="Track Name"
          value={trackName}
          onChange={(e) => setTrackName(e.target.value)}
          required
          className="w-full border rounded p-2"
          id="trackName"
        />

        <label htmlFor="raceNum">Race Number:</label>
        <input
          type="number"
          placeholder="Race Number"
          value={raceNumber}
          onChange={(e) => setRaceNumber(Number(e.target.value))}
          required
          className="w-full border rounded p-2"
          id="raceNumber"
        />

        <label htmlFor="raceId">NASCAR Race ID:</label>
        <input 
          type="text"
          placeholder="NASCAR Race ID"
          value={nascar_race_id}
          onChange={((e) => setNascarRaceId(e.target.value))}
          required
          className="w-full border rounded p-2"
          id="raceId"
        />

        <label htmlFor="trackType">Track Type:</label>
        <input 
          type="text"
          placeholder="Track Type"
          value={track_type}
          onChange={((e) => setTrackType(e.target.value))}
          required
          className="w-full border rounded p-2"
          id="trackType"
        />

        <label htmlFor="trackLength">Track Length (in miles):</label>
        <input 
          type="text"
          placeholder="Track Length (in miles)"
          value={track_length}
          onChange={((e) => setTrackLength(e.target.value))}
          required
          className="w-full border rounded p-2"
          id="trackLength"
        />

        <label htmlFor="stage1Length">Stage 1 Length:</label>
        <input 
          type="text"
          placeholder="Stage 1 Length"
          value={stage_1_length}
          onChange={((e) => setStage1Length(e.target.value))}
          required
          className="w-full border rounded p-2"
          id="stage1Length"
        />

        <label htmlFor="stage2Length">Stage 2 Length:</label>
        <input 
          type="text"
          placeholder="Stage 2 Length"
          value={stage_2_length}
          onChange={((e) => setStage2Length(e.target.value))}
          required
          className="w-full border rounded p-2"
          id="stage2Length"
        />

        <label htmlFor="stage3Length">Stage 3 Length:</label>
        <input 
          type="text"
          placeholder="Stage 3 Length"
          value={stage_3_length}
          onChange={((e) => setStage3Length(e.target.value))}
          required
          className="w-full border rounded p-2"
          id="stage3Length"
        />

        <label htmlFor="raceDate">Race Date:</label>
        <input
          type="date"
          value={raceDate}
          onChange={(e) => setRaceDate(e.target.value)}
          required
          className="w-full border rounded p-2"
          id="raceDate"
        />

        <label htmlFor="lockDate">Race Lock Date and Time:</label>
        <input
          type="datetime-local"
          value={lineupLockTime}
          onChange={(e) => setLineupLockTime(e.target.value)}
          required
          className="w-full border rounded p-2"
          id="lockDate"
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