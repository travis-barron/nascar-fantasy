import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import TeamDetailClient from '@/components/TeamDetailClient'

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  const { teamId } = await params
  const supabase = await createSupabaseServerClient()


  type RosterDriver = {
      id: string,
      is_on_ir: boolean,
      first_name: string,
      last_name: string,
      car_number: string,
      team_name: string,
      driver_id: string,
      is_active: boolean
    }

    type DriverStats = {
      id: string, 
      driver_id: string,
      first_name: string,
      last_name: string
    }

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

  // Get active roster
  const { data: currentRace } = await supabase
    .from('races')
    .select('id')
    .order('race_number', { ascending: false })
    .limit(1)
    .single()

  const { data: lineup } = await supabase
    .from('lineups')
    .select('team_driver_id')
    .eq('team_id', teamId)
    .eq('race_id', currentRace?.id)
    .eq('slot_type', 'active')

  const activeIds = new Set(
    (lineup ?? []).map(l => l.team_driver_id)
  )

  // Get standings info
  const { data: standing } = await supabase
    .from('standings')
    .select('total_points, weekly_rank')
    .eq('team_id', teamId)
    .single()

  // Get roster
  const { data: rosterRaw } = await supabase
    .from('team_drivers')
    .select(`
      id,
      is_on_ir,
      drivers (
        first_name,
        last_name,
        car_number,
        team_name,
        id
      )
    `)
    .eq('team_id', teamId)

    const roster: RosterDriver[] = 
      (rosterRaw ?? []).map((r: any) => {
        const driver = Array.isArray(r.drivers)
          ? r.drivers[0] : r.drivers

          return {
            id: r.id,
            is_on_ir: r.is_on_ir,
            first_name: driver?.first_name ?? '',
            last_name: driver?.last_name ?? '',
            car_number: driver?.car_number ?? '',
            team_name: driver?.team_name ?? '',
            driver_id: driver?.id ?? '',
            is_active: activeIds.has(r.id)
          }
      })

  // Get driver performance totals
  const { data: driverStatsRaw } = await supabase
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
    
    const driverStats: DriverStats[] = 
      (driverStatsRaw ?? []).map((td: any) => {
        const driver = Array.isArray(td.drivers)
          ? td.drivers[0]
          : td.drivers

          return {
            id: td.id,
            driver_id: driver?.id,
            first_name: driver?.first_name ?? '',
            last_name: driver?.last_name ?? ''
          }
      })

  // Get race history
  const { data: raceHistoryRaw } = await supabase
    .from('team_race_points')
    .select(`
      total_points,
      rank,
      races (
        name,
        race_number
      )
    `)
    .eq('team_id', teamId)

    type RaceHistory = {
      total_points: number
      race_name: string
      race_number: number
      rank: number
    }

    const raceHistory: RaceHistory[] = 
      (raceHistoryRaw ?? []).map((rh:any) => {
        const race = Array.isArray(rh.races)
          ? rh.races[0]
          : rh.races

          return {
            total_points: rh.total_points,
            race_name: race?.name ?? '',
            race_number: race?.race_number ?? 0,
            rank: rh.rank
          }
      });

  let driverPerformance: any[] = []

  if (driverStats) {
    for (const td of driverStats) {
      const { data: results } = await supabase
        .from('race_results')
        .select('race_points, stage_1_points, stage_2_points')
        .eq('driver_id', td.driver_id)

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
        name: `${td.first_name} ${td.last_name}`,
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
        <TeamDetailClient drivers={roster.map(function(ds) {
        return {
          id : ds.driver_id,
          first_name: ds.first_name,
          last_name: ds.last_name,
          team_name: ds.team_name,
          car_number: ds.car_number,
          is_active: ds.is_active
      }})} />
      </div>

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
          {raceHistory?.map((race, idx) => (
            <div
              key={idx}
              className={`grid grid-cols-3 p-4 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                }`}
            >
              <div>{race.race_name}</div>
              <div>{race.total_points}</div>
              <div>{race.rank} {race.rank == 1 ? <span className="text-yellow-500 text-lg">🏆</span> : ''}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border overflow-hidden">
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
