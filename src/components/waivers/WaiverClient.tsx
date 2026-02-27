'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

type Driver = {
    id: string
    first_name: string
    last_name: string
}

type Props = {
    roster: Driver[]
    freeAgents: Driver[]
    totals: Record<string, number>
    teamId: string
}

export default function WaiverClient({
    roster,
    freeAgents,
    totals,
    teamId,
}: Props) {
    const supabase = createSupabaseBrowserClient()
    const router = useRouter()

    const [dropId, setDropId] = useState<string | null>(null)
    const [addId, setAddId] = useState<string | null>(null)

    const submitClaim = async () => {
        if (!dropId || !addId) return

        await supabase.from('waiver_claims').insert({
            team_id: teamId,
            drop_driver_id: dropId,
            add_driver_id: addId,
        })

        router.refresh()
    }

    return (
        <div className="space-y-8">

            {/* YOUR ROSTER */}
            <section>
                <div className="bg-white p-4 rounded-xl shadow-sm border overflow-hidden">
                    <h2 className="text-xl font-bold mb-4">Team Roster</h2>
                    <span className="mb-4">Select a driver to drop</span>

                    <table className="w-full border rounded overflow-hidden">
                        <thead>
                            <tr className="border-b bg-gray-100">
                                <th className="p-2">Select</th>
                                <th className="p-2">Driver</th>
                                <th className="p-2">Season Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roster.map(driver => (
                                <tr key={driver.id} className="border-b">
                                    <td className="p-2">
                                        <input
                                            type="radio"
                                            name="drop"
                                            onChange={() => setDropId(driver.id)}
                                        />
                                    </td>
                                    <td className="p-2">
                                        {driver.first_name} {driver.last_name}
                                    </td>
                                    <td className="p-2 font-semibold">
                                        {totals[driver.id] ?? 0}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* FREE AGENTS */}
            <section>
                <div className="bg-white p-4 rounded-xl shadow-sm border overflow-hidden">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Free Agents</h2>
                    <span className="mb-4">Select a driver to add</span>
                    <br />
                    <table className="w-full border rounded overflow-hidden">
                        <thead>
                            <tr className="border-b bg-gray-100">
                                <th className="p-2">Select</th>
                                <th className="p-2">Driver</th>
                                <th className="p-2">Season Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            {freeAgents.map(driver => (
                                <tr key={driver.id} className="border-b">
                                    <td className="p-2">
                                        <input
                                            type="radio"
                                            name="add"
                                            onChange={() => setAddId(driver.id)}
                                        />
                                    </td>
                                    <td className="p-2">
                                        {driver.first_name} {driver.last_name}
                                    </td>
                                    <td className="p-2 font-semibold">
                                        {totals[driver.id] ?? 0}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <button
                onClick={submitClaim}
                className="bg-blue-600 text-white px-4 py-2 rounded"
            >
                Submit Waiver Claim
            </button>
        </div>
    )
}