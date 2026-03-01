'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function processWaivers(leagueId: string) {
  const supabase = await createSupabaseServerClient()

  // 1️⃣ Get pending claims
  const { data: claims } = await supabase
    .from('waiver_claims')
    .select('*')
    .eq('league_id', leagueId)
    .eq('status', 'pending')

  if (!claims || claims.length === 0) {
    return { message: 'No pending claims.' }
  }

  // 2️⃣ Snapshot standings (priority order FIXED at start)
  const { data: standings } = await supabase
    .from('standings')
    .select('id, team_id, waiver_priority')
    .eq('league_id', leagueId)
    .order('waiver_priority', { ascending: true })

  if (!standings) {
    return { error: 'Standings not found' }
  }

  // 3️⃣ Attach priority to claims
  const claimsWithPriority = claims
    .map(claim => ({
      ...claim,
      priority:
        standings.find(s => s.team_id === claim.team_id)
          ?.waiver_priority ?? 999,
    }))
    .sort((a, b) => a.priority - b.priority)

  const successfulTeams: string[] = []
  const successfulClaims: string[] = []

  // 4️⃣ Process in fixed priority order
  for (const claim of claimsWithPriority) {

    // 🚫 Only 1 success per team
    if (successfulTeams.includes(claim.team_id)) {
      await failClaim(supabase, claim.id)
      continue
    }

    // 🚫 Check driver still available
    const { data: existing } = await supabase
      .from('team_drivers')
      .select('id')
      .eq('driver_id', claim.add_driver_id)
      .maybeSingle()

    if (existing) {
      await failClaim(supabase, claim.id)
      continue
    }

    // 🚫 Validate drop belongs to team
    const { data: dropRecord } = await supabase
      .from('team_drivers')
      .select('*')
      .eq('driver_id', claim.drop_driver_id)
      .eq('team_id', claim.team_id)
      .single()

    if (!dropRecord) {
      await failClaim(supabase, claim.id)
      continue
    }

    // 🔥 Remove lineup references first
    await supabase
      .from('lineups')
      .delete()
      .eq('team_driver_id', dropRecord.id)

    // 🔥 Delete old driver
    await supabase
      .from('team_drivers')
      .delete()
      .eq('id', dropRecord.id)

    // 🔥 Insert new driver
    const { data: teamData } = await supabase
      .from('teams')
      .select('season_id')
      .eq('id', claim.team_id)
      .single()

    await supabase
      .from('team_drivers')
      .insert({
        team_id: claim.team_id,
        driver_id: claim.add_driver_id,
        season_id: teamData?.season_id,
      })

    // Mark claim successful
    await supabase
      .from('waiver_claims')
      .update({
        status: 'successful',
        processed_at: new Date().toISOString(),
      })
      .eq('id', claim.id)

    successfulTeams.push(claim.team_id)
    successfulClaims.push(claim.id)
  }

  // 5️⃣ Reorder waiver priority ONCE
  if (successfulTeams.length > 0) {

    const remaining = standings.filter(
      s => !successfulTeams.includes(s.team_id)
    )

    const moved = standings.filter(
      s => successfulTeams.includes(s.team_id)
    )

    const finalOrder = [...remaining, ...moved]

    for (let i = 0; i < finalOrder.length; i++) {
      await supabase
        .from('standings')
        .update({ waiver_priority: i + 1 })
        .eq('id', finalOrder[i].id)
    }
  }

  // 6️⃣ League activity notification
  await supabase.from('notifications').insert({
    scope: 'league',
    message: `Waivers have been processed.`,
  })

  return { message: 'Waivers processed successfully.' }
}

// Helper
async function failClaim(supabase: any, claimId: string) {
  await supabase
    .from('waiver_claims')
    .update({
      status: 'failed',
      processed_at: new Date().toISOString(),
    })
    .eq('id', claimId)
}