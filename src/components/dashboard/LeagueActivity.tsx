import { createSupabaseServerClient } from '@/lib/supabase-server'

export default async function LeagueActivity() {
  const supabase = await createSupabaseServerClient()

  const { data: activity } = await supabase
    .from('notifications')
    .select('*')
    .eq('scope', 'league')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">
        League Activity
      </h2>

      <div className="space-y-3">
        {activity?.map((item) => (
          <div
            key={item.id}
            className="border rounded p-3"
          >
            <div className="text-sm">
              {item.message}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(item.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}