import { createSupabaseServerClient } from '@/lib/supabase-server'

export default async function Dashboard() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Get team
  const { data: team } = await supabase
    .from('teams')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!team) return <div>No team found.</div>

  // Get next race
  const { data: race } = await supabase
    .from('races')
    .select('*')
    .order('race_date', { ascending: true })
    .limit(1)
    .single()

  if (!race) return <div>No races scheduled.</div>

  const now = new Date()
  const lockTime = new Date(race.lineup_lock_time)
  const isLocked = now >= lockTime

  // Get lineup for this race
  const { data: lineup } = await supabase
    .from('lineups')
    .select('*')
    .eq('race_id', race.id)
    .eq('team_id', team.id)

  const activeCount =
    lineup?.filter((l) => l.slot_type === 'active').length || 0

  let statusLabel = ''
  let statusColor = ''

  if (isLocked && activeCount === 3) {
    statusLabel = 'Locked — Lineup Set'
    statusColor = 'text-green-600'
  } else if (isLocked && activeCount !== 3) {
    statusLabel = 'Locked — No Valid Lineup'
    statusColor = 'text-red-600'
  } else if (!isLocked && activeCount === 3) {
    statusLabel = 'Lineup Set'
    statusColor = 'text-green-600'
  } else {
    statusLabel = 'Lineup Incomplete'
    statusColor = 'text-yellow-600'
  }

  const raceTime = new Date(race.race_date)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Next Race</h1>

      <div className="border text-slate-600 rounded-lg p-6 bg-white shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">{race.name}</h2>
        <p>{race.track_name}</p>

        <p>Race Date: {raceTime.toLocaleString()}</p>
        <p>Lineup Lock: {lockTime.toLocaleString()}</p>

        <div className={`font-semibold ${statusColor}`}>
          Status: {statusLabel}
        </div>
      </div>
    </div>
  )
}
