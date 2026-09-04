'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface SidebarUser {
  full_name: string
  credit_balance: number
  reputation_score: number
  role: string
  is_trusted?: boolean
}

const navItems = [
  { href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { href: '/match', icon: 'hub', label: 'Find Match' },
  { href: '/sessions', icon: 'calendar_month', label: 'Sessions' },
  { href: '/profile', icon: 'person', label: 'Profile' },
  { href: '/credits', icon: 'account_balance_wallet', label: 'Credits' },
]

export default function AppSidebar({ user }: { user: SidebarUser | null }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'U'

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white border-r border-[#e5eeff] z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[#e5eeff]">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#4f46e5] flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-lg">swap_horiz</span>
          </div>
          <span className="text-lg font-bold text-[#4f46e5] font-['Geist']">SkillSwap</span>
        </Link>
      </div>

      {/* User profile */}
      <div className="px-4 py-4 border-b border-[#e5eeff]">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#eff4ff]">
          <div className="w-10 h-10 rounded-full bg-[#4f46e5] flex items-center justify-center text-white font-bold text-sm font-['Geist'] shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-[#0b1c30] font-['Geist'] truncate">
                {user?.full_name ?? 'User'}
              </p>
              {user?.is_trusted && (
                <span className="material-symbols-outlined text-[#4f46e5] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              )}
            </div>
            <p className="text-xs text-[#464555]">Rep: {user?.reputation_score ?? 50}</p>
          </div>
        </div>
        {/* Credit balance pill */}
        <div className="mt-2 flex items-center justify-between px-3 py-2 rounded-lg bg-[#006e4b]/10 border border-[#006e4b]/20">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#006e4b] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>toll</span>
            <span className="text-sm font-bold text-[#006e4b] font-['Geist']">{user?.credit_balance ?? 0}</span>
          </div>
          <span className="text-xs text-[#464555]">credits</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all font-['Geist'] ${
                active
                  ? 'bg-[#e5eeff] text-[#4f46e5]'
                  : 'text-[#464555] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
              }`}>
              <span className="material-symbols-outlined text-xl"
                style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}

        {user?.role === 'admin' && (
          <Link href="/admin"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all font-['Geist'] ${
              pathname.startsWith('/admin')
                ? 'bg-[#e9ddff] text-[#6b38d4]'
                : 'text-[#464555] hover:bg-[#eff4ff] hover:text-[#6b38d4]'
            }`}>
            <span className="material-symbols-outlined text-xl"
              style={{ fontVariationSettings: pathname.startsWith('/admin') ? "'FILL' 1" : "'FILL' 0" }}>
              admin_panel_settings
            </span>
            Admin
          </Link>
        )}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-[#e5eeff]">
        <button onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#464555] hover:bg-red-50 hover:text-red-600 transition-all font-['Geist']">
          <span className="material-symbols-outlined text-xl">logout</span>
          Sign Out
        </button>
      </div>
    </aside>
  )
}
