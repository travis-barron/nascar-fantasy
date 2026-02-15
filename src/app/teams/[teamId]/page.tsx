import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  const { teamId } = await params

  const supabase = await createSupabaseServerClient()

  // Verify logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Get viewer's league
  const { data: viewerTeam } = await supabase
    .from('teams')
    .select('league_id')
    .eq('user_id', user.id)
    .single()

  if (!viewerTeam) redirect('/')

  // Get requested team
  const { data: team } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .single()

  if (!team) return <div>Team not found.</div>

  // Enforce same league
  if (team.league_id !== viewerTeam.league_id) {
    return <div>Unauthorized</div>
  }

  // Get standings info
  const { data: standing } = await supabase
    .from('standings')
    .select('total_points, weekly_rank')
    .eq('team_id', teamId)
    .single()

  // Get roster
  const { data: roster } = await supabase
    .from('team_drivers')
    .select(`
      id,
      is_on_ir,
      drivers (
        first_name,
        last_name,
        car_number,
        team_name
      )
    `)
    .eq('team_id', teamId)

  // Get driver performance totals
  const { data: driverStats } = await supabase
    .from('team_drivers')
    .select(`
    id,
    drivers (
      id,
      first_name,
      last_name
    )
  `)
    .eq('team_id', teamId)

  // Get race history
  const { data: raceHistory } = await supabase
    .from('team_race_points')
    .select(`
      total_points,
      races (
        name,
        race_number
      )
    `)
    .eq('team_id', teamId)

  let driverPerformance: any[] = []

  if (driverStats) {
    for (const td of driverStats) {
      const { data: results } = await supabase
        .from('race_results')
        .select('race_points, stage_1_points, stage_2_points')
        .eq('driver_id', td.drivers.id)

      const totals = results?.reduce(
        (acc, r) => {
          acc.race_points += r.race_points || 0
          acc.stage_1_points += r.stage_1_points || 0
          acc.stage_2_points += r.stage_2_points || 0
          return acc
        },
        { race_points: 0, stage_1_points: 0, stage_2_points: 0 }
      )

      driverPerformance.push({
        name: `${td.drivers.first_name} ${td.drivers.last_name}`,
        race_points: totals?.race_points || 0,
        stage_1_points: totals?.stage_1_points || 0,
        stage_2_points: totals?.stage_2_points || 0,
        total:
          (totals?.race_points || 0) +
          (totals?.stage_1_points || 0) +
          (totals?.stage_2_points || 0),
      })
    }
  }


  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h1 className="text-3xl font-bold mb-2">
          {team.name}
        </h1>

        <div className="flex gap-8 text-sm text-gray-600">
          <div>
            <span className="font-semibold text-gray-900">
              Rank:
            </span>{' '}
            {standing?.weekly_rank}
          </div>
          <div>
            <span className="font-semibold text-gray-900">
              Total Points:
            </span>{' '}
            {standing?.total_points}
          </div>
        </div>
      </div>


      <div className="bg-white p-4 rounded-xl shadow-sm border hover:shadow-md transition">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Roster</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roster?.map((driver) => (
            <div
              key={driver.id}
              className="border p-4 bg-white rounded"
            >
              <p className="font-semibold">
                {driver.drivers.first_name}{' '}
                {driver.drivers.last_name}
              </p>
              <p className="text-sm text-gray-500">
                #{driver.drivers.car_number} •{' '}
                {driver.drivers.team_name}
              </p>
              {driver.is_on_ir && (
                <p className="text-xs text-red-600">IR</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Race History
        </h2>

        <div className="border rounded bg-white">
          {raceHistory?.map((race, idx) => (
            <div
              key={idx}
              className={`grid grid-cols-2 p-4 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                }`}
            >

              <div>{race.races?.name}</div>
              <div>{race.total_points}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Driver Performance
        </h2>

        <div className="border rounded bg-white">
          <div className="grid grid-cols-5 p-4 bg-gray-100 text-sm font-semibold uppercase tracking-wide text-gray-600">
            <div>Driver</div>
            <div>Race Pts</div>
            <div>Stage 1</div>
            <div>Stage 2</div>
            <div>Total</div>
          </div>

          {driverPerformance.map((d, idx) => (
            <div
              key={idx}
              className={`grid grid-cols-5 p-4 text-sm ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
            >

              <div>{d.name}</div>
              <div>{d.race_points}</div>
              <div>{d.stage_1_points}</div>
              <div>{d.stage_2_points}</div>
              <div className="font-bold text-gray-900">
                {d.total}
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
