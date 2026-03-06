import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function GET(
  req: Request,
  { params }: { params: { raceId: string } }
) {
  const supabase = await createSupabaseServerClient()
  const { raceId } = await params

  type DriverPointsRow = {
  driver_id: string
  stage_1_points: number
  stage_2_points: number
  race_points: number
}

  // 1. Fetch race
  const { data: race, error: raceError } = await supabase
    .from("races")
    .select("id, name, track_name, race_date, is_finalized")
    .eq("id", raceId)
    .single()

  if (raceError) {
    return NextResponse.json({ error: raceError.message }, { status: 500 })
  }

  // 2. Fetch team standings
  const { data: teamResults, error: teamError } = await supabase
    .from("team_race_points")
    .select(`
      team_id,
      total_points,
      rank,
      teams (
        id,
        name
      )
    `)
    .eq("race_id", raceId)
    .order("rank", { ascending: true })

  if (teamError) {
    return NextResponse.json({ error: teamError.message }, { status: 500 })
  }

  // 3. Fetch lineups + drivers
  const { data: lineupRows, error: lineupError } = await supabase
    .from("lineups")
    .select(`
      team_id,
      slot_type,
      team_drivers (
        id,
        driver_id,
        drivers (
          id,
          first_name,
          last_name
        )
      )
    `)
    .eq("race_id", raceId)

  if (lineupError) {
    return NextResponse.json({ error: lineupError.message }, { status: 500 })
  }

  // 4. Fetch driver race points
  const { data: driverPointsRows, error: pointsError } = await supabase
    .from("race_results")
    .select("driver_id, stage_1_points, stage_2_points, race_points")
    .eq("race_id", raceId)

  if (pointsError) {
    return NextResponse.json({ error: pointsError.message }, { status: 500 })
  }

  // Build driver points map
  const pointsMap = new Map<string, number>();
  (driverPointsRows as DriverPointsRow[] | null)?.forEach(
  (row: DriverPointsRow) => {
    pointsMap.set(row.driver_id, (row.stage_1_points + row.stage_2_points + row.race_points))
  }
)

  // Group lineups by team
  const lineupByTeam: Record<string, any[]> = {};

  (lineupRows)?.forEach(
  (row: any) => {
    const driverId = row.team_drivers?.driver_id
    const driverName = row.team_drivers?.drivers.full_name

    const enriched = {
      driver_id: driverId,
      driver_name: driverName,
      slot_type: row.slot_type,
      fantasy_points: pointsMap.get(driverId) ?? 0
    }

    if (!lineupByTeam[row.team_id]) {
      lineupByTeam[row.team_id] = []
    }

    lineupByTeam[row.team_id].push(enriched)
  })

  // Attach drivers to standings
  const standings = teamResults?.map((team: any) => ({
    team_id: team.team_id,
    team_name: team.teams.name,
    total_points: team.total_points,
    rank: team.rank,
    drivers: lineupByTeam[team.team_id] ?? []
  }))

  return NextResponse.json({
    race,
    standings
  })
}