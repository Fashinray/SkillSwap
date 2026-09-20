'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { href: '/dashboard', icon: 'dashboard', label: 'Home' },
  { href: '/match', icon: 'hub', label: 'Match' },
  { href: '/sessions', icon: 'calendar_month', label: 'Sessions' },
  { href: '/profile', icon: 'person', label: 'Profile' },
  { href: '/credits', icon: 'account_balance_wallet', label: 'Credits' },
]

export default function AppBottomNav({
  role,
}: {
  role?: string
}) {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#e5eeff] safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const active = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-0 ${
                active ? 'text-[#4f46e5]' : 'text-[#777587]'
              }`}>
              <span className="material-symbols-outlined text-2xl"
                style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                {item.icon}
              </span>
              <span className={`text-xs font-medium font-['Geist'] truncate ${
                active ? 'text-[#4f46e5]' : 'text-[#777587]'
              }`}>
                {item.label}
              </span>
            </Link>
          )
        })}

        {role === 'admin' && (
          <Link href="/admin"
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
              pathname.startsWith('/admin') ? 'text-[#6b38d4]' : 'text-[#777587]'
            }`}>
            <span className="material-symbols-outlined text-2xl"
              style={{ fontVariationSettings: pathname.startsWith('/admin') ? "'FILL' 1" : "'FILL' 0" }}>
              admin_panel_settings
            </span>
            <span className="text-xs font-medium font-['Geist']">Admin</span>
          </Link>
        )}
      </div>
    </nav>
  )
}
