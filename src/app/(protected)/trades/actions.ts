'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export async function proposeTradeAction(
  receivingTeamId: string,
  offerDriverId: string,
  requestDriverId: string
) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Get proposing team
  const { data: team } = await supabase
    .from('teams')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!team) throw new Error('Team not found')

  // Validate ownership
  const { data: ownsDriver } = await supabase
    .from('team_drivers')
    .select('id')
    .eq('team_id', team.id)
    .eq('driver_id', offerDriverId)
    .single()

  if (!ownsDriver) throw new Error('You do not own this driver')

  const { data: otherOwns } = await supabase
    .from('team_drivers')
    .select('id')
    .eq('team_id', receivingTeamId)
    .eq('driver_id', requestDriverId)
    .single()

  if (!otherOwns)
    throw new Error('Other team does not own requested driver')

  // Prevent duplicate pending trade
  const { data: existing } = await supabase
    .from('trades')
    .select('id')
    .eq('proposing_team_id', team.id)
    .eq('receiving_team_id', receivingTeamId)
    .eq('proposing_driver_id', offerDriverId)
    .eq('receiving_driver_id', requestDriverId)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing) throw new Error('Duplicate trade pending')

  await supabase.from('trades').insert({
    proposing_team_id: team.id,
    receiving_team_id: receivingTeamId,
    proposing_driver_id: offerDriverId,
    receiving_driver_id: requestDriverId,
  })

  // Get receiving team owner
  const { data: receivingTeam } = await supabase
    .from('teams')
    .select('owner_id')
    .eq('id', receivingTeamId)
    .single()

  if (receivingTeam?.owner_id) {
    await supabase.from('notifications').insert({
      user_id: receivingTeam.owner_id,
      type: 'trade_received',
      message: 'You have received a trade offer.',
      link: '/trades',
    })
  }

  await supabase.from('notifications').insert({
  scope: 'league',
  message: `New trade proposed between teams.`,
})
}

export async function respondToTradeAction(
  tradeId: string,
  accept: boolean
) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: team } = await supabase
    .from('teams')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!team) throw new Error('Team not found')

  const { data: trade } = await supabase
    .from('trades')
    .select('*')
    .eq('id', tradeId)
    .single()

  if (!trade || trade.status !== 'pending')
    throw new Error('Invalid trade')

  if (trade.receiving_team_id !== team.id)
    throw new Error('Not authorized')

  if (!accept) {
    await supabase
      .from('trades')
      .update({ status: 'rejected' })
      .eq('id', tradeId)
    return
  }

  // Validate drivers still owned
  const { data: proposingCheck } = await supabase
    .from('team_drivers')
    .select('id')
    .eq('team_id', trade.proposing_team_id)
    .eq('driver_id', trade.proposing_driver_id)
    .single()

  const { data: receivingCheck } = await supabase
    .from('team_drivers')
    .select('id')
    .eq('team_id', trade.receiving_team_id)
    .eq('driver_id', trade.receiving_driver_id)
    .single()

  if (!proposingCheck || !receivingCheck)
    throw new Error('Roster mismatch')

  // Perform swap
  await supabase
    .from('team_drivers')
    .delete()
    .eq('team_id', trade.proposing_team_id)
    .eq('driver_id', trade.proposing_driver_id)

  await supabase
    .from('team_drivers')
    .delete()
    .eq('team_id', trade.receiving_team_id)
    .eq('driver_id', trade.receiving_driver_id)

  await supabase.from('team_drivers').insert([
    {
      team_id: trade.proposing_team_id,
      driver_id: trade.receiving_driver_id,
    },
    {
      team_id: trade.receiving_team_id,
      driver_id: trade.proposing_driver_id,
    },
  ])

  await supabase
    .from('trades')
    .update({
      status: 'accepted',
      completed_at: new Date().toISOString(),
    })
    .eq('id', tradeId)
}