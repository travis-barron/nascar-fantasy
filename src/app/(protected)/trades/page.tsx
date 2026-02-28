import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import TradeClient from '@/components/trades/TradeClient'

export default async function TradesPage() {
    const supabase = await createSupabaseServerClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    type DriverRow = {
        team_id: string
        driver_id: string
        drivers: {
            first_name: string
            last_name: string
        }
    }

    const { data: team } = await supabase
        .from('teams')
        .select('id, name')
        .eq('user_id', user.id)
        .single()

    if (!team) redirect('/')

    const { data: trades } = await supabase
        .from('trades')
        .select('*')
        .or(`proposing_team_id.eq.${team.id},receiving_team_id.eq.${team.id}`)
        .eq('status', 'pending')

    const { data: teams } = await supabase
        .from('teams')
        .select('id, name')
        .neq('id', team.id)

    const { data: roster } = await supabase
        .from('team_drivers')
        .select(`
    team_id,
    driver_id,
    drivers (
      first_name,
      last_name
    )
  `)
        .eq('team_id', team.id)

    const rosterObj: DriverRow[] =
        (roster ?? []).map((r: any) => {
            const driver = Array.isArray(r.drivers) ? r.drivers[0] : r.drivers

            return {
                team_id: r.team_id,
                driver_id: r.driver_id,
                drivers: r.drivers
            }
        });

    const { data: allTeamDrivers } = await supabase
        .from('team_drivers')
        .select(`
    team_id,
    driver_id,
    drivers (
      first_name,
      last_name
    )
  `)

    const teamDriversObj: DriverRow[] =
        (allTeamDrivers ?? []).map((d: any) => {
            const driver = Array.isArray(d.drivers) ? d.drivers[0] : d.drivers

            return {
                team_id: d.team_id,
                driver_id: d.driver_id,
                drivers: d.drivers
            }
        })

    const { data: season } = await supabase
        .from('seasons')
        .select('id')
        .order('year', { ascending: false })
        .limit(1)
        .single()

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

    const driverTotals: Record<
        string,
        { total: number; lastRace: number; races: number }
    > = {}

    for (const r of results ?? []) {
        const total =
            (r.race_points ?? 0) +
            (r.stage_1_points ?? 0) +
            (r.stage_2_points ?? 0)

        if (!driverTotals[r.driver_id]) {
            driverTotals[r.driver_id] = {
                total: 0,
                lastRace: total,
                races: 0,
            }
        }

        driverTotals[r.driver_id].total += total
        driverTotals[r.driver_id].races += 1
        driverTotals[r.driver_id].lastRace = total
    }

    return (
        <TradeClient
            team={team}
            trades={trades ?? []}
            otherTeams={teams ?? []}
            roster={rosterObj ?? []}
            allTeamDrivers={teamDriversObj ?? []}
            driverTotals={driverTotals}
        />
    )
}