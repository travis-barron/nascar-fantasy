'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function WaiverForm({
  team,
  roster,
  availableDrivers,
  existingClaim,
}: any) {
  const supabase = createSupabaseBrowserClient()

  const [addDriver, setAddDriver] = useState('')
  const [dropDriver, setDropDriver] = useState('')

  if (existingClaim) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Waiver Claim</h1>
        <p>You already have a pending waiver claim.</p>
      </div>
    )
  }

  const submitClaim = async () => {
    if (!addDriver || !dropDriver) {
      alert('Select both add and drop drivers.')
      return
    }

    const { error } = await supabase
      .from('waiver_claims')
      .insert({
        league_id: team.league_id,
        team_id: team.id,
        add_driver_id: addDriver,
        drop_team_driver_id: dropDriver,
      })

    if (error) {
      console.error(error)
      alert('Error submitting claim.')
    } else {
      alert('Waiver claim submitted.')
      location.reload()
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Submit Waiver Claim</h1>

      <div>
        <label className="block mb-2">Add Driver</label>
        <select
          value={addDriver}
          onChange={(e) => setAddDriver(e.target.value)}
          className="border p-2 w-full"
        >
          <option value="">Select Driver</option>
          {availableDrivers.map((d: any) => (
            <option key={d.id} value={d.id}>
              {d.first_name} {d.last_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block mb-2">Drop Driver</label>
        <select
          value={dropDriver}
          onChange={(e) => setDropDriver(e.target.value)}
          className="border p-2 w-full"
        >
          <option value="">Select Driver</option>
          {roster.map((r: any) => (
            <option key={r.id} value={r.id}>
              {r.drivers.first_name} {r.drivers.last_name}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={submitClaim}
        className="bg-black text-white px-4 py-2 rounded"
      >
        Submit Claim
      </button>
    </div>
  )
}
