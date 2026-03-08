import { createSupabaseServerClient } from '@/lib/supabase-server'

export default async function SeasonTopTen() {
    const supabase = await createSupabaseServerClient()

    // Get current season
    const { data: currentSeason } = await supabase
        .from('seasons')
        .select('id')
        .order('year', { ascending: false })
        .limit(1)
        .single()

    if (!currentSeason) {
        return (
            <section>
                <h2 className="text-2xl font-bold mb-4">
                    Season Top 10 Performers
                </h2>
                <div>No active season.</div>
            </section>
        )
    }

    const { data } = await supabase
        .from('race_results')
        .select(`
      driver_id,
      race_points,
      stage_1_points,
      stage_2_points,
      drivers (
        first_name,
        last_name
      ),
      races!inner (
        season_id
      )
    `)
        .eq('races.season_id', currentSeason.id)

    const totals: Record<string, { name: string; points: number }> = {}

    for (const row of data ?? []) {
        const driver = Array.isArray(row.drivers)
            ? row.drivers[0]
            : row.drivers
        if (!driver) continue

        const total =
            (row.race_points ?? 0) +
            (row.stage_1_points ?? 0) +
            (row.stage_2_points ?? 0)

        if (!totals[row.driver_id]) {
            totals[row.driver_id] = {
                name: `${driver.first_name} ${driver.last_name}`,
                points: 0,
            }
        }

        totals[row.driver_id].points += total
    }

    const seasonLeaders = Object.values(totals)
        .sort((a, b) => b.points - a.points)
        .slice(0, 10)

    return (
        <section>
            <h2 className="text-2xl font-bold mb-4">
                Season Top 10 Performers
            </h2>

            <div className="bg-white border rounded overflow-hidden">
                <div className="bg-gray-100 p-3 font-semibold">
                    Cumulative Season Points
                </div>
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b">
                            <th className="p-2">Rank</th>
                            <th className="p-2">Driver</th>
                            <th className="p-2">Total Points</th>
                        </tr>
                    </thead>
                    <tbody>
                        {seasonLeaders.map((driver, index) => (
                            <tr key={index} className="border-b">
                                <td className="p-2 font-semibold">
                                    {index + 1}
                                </td>
                                <td className="p-2">
                                    {driver.name}
                                </td>
                                <td className="p-2 font-semibold">
                                    {driver.points}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}