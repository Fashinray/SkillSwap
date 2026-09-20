'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function EyeIcon({ open }: { open: boolean }) {
  return (
    <span className="material-symbols-outlined text-[#777587] text-xl">
      {open ? 'visibility' : 'visibility_off'}
    </span>
  )
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = createClient()
    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }
    if (user) {
      const { data: profile } = await supabase
        .from('users').select('role').eq('user_id', user.id).single()
      // Wait for session to be fully established before navigating
      // This is critical on mobile browsers over local HTTP
      await supabase.auth.getSession()
      const role = profile?.role
      if (role === 'super_admin') {
        router.replace('/superadmin')
      } else if (role === 'admin') {
        router.replace('/admin')
      } else {
        router.replace('/dashboard')
      }
      router.refresh()
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[#0b1c30] font-['Geist'] mb-2">Welcome back</h2>
        <p className="text-[#464555]">Log in to your academic exchange portal</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-[#464555] font-['Geist'] mb-1.5">
            University Email
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777587] text-xl">mail</span>
            <input
              name="email" type="email" required
              placeholder="you@oauife.edu.ng"
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-[#c7c4d8] focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 outline-none text-[#0b1c30] text-sm transition-all"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-semibold text-[#464555] font-['Geist']">Password</label>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777587] text-xl">lock</span>
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••"
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

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-red-600">error</span>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full py-3.5 bg-[#4f46e5] text-white rounded-xl font-semibold font-['Geist'] flex items-center justify-center gap-2 hover:bg-[#3525cd] active:scale-[0.98] transition-all shadow-lg shadow-[#4f46e5]/25 disabled:opacity-60">
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Signing in...
            </>
          ) : (
            <>Log In <span className="material-symbols-outlined text-lg">arrow_forward</span></>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#464555]">
        No account yet?{' '}
        <Link href="/register" className="text-[#4f46e5] font-semibold hover:underline font-['Geist']">
          Create one free
        </Link>
      </p>
    </div>
  )
}
