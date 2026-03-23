'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

type Driver = {
    id: string
    first_name: string
    last_name: string
    points: number
}

type Props = {
    roster: Driver[]
    freeAgents: Driver[]
    totals: Record<string, number>
    teamId: string
    leagueId: string
}

async function getData(teamId: string, leagueId: string) {
    const supabase = createSupabaseBrowserClient()
    const { data, error } = await supabase.from('waiver_claims').select(
        `id,
            team_id,
            league_id,
            status,
            teams!inner (
                name)`
    )
        .eq('league_id', leagueId)
        .eq('team_id', teamId)
        .eq('status', 'pending')

    console.log(data?.length);
    return data;
}

export default function WaiverClient({
    roster,
    freeAgents,
    totals,
    teamId,
    leagueId
}: Props) {
    const supabase = createSupabaseBrowserClient()
    const router = useRouter()

    const [dropId, setDropId] = useState<string | null>(null)
    const [addId, setAddId] = useState<string | null>(null)
    const [waiversExist, setWaiversExist] = useState<boolean>(false)

    const rosterWithPts = roster.map(d => ({
        id: d.id,
        first_name: d.first_name,
        last_name: d.last_name,
        points: totals[d.id]
    }))

    const freeAgentsWithPts = freeAgents.map(d => ({
        id: d.id,
        first_name: d.first_name,
        last_name: d.last_name,
        points: totals[d.id]
    }))

    getData(teamId, leagueId).then((data) => {
        if (data && data.length > 0) {
            setWaiversExist(true)
        }
    })

    const submitClaim = async () => {
        if (!dropId || !addId) return

        await supabase.from('waiver_claims').insert({
            league_id: leagueId,
            team_id: teamId,
            drop_driver_id: dropId,
            add_driver_id: addId,
        })

        alert('Waiver claim submitted')

        router.refresh()
    }

    return (
        <div className="space-y-8">

            {
                waiversExist && (
                    <h1>Only one waiver claim can be submitted at a time</h1>
                )
            }

            {
                !waiversExist && (
                    <>
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        {rosterWithPts.sort((a, b) => b.points - a.points).map(driver => (
                                            <tr key={driver.id} className={dropId === driver.id ? "border-b bg-red-200 font-bold" : "border-b"}>
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
                                                    {driver.points ?? 0}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

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
                                        {freeAgentsWithPts.sort((a, b) => b.points - a.points).map(driver => (
                                            <tr key={driver.id} className={addId === driver.id ? "border-b bg-green-200 font-bold" : "border-b"}>
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
                                                    {driver.points ?? 0}
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
                    </>
                )
            }

        </div>
    )
}