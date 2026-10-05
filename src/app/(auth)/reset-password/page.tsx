'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function EyeIcon({ open }: { open: boolean }) {
  return (
    <span className="material-symbols-outlined text-[#777587] text-xl">
      {open ? 'visibility' : 'visibility_off'}
    </span>
  )
}

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    // Requires an active (recovery) session — established by
    // /auth/confirm's verifyOtp({ type: 'recovery', ... }) call when the
    // user clicked the link in their reset email. If they land here
    // without that, updateUser fails with its own clear auth error.
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setDone(true)
    setTimeout(() => router.replace('/dashboard'), 2000)
  }

  if (done) {
    return (
      <div>
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#0b1c30] font-['Geist'] mb-2">Password updated</h2>
          <p className="text-[#464555]">Taking you to your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[#0b1c30] font-['Geist'] mb-2">Set a new password</h2>
        <p className="text-[#464555]">Choose a new password for your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-[#464555] font-['Geist'] mb-1.5">New Password</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777587] text-xl">lock</span>
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              required minLength={8}
              placeholder="At least 8 characters"
              className="w-full pl-11 pr-12 py-3 rounded-xl bg-white border border-[#c7c4d8] focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 outline-none text-[#0b1c30] text-sm transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              onPointerDown={(e) => e.preventDefault()}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-2 -mr-2 touch-manipulation hover:text-[#0b1c30] transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}>
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#464555] font-['Geist'] mb-1.5">Confirm New Password</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777587] text-xl">lock</span>
            <input
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              required minLength={8}
              placeholder="Re-enter your new password"
              className="w-full pl-11 pr-12 py-3 rounded-xl bg-white border border-[#c7c4d8] focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 outline-none text-[#0b1c30] text-sm transition-all"
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
          {loading ? 'Updating...' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
