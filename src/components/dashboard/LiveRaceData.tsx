import TeamData from '@/components/dashboard/TeamData'
import type { NascarLiveFeed, LeaderboardEntry } from '@/components/dashboard/NascarLiveFeed'

type NascarRace = {
  race_id: number
  race_name: string
  track_name: string
  date_scheduled: string
}

export default async function LiveRaceData() {
        const teamData = await TeamData()
        const today = new Date()
        const raceUrl = `https://cf.nascar.com/cacher/${today.getFullYear()}/race_list_basic.json`
    
        const raceResponse = await fetch(raceUrl)
        const raceData = await raceResponse.json()
        const todaysRace = raceData.series_1.find((race: NascarRace) => {
            const raceDate = new Date(race.date_scheduled)

            return(
                raceDate.getFullYear() === today.getFullYear() &&
                raceDate.getMonth() === today.getMonth() &&
                raceDate.getDay() === today.getDay()
            )
        })

        const raceId = todaysRace?.race_id
    
        const timestamp = new Date().getUTCSeconds()
        const url = `https://cf.nascar.com/cacher/live/series_1/${raceId}/live-feed.json?t=${Date.now()}`
        console.log(url)
        const response = await fetch(url)
    
        const data: NascarLiveFeed = await response.json()

        return (
            <>
                <table className="w-full text-left">
                <thead>
                    <tr className="border-b">
                        <th className="p-2">Pos</th>
                        <th className="p-2">Driver</th>
                    </tr>
                </thead>
                <tbody>
                    {data.leaderboard?.map((d, index) => (
                        <tr key={index} className="border-b">
                            <td>{index + 1 }</td>
                            <td>{d.driver_name}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </>
            )
}