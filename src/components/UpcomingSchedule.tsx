'use client'

import React, { useState, useEffect } from 'react'

type NascarRace = {
    race_id: number
    race_name: string
    track_name: string
    date_scheduled: string
    race_number: number
}

type RaceListResponse = {
    series_1: NascarRace[]
    series_2: NascarRace[]
    series_3: NascarRace[]
}

export default function UpcomingSchedule() {
    const [data, setData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const year = new Date().getFullYear()


        const fetchData = async () => {
            try {
                const response = await fetch(
                    "https://cf.nascar.com/cacher/2026/race_list_basic.json"
                )

                const data: RaceListResponse = await response.json()

                const today = new Date()

                const upcoming = data.series_1
                    .filter(r => new Date(r.date_scheduled) > today)
                    .slice(0, 10)

                setData(upcoming)

                setError(null)
            }
            catch (error: any) {
                setError(error.message)
                setData(null)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    return (
        <>
            <div>
                {isLoading && <p>Loading...</p>}
                {error && <p>Error: {error}</p>}
                {data && (
                    <>
                        <h2 className="text-2xl font-bold mb-4">Upcoming Schedule</h2>
                        <div className="bg-white border rounded overflow-hidden">
                            <div className="bg-gray-100 p-3 font-semibold">
                                Next 10 Races
                            </div>
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b">
                                        <th className="p-2">Track</th>
                                        <th className="p-2">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((race: any) => (
                                        <tr key={race.race_id} className="border-b">
                                            <td className="p-2">{race.track_name}</td>
                                            <td className="p-2">{new Date(race.date_scheduled).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </>
    )
}