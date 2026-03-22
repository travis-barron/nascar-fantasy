'use client'

import React, { useState, useEffect } from 'react'
import TeamData from '@/components/dashboard/TeamData'
import LiveRaceData from './LiveRaceData'
import {LeaderboardEntry} from '@/components/dashboard/NascarLiveFeed'

export default function LiveLeaderboard() {
    useEffect(() => {
    const teamData = TeamData()
    const raceData = LiveRaceData()
    })

    return (
        <>
            <LiveRaceData />
        </>
    )
}