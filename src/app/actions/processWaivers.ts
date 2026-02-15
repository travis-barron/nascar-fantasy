'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function processWaivers(leagueId: string) {
    const supabase = await createSupabaseServerClient()

    // Get pending claims
    const { data: claims } = await supabase
        .from('waiver_claims')
        .select('*')
        .eq('league_id', leagueId)
        .eq('status', 'pending')

    if (!claims || claims.length === 0) {
        return { message: 'No pending claims.' }
    }

    // Get standings for priority order
    const { data: standings } = await supabase
        .from('standings')
        .select('team_id, waiver_priority')
        .eq('league_id', leagueId)

    if (!standings) return { error: 'No standings found' }

    // Attach priority to claims
    const claimsWithPriority = claims
        .map(claim => ({
            ...claim,
            priority: standings.find(
                s => s.team_id === claim.team_id
            )?.waiver_priority || 999,
        }))
        .sort((a, b) => a.priority - b.priority)

    for (const claim of claimsWithPriority) {
        console.log('Processing claim:', claim)

        // Check if driver still available
        const { data: existing } = await supabase
            .from('team_drivers')
            .select('*')
            .eq('driver_id', claim.add_driver_id)
            .single()

        if (existing) {
            // Driver already taken
            await supabase
                .from('waiver_claims')
                .update({
                    status: 'failed',
                    processed_at: new Date().toISOString(),
                })
                .eq('id', claim.id)

            continue
        }

        // Validate drop belongs to this team
        const { data: dropRecord } = await supabase
            .from('team_drivers')
            .select('*')
            .eq('id', claim.drop_team_driver_id)
            .eq('team_id', claim.team_id)
            .single()

        if (!dropRecord) {
            // Invalid drop — fail claim
            await supabase
                .from('waiver_claims')
                .update({
                    status: 'failed',
                    processed_at: new Date().toISOString(),
                })
                .eq('id', claim.id)

            continue
        }

        // Remove lineup references
        await supabase
            .from('lineups')
            .delete()
            .eq('team_driver_id', dropRecord.id)


        // Delete driver
        await supabase
            .from('team_drivers')
            .delete()
            .eq('id', dropRecord.id)

        const { data: teamData } = await supabase
            .from('teams')
            .select('season_id')
            .eq('id', claim.team_id)
            .single()

        // Add new driver
        await supabase
            .from('team_drivers')
            .insert({
                team_id: claim.team_id,
                driver_id: claim.add_driver_id,
                season_id: teamData?.season_id,
            })


        // Mark successful
        await supabase
            .from('waiver_claims')
            .update({
                status: 'successful',
                processed_at: new Date().toISOString(),
            })
            .eq('id', claim.id)

        // Move team to bottom of waiver order
        // Reorder waiver priorities properly
        const { data: currentStandings } = await supabase
            .from('standings')
            .select('id, team_id, waiver_priority')
            .eq('league_id', leagueId)
            .order('waiver_priority', { ascending: true })

        if (currentStandings) {
            const reordered = currentStandings
                .filter(s => s.team_id !== claim.team_id)

            reordered.push(
                currentStandings.find(s => s.team_id === claim.team_id)!
            )

            for (let i = 0; i < reordered.length; i++) {
                await supabase
                    .from('standings')
                    .update({ waiver_priority: i + 1 })
                    .eq('id', reordered[i].id)
            }
        }

    }

    return { message: 'Waivers processed.' }
}
