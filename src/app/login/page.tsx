'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cooldown, setCooldown] = useState(false)
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

const handleForgotPassword = async () => {
  if (!email.trim()) {
    alert("Please enter your email address first.")
    return
  }

  if (cooldown) return

  setCooldown(true)

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/update-password`,
  })

  if (error) {
    console.error(error.message)
  }

  alert("If that email exists, a reset link has been sent.")

  setTimeout(() => setCooldown(false), 60000)
}

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-4">
        <Image src="/logo_sub.png"
        alt="travisbarron.studio"
        className="mx-auto"
        width={430}
        height={131}
        />
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
          <button onClick={handleForgotPassword} className="border px-4 py-2">
            Forgot Password?
          </button>
        </div>
      </div>
    </div>
  )
}
