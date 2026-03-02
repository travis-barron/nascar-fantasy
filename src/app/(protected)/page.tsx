import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import LocalTime from '@/components/LocalTime'
import SeasonTopTen from '@/components/SeasonTopTen'
import UpcomingRace from '@/components/UpcomingRace'

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
    .order('lineup_lock_time', { ascending: false })
    .limit(1)
    .single()

  // 🏁 Most recent completed race
  const { data: lastRace } = await supabase
    .from('races')
    .select('*')
    .eq('is_finalized', true)
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
        <UpcomingRace 
          race={nextRace}
        />
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
          <div className=" bg-white border rounded overflow-hidden">
            <div className="bg-gray-100 p-3 font-semibold">
              {lastRace.name} | {lastRace.track_name}
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
                    <td className="p-2 font-semibold">
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