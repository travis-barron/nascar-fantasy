'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient  } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()


  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    } else {
      router.push('/')
    }
  }

  const handleSignup = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    } else {
      alert('Check your email to confirm.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-4">
        <input
          className="border p-2"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="border p-2"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex gap-2">
          <button onClick={handleLogin} className="bg-black text-white px-4 py-2">
            Login
          </button>
          <button onClick={handleSignup} className="border px-4 py-2">
            Sign Up
          </button>
        </div>
      </div>
    </div>
  )
}
