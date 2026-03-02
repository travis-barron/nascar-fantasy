import { createSupabaseServerClient } from '@/lib/supabase-server'
import LineupManager from './LineupManager'
import EditableTeamName from '@/components/EditableTeamName'
import UpcomingRace from '@/components/UpcomingRace'

export default async function MyTeamPage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: team } = await supabase
    .from('teams')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!team) return <div>No team found.</div>

  const { data: roster } = await supabase
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
    .eq('team_id', team.id)

  const { data: race } = await supabase
    .from('races')
    .select('*')
    .order('race_date', { ascending: false })
    .limit(1)
    .single()

  const now = new Date()
  const lockTime = race ? new Date(race.lineup_lock_time) : null
  const isLocked = lockTime ? now >= lockTime : false

  const { data: existingLineup } = await supabase
    .from('lineups')
    .select('*')
    .eq('race_id', race?.id)
    .eq('team_id', team.id)

  return (
    <div>
      <EditableTeamName
        teamId={team.id}
        initialName={team.name}
      />
      <br/> <br/>
      <UpcomingRace race={race} />
      <br /> <br />
      <LineupManager
        team={team}
        roster={roster || []}
        race={race}
        existingLineup={existingLineup || []}
        isLocked={isLocked}
      />

    </div>
  )
}
