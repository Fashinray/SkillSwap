'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signUp } from '@/lib/actions/auth'
import { submitVerificationDocuments } from '@/lib/actions/verification'

function EyeIcon({ open }: { open: boolean }) {
  return (
    <span className="material-symbols-outlined text-[#777587] text-xl">
      {open ? 'visibility' : 'visibility_off'}
    </span>
  )
}

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {[1, 2, 3].map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
            current >= step
              ? 'bg-[#4f46e5] text-white'
              : 'bg-[#e5eeff] text-[#4f46e5]'
          }`}>
            {current > step
              ? <span className="material-symbols-outlined text-sm">check</span>
              : step}
          </div>
          {i < 2 && (
            <div className={`w-10 h-0.5 ${current > step ? 'bg-[#4f46e5]' : 'bg-[#c7c4d8]'}`} />
          )}
        </div>
      ))}
      <div className="ml-2 text-xs text-[#464555]">
        {current === 1 && 'Create account'}
        {current === 2 && 'Verify skills'}
        {current === 3 && 'Under review'}
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [files, setFiles] = useState<File[]>([])

  async function handleAccountSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    const result = await signUp(formData)
    if (result?.error) { setError(result.error); setLoading(false); return }
    if (result?.success) {
      setMessage(result.message ?? '')
      // Small delay for mobile session write
      await new Promise((r) => setTimeout(r, 300))
      setStep(2)
    }
    setLoading(false)
  }

  async function handleDocSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData()
    fd.append('linkedinUrl', linkedinUrl)
    fd.append('githubUrl', githubUrl)
    fd.append('portfolioUrl', portfolioUrl)
    files.forEach((f) => fd.append('documents', f))
    const result = await submitVerificationDocuments(fd)
    if (result?.error) { setError(result.error); setLoading(false); return }
    setStep(3)
    setLoading(false)
  }

  // ── STEP 3 — Pending ──────────────────────────────────────────────────────
  if (step === 3) {
    return (
      <div className="text-center space-y-5">
        <StepIndicator current={3} />
        <div className="w-16 h-16 bg-[#e5eeff] rounded-full flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-[#4f46e5] text-3xl">
            hourglass_top
          </span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#0b1c30] font-['Geist']">
            Documents Submitted
          </h2>
          <p className="text-sm text-[#464555] mt-2 leading-relaxed">
            Your account is under review. The super admin will verify your
            documents and score your skills within 24 to 48 hours.
            You will be notified by email once approved.
          </p>
        </div>
        <div className="p-4 bg-[#eff4ff] rounded-xl text-left space-y-2 text-xs text-[#464555]">
          {[
            'Super admin reviews your submitted documents and links',
            'Admin scores each skill you listed from 1 to 5 stars',
            'Your profile shows Beginner, Intermediate, or Expert per skill',
            'You receive 5 starter credits and full platform access',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[#4f46e5] text-sm mt-0.5">
                check_circle
              </span>
              {item}
            </div>
          ))}
        </div>
        <p className="text-sm text-[#464555]">
          Already verified?{' '}
          <Link href="/login" className="text-[#4f46e5] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    )
  }

  // ── STEP 2 — Document Upload ──────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="space-y-5">
        <StepIndicator current={2} />
        <div>
          <h2 className="text-2xl font-bold text-[#0b1c30] font-['Geist']">
            Verify Your Skills
          </h2>
          <p className="text-sm text-[#464555] mt-1">
            Upload documents or share your profile links. The super admin
            will review and score your skills. This keeps SkillSwap trustworthy.
          </p>
        </div>

        <form onSubmit={handleDocSubmit} className="space-y-4">
          <p className="text-sm font-semibold text-[#0b1c30] font-['Geist']">
            Profile Links
          </p>

          {[
            { icon: 'work', value: linkedinUrl, set: setLinkedinUrl, placeholder: 'LinkedIn profile URL (optional)' },
            { icon: 'code', value: githubUrl, set: setGithubUrl, placeholder: 'GitHub profile URL (optional)' },
            { icon: 'language', value: portfolioUrl, set: setPortfolioUrl, placeholder: 'Portfolio website URL (optional)' },
          ].map((field) => (
            <div key={field.placeholder} className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777587] text-xl">
                {field.icon}
              </span>
              <input
                type="url"
                value={field.value}
                onChange={(e) => field.set(e.target.value)}
                placeholder={field.placeholder}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-[#c7c4d8] focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 outline-none text-[#0b1c30] text-sm"
              />
            </div>
          ))}

          <div>
            <p className="text-sm font-semibold text-[#0b1c30] font-['Geist'] mb-2">
              Upload Certificates or Portfolio Files
            </p>
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-[#c7c4d8] rounded-xl cursor-pointer hover:border-[#4f46e5] hover:bg-[#eff4ff] transition-colors">
              <span className="material-symbols-outlined text-[#777587] text-3xl">
                upload_file
              </span>
              <span className="text-sm text-[#464555] mt-1">
                {files.length > 0
                  ? `${files.length} file${files.length > 1 ? 's' : ''} selected`
                  : 'Click to upload PDF, PNG, or JPG'}
              </span>
              <span className="text-xs text-[#777587]">Max 5 MB per file</span>
              <input
                type="file" multiple accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                className="hidden"
              />
            </label>
            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[#464555]">
                    <span className="material-symbols-outlined text-[#4f46e5] text-sm">description</span>
                    {f.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-[#777587] bg-[#eff4ff] p-3 rounded-xl">
            Provide at least one link or one file. You can update your
            documents later from your profile page.
          </p>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="flex-1 py-3 bg-[#4f46e5] text-white rounded-xl font-semibold font-['Geist'] hover:bg-[#3525cd] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
              {loading ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>Submit for Review <span className="material-symbols-outlined text-lg">arrow_forward</span></>
              )}
            </button>
            <button type="button" onClick={() => setStep(3)}
              className="px-4 py-3 border border-[#c7c4d8] text-[#464555] text-sm rounded-xl hover:bg-[#eff4ff] transition-colors">
              Skip
            </button>
          </div>
        </form>
      </div>
    )
  }

  // ── STEP 1 — Account Creation ─────────────────────────────────────────────
  return (
    <div>
      <StepIndicator current={1} />
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#0b1c30] font-['Geist']">Join SkillSwap</h2>
        <p className="text-sm text-[#464555] mt-1">
          Exchange skills with OAU students. No money required.
        </p>
      </div>

      <form onSubmit={handleAccountSubmit} className="space-y-4">
        {[
          { label: 'Full Name', name: 'fullName', type: 'text', icon: 'person', placeholder: 'Fadare Tolulope' },
          { label: 'Email Address', name: 'email', type: 'email', icon: 'mail', placeholder: 'you@oauife.edu.ng' },
        ].map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-semibold text-[#464555] font-['Geist'] mb-1.5">
              {field.label}
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777587] text-xl">
                {field.icon}
              </span>
              <input name={field.name} type={field.type} required placeholder={field.placeholder}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-[#c7c4d8] focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 outline-none text-[#0b1c30] text-sm transition-all" />
            </div>
          </div>
        ))}

        <div>
          <label className="block text-sm font-semibold text-[#464555] font-['Geist'] mb-1.5">Password</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777587] text-xl">lock</span>
            <input name="password" type={showPassword ? 'text' : 'password'} required minLength={8}
              placeholder="At least 8 characters"
              className="w-full pl-11 pr-12 py-3 rounded-xl bg-white border border-[#c7c4d8] focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 outline-none text-[#0b1c30] text-sm transition-all" />
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
          <label className="block text-sm font-semibold text-[#464555] font-['Geist'] mb-1.5">Confirm Password</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777587] text-xl">lock</span>
            <input name="confirmPassword" type={showPassword ? 'text' : 'password'} required minLength={8}
              placeholder="Re-enter your password"
              className="w-full pl-11 pr-12 py-3 rounded-xl bg-white border border-[#c7c4d8] focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 outline-none text-[#0b1c30] text-sm transition-all" />
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
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
            <span className="material-symbols-outlined text-lg">error</span>
            {error}
          </div>
        )}

        {message && (
          <div className="p-3 bg-[#e5eeff] border border-[#4f46e5]/20 rounded-xl text-sm text-[#3525cd] flex items-start gap-2">
            <span className="material-symbols-outlined text-lg text-[#4f46e5]">mark_email_read</span>
            {message}
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full py-3 bg-[#4f46e5] text-white rounded-xl font-semibold font-['Geist'] hover:bg-[#3525cd] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
          {loading ? (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <>Continue <span className="material-symbols-outlined text-lg">arrow_forward</span></>
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-[#464555]">
        Already have an account?{' '}
        <Link href="/login" className="text-[#4f46e5] font-semibold hover:underline font-['Geist']">
          Sign in
        </Link>
      </p>
    </div>
  )
}
