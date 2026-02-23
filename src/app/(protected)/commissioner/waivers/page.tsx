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

  if (!league) return <div>No league found.</div>

  return (
    <form
      action={async () => {
        'use server'
        await processWaivers(league.id)
      }}
    >
      <button
        type="submit"
        className="bg-red-600 text-white px-4 py-2 rounded"
      >
        Process Waivers
      </button>
    </form>
  )
}
