'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function finalizeRace(raceId: string) {
  const supabase = await createSupabaseServerClient()

  // Check if race already finalized
  const { data: race } = await supabase
    .from('races')
    .select('is_finalized')
    .eq('id', raceId)
    .single()

  if (!race) return { error: 'Race not found' }

  if (race.is_finalized) {
    return { error: 'Race already finalized' }
  }

  // Get all teams
  const { data: teams } = await supabase
    .from('teams')
    .select('id, league_id')

  if (!teams) return { error: 'No teams found' }

  // Preload race results
  const { data: raceResults } = await supabase
    .from('race_results')
    .select('*')
    .eq('race_id', raceId)

  for (const team of teams) {
    // Get lineup
    const { data: lineup } = await supabase
      .from('lineups')
      .select('team_driver_id, slot_type')
      .eq('race_id', raceId)
      .eq('team_id', team.id)

    if (!lineup) continue

    const activeDrivers = lineup.filter(
      (l) => l.slot_type === 'active'
    )

    let teamTotal = 0

    for (const driver of activeDrivers) {
      // Get driver_id from team_drivers
      const { data: td } = await supabase
        .from('team_drivers')
        .select('driver_id')
        .eq('id', driver.team_driver_id)
        .single()

      if (!td) continue

      const result = raceResults?.find(
        (r) => r.driver_id === td.driver_id
      )

      if (result) {
        teamTotal +=
          result.race_points +
          result.stage_1_points +
          result.stage_2_points
      }
    }

    // Insert race total (upsert protects duplicate)
    await supabase.from('team_race_points').upsert({
      race_id: raceId,
      team_id: team.id,
      total_points: teamTotal,
    })

    // Update standings
    const { data: standings } = await supabase
      .from('standings')
      .select('*')
      .eq('team_id', team.id)
      .single()

    if (standings) {
      await supabase
        .from('standings')
        .update({
          total_points: standings.total_points + teamTotal,
        })
        .eq('id', standings.id)
    }
  }

  // Recalculate ranks
  const { data: updatedStandings } = await supabase
    .from('standings')
    .select('*')
    .order('total_points', { ascending: false })

  if (updatedStandings) {
    for (let i = 0; i < updatedStandings.length; i++) {
      const team = updatedStandings[i]

      await supabase
        .from('standings')
        .update({
          weekly_rank: i + 1,
          waiver_priority: updatedStandings.length - i,
        })
        .eq('id', team.id)
    }
  }

  // Mark race finalized
  await supabase
    .from('races')
    .update({ is_finalized: true })
    .eq('id', raceId)

  return { success: true }
}
