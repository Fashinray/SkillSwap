'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navLinks = [
  { href: '/superadmin', label: 'Overview', icon: 'dashboard', exact: true },
  { href: '/superadmin/verification', label: 'Verification', icon: 'verified_user' },
  { href: '/superadmin/users', label: 'Users', icon: 'group' },
  { href: '/superadmin/sessions', label: 'Sessions', icon: 'calendar_month' },
  { href: '/superadmin/disputes', label: 'Disputes', icon: 'gavel' },
  { href: '/superadmin/escrow', label: 'Escrow', icon: 'account_balance_wallet' },
  { href: '/superadmin/settings', label: 'Settings', icon: 'settings' },
]

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase
        .from('users')
        .select('full_name, role, email')
        .eq('user_id', user.id)
        .single()
      if (profile?.role !== 'super_admin') { router.push('/dashboard'); return }
      setAdminName(profile.full_name ?? '')
      setAdminEmail(profile.email ?? '')
    }
    loadProfile()
  }, [router])

  // Current page label for mobile header
  const currentPage = navLinks.find((l) =>
    l.exact ? pathname === l.href : pathname.startsWith(l.href)
  )
  const isOverview = pathname === '/superadmin'

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a]">

      {/* ── DESKTOP TOP NAV (lg and above) ─────────────────────────── */}
      <nav className="hidden lg:flex bg-[#1a1a2e] border-b border-[#2d2d4e] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 w-full flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/superadmin" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#6b38d4] flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-lg">
                  admin_panel_settings
                </span>
              </div>
              <div>
                <span className="text-white font-bold font-['Geist'] text-sm">
                  SkillSwap
                </span>
                <span className="ml-2 text-xs px-2 py-0.5 bg-[#6b38d4] text-white rounded-full font-medium">
                  Super Admin
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-1">
              {navLinks.map((link) => {
                const active = link.exact
                  ? pathname === link.href
                  : pathname.startsWith(link.href)
                return (
                  <Link key={link.href} href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                      active
                        ? 'bg-[#6b38d4]/20 text-[#6b38d4]'
                        : 'text-[#8888aa] hover:text-white hover:bg-[#2d2d4e]'
                    }`}>
                    <span className="material-symbols-outlined text-base"
                      style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                      {link.icon}
                    </span>
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-white font-medium font-['Geist']">{adminName}</p>
              <p className="text-xs text-[#8888aa]">{adminEmail}</p>
            </div>
            <button onClick={handleSignOut}
              className="p-2 rounded-lg text-[#8888aa] hover:text-white hover:bg-[#2d2d4e] transition-colors">
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── MOBILE TOP BAR (below lg) ──────────────────────────────── */}
      <nav className="lg:hidden bg-[#1a1a2e] border-b border-[#2d2d4e] sticky top-0 z-40">
        <div className="h-14 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Back button — shown on all pages except overview */}
            {!isOverview && (
              <button
                onClick={() => router.back()}
                className="p-2 -ml-2 rounded-lg text-[#8888aa] hover:text-white hover:bg-[#2d2d4e] transition-colors">
                <span className="material-symbols-outlined text-xl">arrow_back</span>
              </button>
            )}

            {/* Logo — only on overview */}
            {isOverview && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#6b38d4] flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-base">
                    admin_panel_settings
                  </span>
                </div>
                <span className="text-white font-bold font-['Geist'] text-sm">
                  Super Admin
                </span>
              </div>
            )}

            {/* Current page title — shown on sub-pages */}
            {!isOverview && currentPage && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#6b38d4] text-lg">
                  {currentPage.icon}
                </span>
                <span className="text-white font-semibold font-['Geist'] text-sm">
                  {currentPage.label}
                </span>
              </div>
            )}
          </div>

          {/* Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg text-[#8888aa] hover:text-white hover:bg-[#2d2d4e] transition-colors">
            <span className="material-symbols-outlined text-xl">
              {mobileOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {mobileOpen && (
          <div className="border-t border-[#2d2d4e] bg-[#1a1a2e] px-3 py-3 space-y-1">
            {/* Admin info */}
            {adminName && (
              <div className="px-3 py-2 mb-2 border-b border-[#2d2d4e]">
                <p className="text-xs text-white font-medium font-['Geist']">{adminName}</p>
                <p className="text-xs text-[#8888aa]">{adminEmail}</p>
              </div>
            )}

            {navLinks.map((link) => {
              const active = link.exact
                ? pathname === link.href
                : pathname.startsWith(link.href)
              return (
                <Link key={link.href} href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#6b38d4]/20 text-[#6b38d4]'
                      : 'text-[#8888aa] hover:text-white hover:bg-[#2d2d4e]'
                  }`}>
                  <span className="material-symbols-outlined text-xl"
                    style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                    {link.icon}
                  </span>
                  {link.label}
                </Link>
              )
            })}

            <button onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-900/20 transition-colors mt-2">
              <span className="material-symbols-outlined text-xl">logout</span>
              Sign Out
            </button>
          </div>
        )}
      </nav>

      {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  )
}
