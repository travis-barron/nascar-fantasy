import { createSupabaseServerClient } from '@/lib/supabase-server'
import { processWaivers } from '@/app/actions/processWaivers'
import { redirect } from 'next/navigation'

export default async function ProcessWaiversPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_commissioner')
    .eq('id', user.id)
    .single()

  if (!profile?.is_commissioner) {
    redirect('/my-team')
  }

  const { data: league } = await supabase
    .from('leagues')
    .select('*')
    .limit(1)
    .single()

  const { data: claims } = await supabase
    .from('waiver_claims')
    .select(`
    id,
    team_id,
    add_driver_id,
    drop_driver_id,
    teams ( name ),
    add_driver:drivers!waiver_claims_add_driver_id_fkey (
      first_name,
      last_name
    ),
    drop_driver:drivers!waiver_claims_drop_driver_id_fkey (
      first_name,
      last_name
    )
  `)
    .eq('league_id', league.id)
    .eq('status', 'pending')

  const { data: standings } = await supabase
    .from('standings')
    .select('team_id, waiver_priority')
    .eq('league_id', league.id)

  let preview: any[] = []

  if (claims && standings) {
    const claimsWithPriority = claims
      .map(claim => ({
        ...claim,
        priority:
          standings.find(s => s.team_id === claim.team_id)
            ?.waiver_priority ?? 999,
      }))
      .sort((a, b) => a.priority - b.priority)

    const takenDrivers = new Set<string>()
    const successfulTeams = new Set<string>()

    preview = claimsWithPriority.map(claim => {
      let predicted = 'Will Fail'

      if (
        !takenDrivers.has(claim.add_driver_id) &&
        !successfulTeams.has(claim.team_id)
      ) {
        predicted = 'Will Succeed'
        takenDrivers.add(claim.add_driver_id)
        successfulTeams.add(claim.team_id)
      }

      return {
        ...claim,
        predicted,
      }
    })
  }

  if (!league) return <div>No league found.</div>

  return (

    <form
      action={async () => {
        'use server'
        await processWaivers(league.id)
        window.location.reload();
      }}
    >
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">
          Pending Waiver Claims
        </h2>

        {preview.length === 0 && (
          <div className="text-gray-500">
            No pending claims.
          </div>
        )}

        {preview.length > 0 && (
          <table className="w-full border rounded overflow-hidden">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-2 text-left">Priority</th>
                <th className="p-2 text-left">Team</th>
                <th className="p-2 text-left">Add</th>
                <th className="p-2 text-left">Drop</th>
                <th className="p-2 text-left">Predicted</th>
              </tr>
            </thead>
            <tbody>
              {preview.map(claim => (
                <tr key={claim.id} className="border-b">
                  <td className="p-2">{claim.priority}</td>
                  <td className="p-2">
                    {claim.teams?.name}
                  </td>
                  <td className="p-2">
                    {claim.add_driver?.first_name}{' '}
                    {claim.add_driver?.last_name}
                  </td>
                  <td className="p-2">
                    {claim.drop_driver?.first_name}{' '}
                    {claim.drop_driver?.last_name}
                  </td>
                  <td className="p-2">
                    <span
                      className={
                        claim.predicted === 'Will Succeed'
                          ? 'text-green-600 font-semibold'
                          : 'text-red-600'
                      }
                    >
                      {claim.predicted}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <button
        type="submit"
        className="bg-red-600 text-white px-4 py-2 rounded"
      >
        Process Waivers
      </button>
    </form>
  )
}
