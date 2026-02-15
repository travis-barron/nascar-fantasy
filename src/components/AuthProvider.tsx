'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient  } from '@/lib/supabase-browser'
import { Session } from '@supabase/supabase-js'
import { useRouter, usePathname } from 'next/navigation'

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createSupabaseBrowserClient()


  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
      setLoading(false)
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (loading) return

    if (!session && pathname !== '/login') {
      router.push('/login')
    }

    if (session && pathname === '/login') {
      router.push('/')
    }
  }, [session, loading, pathname, router])

  if (loading) return null

  return <>{children}</>
}
