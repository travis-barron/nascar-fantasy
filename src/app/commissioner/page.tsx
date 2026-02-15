import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function CommissionerHome() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_commissioner')
    .eq('id', user.id)
    .single()

  if (!profile?.is_commissioner) {
    redirect('/my-team')
  }

  // Get pending waiver count
  const { count } = await supabase
    .from('waiver_claims')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const pendingCount = count ?? 0



  return (
    <div className="max-w-4xl mx-auto py-10 space-y-8">
      <h1 className="text-3xl font-bold">
        Commissioner Control Panel
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <Link
          href="/commissioner/results"
          className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition border"
        >
          <h2 className="text-lg font-semibold mb-2">
            Enter Race Results
          </h2>
          <p className="text-sm text-gray-600">
            Input finishing positions and stage points.
          </p>
        </Link>

        <Link
          href="/commissioner/waivers"
          className="relative p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition border"
        >
          {pendingCount > 0 && (
            <span className="absolute top-3 right-3 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
              {pendingCount}
            </span>
          )}


          <h2 className="text-lg font-semibold mb-2">
            Process Waivers
          </h2>
          <p className="text-sm text-gray-600">
            Execute pending waiver claims.
          </p>
        </Link>

        <Link
          href="/commissioner/league-status"
          className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition border"
        >
          <h2 className="text-lg font-semibold mb-2">
            League Status
          </h2>
          <p className="text-sm text-gray-600">
            View standings and waiver priority.
          </p>
        </Link>

      </div>
    </div>
  )
}
