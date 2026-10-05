'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
    })
    setLoading(false)
    if (resetError) {
      setError(resetError.message)
      return
    }
    // Always show the same success state regardless of whether the email
    // actually exists — don't let this page be used to probe which
    // addresses have accounts.
    setSent(true)
  }

  if (sent) {
    return (
      <div>
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#0b1c30] font-['Geist'] mb-2">Check your email</h2>
          <p className="text-[#464555]">
            If an account exists for <span className="font-medium">{email}</span>, we&apos;ve sent a link to reset your password.
          </p>
        </div>
        <Link href="/login" className="text-[#4f46e5] font-semibold hover:underline font-['Geist'] text-sm">
          ← Back to login
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[#0b1c30] font-['Geist'] mb-2">Reset your password</h2>
        <p className="text-[#464555]">Enter your email and we&apos;ll send you a reset link.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-[#464555] font-['Geist'] mb-1.5">
            University Email
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777587] text-xl">mail</span>
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@oauife.edu.ng"
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-[#c7c4d8] focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 outline-none text-[#0b1c30] text-sm transition-all"
            />
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-red-600">error</span>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full py-3.5 bg-[#4f46e5] text-white rounded-xl font-semibold font-['Geist'] flex items-center justify-center gap-2 hover:bg-[#3525cd] active:scale-[0.98] transition-all shadow-lg shadow-[#4f46e5]/25 disabled:opacity-60">
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#464555]">
        Remembered it?{' '}
        <Link href="/login" className="text-[#4f46e5] font-semibold hover:underline font-['Geist']">
          Back to login
        </Link>
      </p>
    </div>
  )
}
