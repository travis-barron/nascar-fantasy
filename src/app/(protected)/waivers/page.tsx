// src/app/(protected)/waivers/page.tsx

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import WaiverClient from '@/components/waivers/WaiverClient'

export default async function WaiversPage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Get user's team
  const { data: team } = await supabase
    .from('teams')
    .select('id, league_id')
    .eq('user_id', user.id)
    .single()

  if (!team) redirect('/')

  // Get roster driver IDs
  const { data: rosterRows } = await supabase
    .from('team_drivers')
    .select('driver_id, id')
    .eq('team_id', team.id)

  const rosterIds = rosterRows?.map(r => r.driver_id) ?? []

  // Get all drivers
  const { data: allDrivers } = await supabase
    .from('drivers')
    .select('id, first_name, last_name')
    .order('last_name', {ascending: true})

  const allDriverIds = allDrivers?.map(d => d.id) ?? []

  // Free agents = drivers not in team_drivers
  const { data: allRostered } = await supabase
    .from('team_drivers')
    .select('driver_id')

  const rosteredIds = new Set(allRostered?.map(r => r.driver_id))

  const freeAgents = allDrivers?.filter(d => !rosteredIds.has(d.id)) ?? []

  // Get current season
  const { data: season } = await supabase
    .from('seasons')
    .select('id')
    .order('year', { ascending: false })
    .limit(1)
    .single()

  // Get all season race results once
  const { data: results } = await supabase
    .from('race_results')
    .select(`
      driver_id,
      race_points,
      stage_1_points,
      stage_2_points,
      races!inner(season_id)
    `)
    .eq('races.season_id', season?.id)

  // Build totals map
  const totals: Record<string, number> = {}

  for (const r of results ?? []) {
    const total =
      (r.race_points ?? 0) +
      (r.stage_1_points ?? 0) +
      (r.stage_2_points ?? 0)

    totals[r.driver_id] = (totals[r.driver_id] ?? 0) + total
  }

  return (
    <WaiverClient
      roster={allDrivers?.filter(d => rosterIds.includes(d.id)) ?? []}
      freeAgents={freeAgents ?? []}
      totals={totals ?? {}}
      teamId={team.id}
      leagueId={team.league_id}
    />
  )
}