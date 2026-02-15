'use server'

import { createClient } from '@supabase/supabase-js'

export async function createLeague(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // SERVER ONLY
  )

  const seasonYear = new Date().getFullYear()

  // 1. Create season
const { data: season, error: seasonError } = await supabase
  .from('seasons')
  .upsert({ year: seasonYear }, { onConflict: 'year' })
  .select()
  .single()


  // 2. Create league
  const { data: league } = await supabase
    .from('leagues')
    .insert({
      name: 'Travis Private League',
      season_id: season.id,
      commissioner_id: userId,
      is_private: true,
    })
    .select()
    .single()

  // 3. Add league member
  await supabase.from('league_members').insert({
    league_id: league.id,
    user_id: userId,
    role: 'commissioner',
  })

  // 4. Create team
  const { data: team } = await supabase
    .from('teams')
    .insert({
      league_id: league.id,
      user_id: userId,
      name: 'Commissioner Team',
    })
    .select()
    .single()

  // 5. Initialize standings
  await supabase.from('standings').insert({
    league_id: league.id,
    team_id: team.id,
    total_points: 0,
    weekly_rank: 1,
    waiver_priority: 1,
  })

  return league
}
