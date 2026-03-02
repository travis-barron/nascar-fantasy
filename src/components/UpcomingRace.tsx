'use client'

import { useState } from 'react'
import LocalTime from '@/components/LocalTime'

type RaceInfo = {
    name: string,
    track_name: string,
    track_length: number,
    track_type: string,
    lineup_lock_time: string
}

type Props = {
    race: RaceInfo
}

export default function UpcomingRace({ race}: Props) {
    return (
        <>
            <h2 className="text-2xl font-bold mb-4">Next Race</h2>
            {race ? (
                <div className="bg-white border rounded p-4">
                    <div className="font-semibold text-xl">
                        {race.name}
                    </div>
                    <div className="font-semibold text-gray-600">
                        {race.track_name} | {race.track_length} mile {race.track_type}
                    </div>
                    <div className="text-sm mt-2">
                        Lineup Lock: <LocalTime timestamp={race.lineup_lock_time} />
                    </div>
                </div>
            ) : (
                <div>No upcoming races scheduled.</div>
            )}
        </>
    )
}