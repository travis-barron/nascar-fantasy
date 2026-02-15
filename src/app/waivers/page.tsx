import { createSupabaseServerClient } from '@/lib/supabase-server'
import WaiverForm from './WaiverForm'
import { redirect } from 'next/navigation'

export default async function WaiversPage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Get team
  const { data: team } = await supabase
    .from('teams')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!team) return <div>No team found.</div>

  // Check for existing pending claim
  const { data: existingClaim } = await supabase
    .from('waiver_claims')
    .select('*')
    .eq('team_id', team.id)
    .eq('status', 'pending')
    .single()

  // Get roster
  const { data: roster } = await supabase
    .from('team_drivers')
    .select(`
      id,
      drivers (
        id,
        first_name,
        last_name
      )
    `)
    .eq('team_id', team.id)

  // Get available drivers (not on any team)
  const { data: allDrivers } = await supabase
    .from('drivers')
    .select('*')
    .order("first_name")

  const { data: rosteredDrivers } = await supabase
    .from('team_drivers')
    .select('driver_id')

  const rosteredIds = rosteredDrivers?.map(r => r.driver_id) || []

  const availableDrivers = allDrivers?.filter(
    d => !rosteredIds.includes(d.id)
  )

  return (
    <WaiverForm
      team={team}
      roster={roster || []}
      availableDrivers={availableDrivers || []}
      existingClaim={existingClaim}
    />
  )
}
