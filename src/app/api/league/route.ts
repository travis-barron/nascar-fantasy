import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: team } = await supabase
    .from('teams')
    .select('league_id')
    .eq('user_id', user.id)
    .single()

  if (!team) {
    return NextResponse.json({ name: null })
  }

  const { data: league } = await supabase
    .from('leagues')
    .select('name')
    .eq('id', team.league_id)
    .single()

  return NextResponse.json({ name: league?.name || null })
}
