import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import AddRaceForm from './AddRaceForm'

export default async function AddRacePage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get profile / role
  const { data: profile } = await supabase
        .from('profiles')
        .select('is_commissioner')
        .eq('id', user.id)
        .single()
    
      if (!profile?.is_commissioner) {
        redirect('/my-team')
      }

  return <AddRaceForm />
}