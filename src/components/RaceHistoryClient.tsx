'use client'

import { useState } from 'react'
import { RaceResultsModal } from './RaceResultsModal'

type RaceHistory = {
    id: string
    total_points: number
    race_name: string
    race_number: number
    rank: number
}

type Props = {
    races: RaceHistory[]
}

export default function RaceHistoryClient({ races }: Props) {
    const [selectedRace, setSelectedRace] = useState<string | null>(null)

    return (
        <>
            <div className="bg-white p-4 rounded-xl shadow-sm border overflow-hidden">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Race History
                </h2>

                <div className="border rounded bg-white">
                    <div className="grid grid-cols-3 p-4 bg-gray-100 text-sm font-semibold uppercase tracking-wide text-gray-600">
                        <div>Race Name</div>
                        <div>Points Earned</div>
                        <div>Rank</div>
                    </div>
                    {races?.sort((a, b) => { return a.race_number - b.race_number }).map((race, idx) => (
                        <div
                            key={idx}
                            className={`grid grid-cols-3 p-4 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                                }`}
                        >
                            <div><button
                                key={race.id}
                                onClick={() => { setSelectedRace(race.id); }}
                                className="text-blue-600 hover:underline"
                            >
                                {race.race_name}
                            </button></div>
                            <div>{race.total_points}</div>
                            <div>{race.rank} {race.rank == 1 ? <span className="text-yellow-500 text-lg">🏆</span> : ''}</div>
                        </div>
                    ))}
                </div>
            </div>

            <RaceResultsModal
                raceId={selectedRace ?? ''}
                open={!!selectedRace}
                onClose={() => setSelectedRace(null)}
                myTeamId={''}
            />
        </>
    )
}