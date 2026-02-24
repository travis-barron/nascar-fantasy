import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import LocalTime from '@/components/LocalTime'
import SeasonTopTen from '@/components/SeasonTopTen'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 🔜 Next race
  const { data: nextRace } = await supabase
    .from('races')
    .select('*')
    .gte('lineup_lock_time', new Date().toISOString())
    .order('lineup_lock_time', { ascending: true })
    .limit(1)
    .single()

  // 🏁 Most recent completed race
  const { data: lastRace } = await supabase
    .from('races')
    .select('*')
    .lt('lineup_lock_time', new Date().toISOString())
    .order('lineup_lock_time', { ascending: false })
    .limit(1)
    .single()

  let topFinishers: any[] = []

  if (lastRace) {
    const { data: results } = await supabase
      .from('race_results')
      .select(`
        race_points,
        stage_1_points,
        stage_2_points,
        drivers (
          first_name,
          last_name
        )
      `)
      .eq('race_id', lastRace.id)
      .order('race_points', { ascending: false })
      .limit(10)

    topFinishers = results ?? []
  }

  return (
    <div className="space-y-10">

      {/* 🔜 NEXT RACE */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Next Race</h2>

        {nextRace ? (
          <div className="border rounded p-4">
            <div className="font-semibold text-lg">
              {nextRace.name}
            </div>
            <div className="text-sm text-gray-600">
              {nextRace.track_name}
            </div>
            <div className="text-sm mt-2">
              Lineup Lock: <LocalTime timestamp={nextRace.lineup_lock_time} />
            </div>
          </div>
        ) : (
          <div>No upcoming races scheduled.</div>
        )}
      </section>

      {/* Season Top 10 */}
      <section>
        <Suspense fallback={<div>Loading season leaders...</div>}>
          <SeasonTopTen />
        </Suspense>
      </section>

      {/* 🏁 LAST RACE RESULTS */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Last Race Top 10 Performers</h2>

        {lastRace ? (
          <div className="border rounded overflow-hidden">
            <div className="bg-gray-100 p-3 font-semibold">
              {lastRace.name}
            </div>

            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="p-2">Pos</th>
                  <th className="p-2">Driver</th>
                  <th className="p-2">Points</th>
                </tr>
              </thead>
              <tbody>
                {topFinishers.map((result, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2 font-semibold">{index + 1}</td>
                    <td className="p-2">
                      {result.drivers?.first_name} {result.drivers?.last_name}
                    </td>
                    <td className="p-2">
                      {result.race_points + result.stage_1_points + result.stage_2_points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div>No completed races yet.</div>
        )}
      </section>
    </div>
  )
}