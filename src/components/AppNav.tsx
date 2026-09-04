'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

interface NavUser {
  full_name: string
  credit_balance: number
  reputation_score: number
  role: string
}

export default function AppNav({ user }: { user: NavUser | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const links = [
    { href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { href: '/match', icon: 'hub', label: 'Find Match' },
    { href: '/sessions', icon: 'calendar_month', label: 'Sessions' },
    { href: '/profile', icon: 'person', label: 'Profile' },
    { href: '/credits', icon: 'account_balance_wallet', label: 'Credits' },
    ...(user?.role === 'admin' ? [{ href: '/admin', icon: 'admin_panel_settings', label: 'Admin' }] : []),
  ]

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Mobile top bar */}
      <nav className="md:hidden glass-header fixed top-0 left-0 right-0 z-40 px-4 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#4f46e5] rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-base">swap_horiz</span>
          </div>
          <span className="font-bold text-[#4f46e5] font-['Geist']">SkillSwap</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#006e4b]/10 rounded-full">
            <span className="material-symbols-outlined text-[#006e4b] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>toll</span>
            <span className="text-sm font-bold text-[#006e4b] font-['Geist']">{user?.credit_balance ?? 0}</span>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl text-[#464555] hover:bg-[#e5eeff] transition-colors">
            <span className="material-symbols-outlined">{mobileOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 pt-16" onClick={() => setMobileOpen(false)}>
          <div className="bg-white h-auto shadow-xl border-b border-[#e5eeff] px-4 py-4 space-y-1"
            onClick={(e) => e.stopPropagation()}>
            {user && (
              <div className="px-3 py-3 mb-3 bg-[#eff4ff] rounded-xl">
                <p className="text-sm font-semibold text-[#0b1c30] font-['Geist']">{user.full_name}</p>
                <p className="text-xs text-[#464555] mt-0.5">Rep: {user.reputation_score}</p>
              </div>
            )}
            {links.map((link) => (
              <Link key={link.href} href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors font-['Geist'] ${
                  pathname === link.href
                    ? 'bg-[#e5eeff] text-[#4f46e5]'
                    : 'text-[#464555] hover:bg-[#eff4ff]'
                }`}>
                <span className="material-symbols-outlined text-xl">{link.icon}</span>
                {link.label}
              </Link>
            ))}
            <button onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors font-['Geist']">
              <span className="material-symbols-outlined text-xl">logout</span>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </>
  )
}
