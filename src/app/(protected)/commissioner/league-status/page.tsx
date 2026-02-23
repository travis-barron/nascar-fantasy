import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function LeagueStatusPage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_commissioner')
    .eq('id', user.id)
    .single()

  if (!profile?.is_commissioner) {
    redirect('/my-team')
  }

  // Get standings ordered by rank
  const { data: standings } = await supabase
    .from('standings')
    .select(`
      team_id,
      total_points,
      weekly_rank,
      waiver_priority,
      teams (
        name
      )
    `)
    .order('weekly_rank', { ascending: true })

  // Get pending waivers
  const { data: pendingWaivers } = await supabase
    .from('waiver_claims')
    .select('id')
    .eq('status', 'pending')

  // Get current race
  const { data: race } = await supabase
    .from('races')
    .select('*')
    .order('race_number', { ascending: false })
    .limit(1)
    .single()

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-8">
      <h1 className="text-3xl font-bold">
        League Status
      </h1>

      <div className="bg-white p-6 rounded-xl shadow border">
        <h2 className="text-lg font-semibold mb-4">
          Current Race
        </h2>
        {race ? (
          <div className="space-y-2 text-sm">
            <div><strong>Name:</strong> {race.name}</div>
            <div><strong>Lineup Lock:</strong> {new Date(race.lineup_lock_time).toLocaleString()}</div>
          </div>
        ) : (
          <p>No race found.</p>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl shadow border">
        <h2 className="text-lg font-semibold mb-4">
          Standings
        </h2>

        <div className="space-y-2 text-sm">
          {standings?.map((s: any) => (
            <div
              key={s.team_id}
              className="flex justify-between border-b py-2"
            >
              <span>
                #{s.weekly_rank} — {s.teams.name}
              </span>
              <span>
                {s.total_points} pts | Waiver #{s.waiver_priority}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow border">
        <h2 className="text-lg font-semibold mb-4">
          Waiver Status
        </h2>
        <p className="text-sm">
          Pending Claims: {pendingWaivers?.length || 0}
        </p>
      </div>
    </div>
  )
}
