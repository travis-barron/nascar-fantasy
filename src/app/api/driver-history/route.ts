import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const driverId = searchParams.get('driverId')
  const seasonId = searchParams.get('seasonId')

  if (!driverId || !seasonId) {
    return NextResponse.json([], { status: 400 })
  }

  const supabase = await createSupabaseServerClient()

  const { data } = await supabase
    .from('race_results')
    .select(`
      race_id,
      finish_position,
      race_points,
      stage_1_points,
      stage_2_points,
      races (
        name,
        season_id,
        track_name,
        track_type,
        track_length
      )
    `)
    .eq('driver_id', driverId)
    .eq('races.season_id', seasonId)

  const formatted =
    data?.map((r: any) => ({
      race_id: r.race_id,
      finish_position: r.finish_position,
      race_name: r.races?.name,
      track_name: r.races?.track_name,
      track_type: r.races?.track_type,
      track_length: r.races?.track_length,
      race_points: r.race_points,
      stage_1_points: r.stage_1_points,
      stage_2_points: r.stage_2_points,
    })) ?? []

  return NextResponse.json(formatted)
}
