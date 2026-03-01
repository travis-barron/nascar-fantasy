import { createSupabaseServerClient } from '@/lib/supabase-server'

type Props = {
  driverId: string
  selectable?: boolean
  selected?: boolean
  onSelect?: (id: string) => void
}

export default async function DriverStatRow({
  driverId,
}: Props) {
  const supabase = await createSupabaseServerClient()

  // Get driver
  const { data: driver } = await supabase
    .from('drivers')
    .select('first_name, last_name')
    .eq('id', driverId)
    .single()

  // Season totals
  const { data: results } = await supabase
    .from('race_results')
    .select(`
      race_points,
      stage_1_points,
      stage_2_points,
      races!inner(season_id)
    `)

  const seasonTotal = (results ?? [])
    .filter((r: any) => r.races?.season_id)
    .reduce((acc: number, r: any) => {
      return (
        acc +
        (r.race_points ?? 0) +
        (r.stage_1_points ?? 0) +
        (r.stage_2_points ?? 0)
      )
    }, 0)

  const lastRacePoints =
    results?.slice(-1)[0]?.race_points ?? 0

  return (
    <tr className="border-b">
      <td className="p-2">
        {driver?.first_name} {driver?.last_name}
      </td>
      <td className="p-2 font-semibold">
        {seasonTotal}
      </td>
      <td className="p-2">
        {lastRacePoints}
      </td>
    </tr>
  )
}