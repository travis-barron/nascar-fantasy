import { createSupabaseServerClient } from '@/lib/supabase-server'
import Link from 'next/link'


export default async function StandingsPage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Get user's league
  const { data: team } = await supabase
    .from('teams')
    .select('league_id')
    .eq('user_id', user.id)
    .single()

  if (!team) return <div>No team found.</div>

  const { data } = await supabase
    .from('standings')
    .select(`
    id,
    team_id,
    total_points,
    weekly_rank,
    waiver_priority,
    teams (
      name,
      profiles (
        display_name
      )
    )
  `)
    .order('weekly_rank', { ascending: true })

  type Standing = {
    id: string
    team_id: string
    total_points: number
    weekly_rank: number
    waiver_priority: number
    team_name: string
    owner_name: string
  }

  const standings: Standing[] =
    (data ?? []).map((row: any) => ({
      id: row.id,
      team_id: row.team_id,
      total_points: row.total_points ?? 0,
      weekly_rank: row.weekly_rank ?? 0,
      waiver_priority: row.waiver_priority ?? 0,
      team_name: Array.isArray(row.teams)
        ? row.teams[0]?.name ?? 'Unknown'
        : row.teams?.name ?? 'Unknown',
      owner_name: Array.isArray(row.teams?.profiles)
        ? row.teams?.profiles[0]?.display_name
        : row.teams?.profiles?.display_name
    }))



  if (!standings) return <div>No standings found.</div>

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Standings</h1>

      <div className="border rounded-lg bg-white shadow-sm">
        <div className="hidden md:block">
          <div className="grid grid-cols-5 font-semibold border-b p-4">
            <div>Rank</div>
            <div className="col-span-2">Team</div>
            <div>Total Points</div>
            <div>Waiver Priority</div>
          </div>

          {standings?.map((row) => (
            <div
              key={row.id}
              className={`grid grid-cols-5 border-b p-4
              ${row.weekly_rank % 2 == 1 ? 'bg-gray-100' : 'bg-white'} 
              `}
            >
              <div>{row.weekly_rank}</div>
              <div className="col-span-2">
                <Link
                  href={`/teams/${row.team_id}`}
                  className="text-blue-600 hover:underline"
                >
                  {row.team_name}
                </Link>
                <br/>({row.owner_name})
              </div>
              <div>{row.total_points}</div>
              <div>{row.waiver_priority}</div>
            </div>
          ))}
        </div>

        <div className="md:hidden">
          <div className="grid grid-cols-4 font-semibold border-b p-4">
            <div>Rank</div>
            <div className="col-span-2">Team</div>
            <div>Total Points</div>
          </div>

          {standings?.map((row) => (
            <div
              key={row.id}
              className={`grid grid-cols-4 border-b p-4
              ${row.weekly_rank % 2 == 1 ? 'bg-gray-100' : 'bg-white'} 
              `}
            >
              <div>{row.weekly_rank}</div>
              <div className="col-span-2">
                <Link
                  href={`/teams/${row.team_id}`}
                  className="text-blue-600 hover:underline"
                >
                  {row.team_name}
                </Link>
                <br />
                ({row.owner_name})
              </div>
              <div>{row.total_points}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
