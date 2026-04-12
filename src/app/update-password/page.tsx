'use client'

import { createSupabaseBrowserClient } from "@/lib/supabase-browser"
import { useState } from 'react'
import Image from 'next/image'

export default function UpdatePasswordPage() {
    const supabase = createSupabaseBrowserClient()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [message, setMessage] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

      const handleUpdatePassword = async () => {
    setMessage(null)

    if (password !== confirmPassword) {
      setMessage("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password,
    })

    setLoading(false)

    if (error) {
      setMessage(error.message)
    } else {
      setMessage("Password updated successfully 🎉")
        setTimeout(() => {
            window.location.href = "/login"
        }, 1500)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-4">
        <Image src="/logo.png"
                alt="travisbarron.studio"
                className="mx-auto"
                width={430}
                height={131}
                />
        <input
          type="password"
          className="border p-2"
          placeholder="New Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          className="border p-2"
          placeholder="Confirm Password"
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <div className="flex gap-2">
          <button
            onClick={handleUpdatePassword}
            className="border bg-black text-white px-4 py-2"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>

        {message && (
          <p className="text-sm border p-2">{message}</p>
        )}
      </div>
    </div>
  )
}