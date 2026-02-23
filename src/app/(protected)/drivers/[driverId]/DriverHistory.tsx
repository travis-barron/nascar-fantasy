'use client'

import { useEffect, useState } from 'react'

type Season = {
  id: string
  year: number
}

type Props = {
  driverId: string
  seasons: Season[]
}

export default function DriverHistory({
  driverId,
  seasons,
}: Props) {
  const [selectedSeason, setSelectedSeason] = useState(
    seasons[0]?.id
  )
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedSeason) return

    const fetchResults = async () => {
      setLoading(true)

      const res = await fetch(
        `/api/driver-history?driverId=${driverId}&seasonId=${selectedSeason}`
      )

      const data = await res.json()
      setResults(data ?? [])
      setLoading(false)
    }

    fetchResults()
  }, [selectedSeason, driverId])

  const seasonTotal = results.reduce((acc, r) => {
    return (
      acc +
      (r.race_points ?? 0) +
      (r.stage_1_points ?? 0) +
      (r.stage_2_points ?? 0)
    )
  }, 0)

  return (
    <div>
      {/* Season Selector */}
      <div className="mb-4">
        <label className="mr-2 font-semibold">Season:</label>
        <select
          value={selectedSeason}
          onChange={(e) => setSelectedSeason(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          {seasons.map((season) => (
            <option key={season.id} value={season.id}>
              {season.year}
            </option>
          ))}
        </select>
      </div>

      {/* Season Total */}
      <div className="mb-6 text-lg">
        Season Total:{' '}
        <span className="font-semibold">{seasonTotal}</span>
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Race</th>
              <th className="p-2">Finish</th>
              <th className="p-2">Stage 1</th>
              <th className="p-2">Stage 2</th>
              <th className="p-2">Finish Points</th>
              <th className="p-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-4" colSpan={5}>
                  Loading...
                </td>
              </tr>
            ) : (
              results.map((r) => {
                const total =
                  (r.race_points ?? 0) +
                  (r.stage_1_points ?? 0) +
                  (r.stage_2_points ?? 0)

                return (
                  <tr key={r.race_id} className="border-t">
                    <td className="p-2">{r.race_name}</td>
                    <td className="p-2">{r.finish_position}</td>
                    <td className="p-2">{r.stage_1_points}</td>
                    <td className="p-2">{r.stage_2_points}</td>
                    <td className="p-2">{r.race_points}</td>
                    <td className="p-2 font-semibold">
                      {total}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
