'use client'

import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function LineupManager({
  team,
  roster,
  race,
  existingLineup,
  isLocked,
}: any)
 {
  const supabase = createSupabaseBrowserClient()

  const initialState = roster.map((driver: any) => {
    const lineupEntry = existingLineup.find(
      (l: any) => l.team_driver_id === driver.id
    )

    return {
      ...driver,
      slot_type: lineupEntry?.slot_type || 'bench',
    }
  })

  const [drivers, setDrivers] = useState(initialState)

    const toggleActive = (id: string) => {
        if (isLocked) return

        setDrivers((prev: any[]) =>
            prev.map((d) =>
                d.id === id
                    ? { ...d, slot_type: d.slot_type === 'active' ? 'bench' : 'active' }
                    : d
            )
        )
    }


  const saveLineup = async () => {
      if (isLocked) {
          alert('Lineup is locked.')
          return
      }

    const activeCount = drivers.filter(
      (d: { slot_type: string }) => d.slot_type === 'active'
    ).length

    if (activeCount !== 3) {
      alert('You must select exactly 3 active drivers.')
      return
    }

    // Clear existing lineup
    await supabase
      .from('lineups')
      .delete()
      .eq('race_id', race.id)
      .eq('team_id', team.id)

    // Insert new lineup
    const inserts = drivers.map((d : {id : string, slot_type: string}) => ({
      race_id: race.id,
      team_id: team.id,
      team_driver_id: d.id,
      slot_type: d.slot_type,
    }))

    const { error } = await supabase.from('lineups').insert(inserts)

    if (error) {
      alert('Error saving lineup.')
    } else {
      alert('Lineup saved.')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        Set Lineup — {race?.name}
      </h1>

      <div className="space-y-3">
        {drivers.map((driver: { id: string; drivers: { first_name: string; last_name: string; car_number: string;}, slot_type: string }) => (
          <div
            key={driver.id}
            className="border p-4 rounded flex justify-between items-center bg-white"
          >
            <div>
              <p className="font-semibold">
                {driver.drivers.first_name} {driver.drivers.last_name}
              </p>
              <p className="text-sm text-gray-500">
                #{driver.drivers.car_number}
              </p>
            </div>

            <button
              onClick={() => toggleActive(driver.id)}
              className={`px-3 py-1 rounded ${
                driver.slot_type === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200'
              }`}
            >
              {driver.slot_type === 'active'
                ? 'Active'
                : 'Bench'}
            </button>
          </div>
        ))}
      </div>

          <button
              onClick={saveLineup}
              disabled={isLocked}
              className={`px-4 py-2 rounded ${isLocked
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-black text-white'
                  }`}
          >
              {isLocked ? 'Lineup Locked' : 'Save Lineup'}
          </button>

    </div>
  )
}
