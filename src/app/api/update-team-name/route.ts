import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { teamId, name } = await req.json()

  if (!name || name.length > 40) {
    return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
  }

  // Verify team ownership
  const { data: team } = await supabase
    .from('teams')
    .select('user_id')
    .eq('id', teamId)
    .single()

  if (!team || team.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await supabase
    .from('teams')
    .update({ name })
    .eq('id', teamId)

  return NextResponse.json({ success: true })
}
