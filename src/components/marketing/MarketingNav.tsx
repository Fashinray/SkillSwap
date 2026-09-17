'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function MarketingNav() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-[#4F46E5] font-['Geist']">
          SkillSwap
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="#how-it-works" className="text-sm text-slate-600 hover:text-[#4F46E5] transition-colors">How It Works</Link>
          <Link href="/match" className="text-sm text-slate-600 hover:text-[#4F46E5] transition-colors">Browse Skills</Link>
          <Link href="#features" className="text-sm text-slate-600 hover:text-[#4F46E5] transition-colors">Features</Link>
          <Link href="#for-students" className="text-sm text-slate-600 hover:text-[#4F46E5] transition-colors">For Students</Link>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login"
            className="px-4 py-2 text-sm font-medium text-[#4F46E5] hover:bg-indigo-50 rounded-xl transition-colors">
            Log In
          </Link>
          <Link href="/register"
            className="px-4 py-2 text-sm font-medium bg-[#4F46E5] text-white rounded-xl hover:bg-[#3f38c4] transition-colors">
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Toggle menu">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
            }
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white px-6 py-4 space-y-3">
          {['How It Works:#how-it-works', 'Browse Skills:/match', 'Features:#features', 'For Students:#for-students'].map((item) => {
            const [label, href] = item.split(':')
            return (
              <Link key={href} href={href}
                onClick={() => setOpen(false)}
                className="block text-sm text-slate-600 hover:text-[#4F46E5] py-2">
                {label}
              </Link>
            )
          })}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <Link href="/login" onClick={() => setOpen(false)}
              className="text-center px-4 py-2.5 text-sm font-medium text-[#4F46E5] border border-indigo-200 rounded-xl hover:bg-indigo-50">
              Log In
            </Link>
            <Link href="/register" onClick={() => setOpen(false)}
              className="text-center px-4 py-2.5 text-sm font-medium bg-[#4F46E5] text-white rounded-xl hover:bg-[#3f38c4]">
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
