`use server`

import { createSupabaseBrowserClient } from "@/lib/supabase-browser"

export default async function TeamData() {
    const supabase = await createSupabaseBrowserClient()
    const year = new Date().getFullYear()

    const { data, error } = await supabase 
        .from('seasons')
        .select(`id`)
        .eq('year', year)
        .single()

    if (error) throw error
    return (GetTeamData(data?.id))
}

export async function GetTeamData(seasonId: string) {
    const supabase = await createSupabaseBrowserClient()

    const { data, error } = await supabase
        .from('teams')
        .select(`
    id,
    name,
    team_drivers (
      driver_id,
      drivers (
        first_name,
        last_name,
        car_number,
        team_name
      )
    )
  `)

  if (error) throw error
  return (
    JSON.stringify(data)
    );
}