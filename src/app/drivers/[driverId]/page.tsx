import { createSupabaseServerClient } from '@/lib/supabase-server'
import DriverHistory from './DriverHistory'

export default async function DriverPage({
  params,
}: {
  params: Promise<{ driverId: string }>
}) {
  const supabase = await createSupabaseServerClient()
  const { driverId } = await params

  const { data: driver } = await supabase
    .from('drivers')
    .select('*')
    .eq('id', driverId)
    .single()

  if (!driver) {
    return <div>Driver not found</div>
  }

  const { data: seasons } = await supabase
    .from('seasons')
    .select('*')
    .order('year', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        {driver.first_name} {driver.last_name}
      </h1>

      <DriverHistory
        driverId={driver.id}
        seasons={seasons ?? []}
      />
    </div>
  )
}
