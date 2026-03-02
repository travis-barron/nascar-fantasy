'use client'

import { useEffect, useState } from 'react'
import Modal from './Modal'

type Props = {
  driverId: string
  seasonId: string
  driverName: string | null
  open: boolean
  onClose: () => void
}

export default function DriverHistoryModal({
  driverId,
  seasonId,
  driverName,
  open,
  onClose,
}: Props) {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return

    const fetchHistory = async () => {
      setLoading(true)

      const res = await fetch(
        `/api/driver-history?driverId=${driverId}&seasonId=${seasonId}`
      )

      const data = await res.json()
      setResults(data ?? [])
      setLoading(false)
    }

    fetchHistory()
  }, [open, driverId])

  const seasonTotal = results.reduce((acc, r) => {
    return (
      acc +
      (r.race_points ?? 0) +
      (r.stage_1_points ?? 0) +
      (r.stage_2_points ?? 0)
    )
  }, 0)

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-2xl font-bold mb-4">
        {driverName ?? 'Driver History'}
      </h2>

      <div className="mb-4">
        Season Total: <span className="font-semibold">{seasonTotal}</span>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Race</th>
                <th className="p-2">Track</th>
                <th className="p-2">Track Type</th>
                <th className="p-2">Track Length</th>
                <th className="p-2">Finish</th>
                <th className="p-2">Stage 1</th>
                <th className="p-2">Stage 2</th>
                <th className="p-2">Race Points</th>
                <th className="p-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => {
                const total =
                  (r.race_points ?? 0) +
                  (r.stage_1_points ?? 0) +
                  (r.stage_2_points ?? 0)

                return (
                  <tr key={r.race_id} className="border-t">
                    <td className="p-2">{r.race_name}</td>
                    <td className="p-2">{r.track_name}</td>
                    <td className="p-2">{r.track_type}</td>
                    <td className="p-2">{r.track_length} miles</td>
                    <td className="p-2">{r.finish_position}</td>
                    <td className="p-2">{r.stage_1_points}</td>
                    <td className="p-2">{r.stage_2_points}</td>
                    <td className="p-2">{r.race_points}</td>
                    <td className="p-2 font-semibold">{total}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  )
}
