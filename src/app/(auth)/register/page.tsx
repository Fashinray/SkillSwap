'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signUp } from '@/lib/actions/auth'

function EyeIcon({ open }: { open: boolean }) {
  return (
    <span className="material-symbols-outlined text-[#777587] text-xl">
      {open ? 'visibility' : 'visibility_off'}
    </span>
  )
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    const formData = new FormData(e.currentTarget)
    const result = await signUp(formData)
    if (result?.error) setError(result.error)
    if (result?.success) setMessage(result.message ?? '')
    setLoading(false)
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[#0b1c30] font-['Geist'] mb-2">Join SkillSwap</h2>
        <p className="text-[#464555]">Exchange skills with fellow OAU students. No money required.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-[#464555] font-['Geist'] mb-1.5">Full Name</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777587] text-xl">person</span>
            <input name="fullName" type="text" required placeholder="Fadare Tolulope"
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-[#c7c4d8] focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 outline-none text-[#0b1c30] text-sm transition-all" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#464555] font-['Geist'] mb-1.5">University Email</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777587] text-xl">mail</span>
            <input name="email" type="email" required placeholder="you@oauife.edu.ng"
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-[#c7c4d8] focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 outline-none text-[#0b1c30] text-sm transition-all" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#464555] font-['Geist'] mb-1.5">Password</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777587] text-xl">lock</span>
            <input name="password" type={showPassword ? 'text' : 'password'} required minLength={8}
              placeholder="At least 8 characters"
              className="w-full pl-11 pr-12 py-3 rounded-xl bg-white border border-[#c7c4d8] focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 outline-none text-[#0b1c30] text-sm transition-all" />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 hover:text-[#0b1c30] transition-colors">
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
        {message && (
          <div className="p-3.5 bg-[#e5eeff] border border-[#4f46e5]/20 rounded-xl text-sm text-[#3525cd] flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-[#4f46e5]">mark_email_read</span>
            {message}
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
              Creating account...
            </>
          ) : (
            <>Create Account <span className="material-symbols-outlined text-lg">arrow_forward</span></>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#464555]">
        Already have an account?{' '}
        <Link href="/login" className="text-[#4f46e5] font-semibold hover:underline font-['Geist']">
          Sign in
        </Link>
      </p>
    </div>
  )
}
