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

  const { data: standings } = await supabase
    .from('standings')
    .select(`
  id,
  team_id,
  total_points,
  weekly_rank,
  waiver_priority,
  teams (
    name
  )
`)

    .eq('league_id', team.league_id)
    .order('total_points', { ascending: false })

  if (!standings) return <div>No standings found.</div>

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Standings</h1>

      <div className="border rounded-lg bg-white shadow-sm">
        <div className="grid grid-cols-4 font-semibold border-b p-4">
          <div>Rank</div>
          <div>Team</div>
          <div>Total Points</div>
          <div>Waiver Priority</div>
        </div>

        {standings.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-4 border-b p-4"
          >
            <div>{row.weekly_rank}</div>
            <div>
              <Link
                href={`/teams/${row.team_id}`}
                className="text-blue-600 hover:underline"
              >
                {row.teams?.name}
              </Link>
            </div>
            <div>{row.total_points}</div>
            <div>{row.waiver_priority}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
