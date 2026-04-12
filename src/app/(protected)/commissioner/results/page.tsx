import { createSupabaseServerClient } from '@/lib/supabase-server'
import ResultsEntry from './ResultsEntry'
import { redirect } from 'next/navigation'
import { finalizeRace } from '@/app/actions/finalizeRace'


export default async function ResultsPage() {
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

  const { data: race } = await supabase
    .from('races')
    .select('*')
    .order('race_date', { ascending: false })

  if (!race) return <div>No race found.</div>

  const { data: drivers } = await supabase
    .from('drivers')
    .select('*')
    .order('last_name')

  return (
    <ResultsEntry
      races={race || []}
      drivers={drivers || []}
    />
  )
}
