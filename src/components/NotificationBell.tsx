import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default async function NotificationBell() {
  const supabase = createSupabaseBrowserClient()
  const [count, setCount] = useState(0)

    let userId = '';
    supabase.auth.getUser().then((u) => {
        if (u != null)
        userId = u.data.user == null ? '' : u.data.user.id
    })

    

  useEffect(() => {
    const fetchUnread = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('read', false)

      setCount(data?.length ?? 0)
    }

    fetchUnread()



    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchUnread()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, userId])

  return (
    <div className="relative">
      🔔
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
          {count}
        </span>
      )}
    </div>
  )
}