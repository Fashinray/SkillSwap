import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function SuperAdminOverview() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/dashboard')

  const admin = createAdminClient()

  const [
    { count: totalUsers },
    { count: pendingVerification },
    { count: verifiedUsers },
    { count: totalSessions },
    { count: completedSessions },
    { count: ghostedSessions },
    { count: openDisputes },
    { count: lockedEscrow },
  ] = await Promise.all([
    admin.from('users').select('*', { count: 'exact', head: true }),
    admin.from('users').select('*', { count: 'exact', head: true }).in('verification_status', ['pending', 'under_review']),
    admin.from('users').select('*', { count: 'exact', head: true }).eq('admin_verified', true),
    admin.from('sessions').select('*', { count: 'exact', head: true }),
    admin.from('sessions').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    admin.from('sessions').select('*', { count: 'exact', head: true }).eq('status', 'ghosted'),
    admin.from('disputes').select('*', { count: 'exact', head: true }).in('status', ['open', 'under_review']),
    admin.from('escrow_records').select('*', { count: 'exact', head: true }).in('status', ['locked', 'disputed']),
  ])

  const completionRate = totalSessions
    ? Math.round(((completedSessions ?? 0) / totalSessions) * 100)
    : 0

  const stats = [
    { label: 'Total Users', value: totalUsers ?? 0, icon: 'group', color: 'text-[#6b38d4]', bg: 'bg-[#6b38d4]/10', href: '/superadmin/users' },
    { label: 'Pending Verification', value: pendingVerification ?? 0, icon: 'pending', color: 'text-amber-400', bg: 'bg-amber-400/10', href: '/superadmin/verification' },
    { label: 'Verified Users', value: verifiedUsers ?? 0, icon: 'verified', color: 'text-emerald-400', bg: 'bg-emerald-400/10', href: '/superadmin/users' },
    { label: 'Total Sessions', value: totalSessions ?? 0, icon: 'calendar_month', color: 'text-blue-400', bg: 'bg-blue-400/10', href: '/superadmin/sessions' },
    { label: 'Completion Rate', value: `${completionRate}%`, icon: 'check_circle', color: 'text-emerald-400', bg: 'bg-emerald-400/10', href: '/superadmin/sessions' },
    { label: 'Ghosted Sessions', value: ghostedSessions ?? 0, icon: 'ghost', color: 'text-orange-400', bg: 'bg-orange-400/10', href: '/superadmin/sessions' },
    { label: 'Open Disputes', value: openDisputes ?? 0, icon: 'gavel', color: 'text-red-400', bg: 'bg-red-400/10', href: '/superadmin/disputes' },
    { label: 'Locked Escrow', value: lockedEscrow ?? 0, icon: 'lock', color: 'text-yellow-400', bg: 'bg-yellow-400/10', href: '/superadmin/escrow' },
  ]

  const quickActions = [
    { label: 'Review Pending Docs', href: '/superadmin/verification', icon: 'verified_user', count: pendingVerification ?? 0, urgent: (pendingVerification ?? 0) > 0 },
    { label: 'Resolve Disputes', href: '/superadmin/disputes', icon: 'gavel', count: openDisputes ?? 0, urgent: (openDisputes ?? 0) > 0 },
    { label: 'Release Escrow', href: '/superadmin/escrow', icon: 'account_balance_wallet', count: lockedEscrow ?? 0, urgent: false },
    { label: 'Run Ghost Sweep', href: '/superadmin/sessions', icon: 'local_police', count: 0, urgent: false },
    { label: 'Platform Settings', href: '/superadmin/settings', icon: 'settings', count: 0, urgent: false },
    { label: 'Manage Users', href: '/superadmin/users', icon: 'manage_accounts', count: 0, urgent: false },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white font-['Geist']">
          Super Admin Overview
        </h1>
        <p className="text-[#8888aa] mt-1 text-sm">
          Full platform control — SkillSwap OAU
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}
            className="bg-[#1a1a2e] border border-[#2d2d4e] rounded-2xl p-5 hover:border-[#6b38d4] transition-colors group">
            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
              <span className={`material-symbols-outlined ${stat.color} text-xl`}
                style={{ fontVariationSettings: "'FILL' 1" }}>
                {stat.icon}
              </span>
            </div>
            <p className={`text-2xl font-bold ${stat.color} font-['Geist']`}>
              {stat.value}
            </p>
            <p className="text-xs text-[#8888aa] mt-0.5">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-white font-['Geist'] mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}
              className={`bg-[#1a1a2e] border rounded-2xl p-5 flex items-center gap-4 hover:border-[#6b38d4] transition-colors ${
                action.urgent ? 'border-amber-500/50' : 'border-[#2d2d4e]'
              }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                action.urgent ? 'bg-amber-500/20' : 'bg-[#6b38d4]/20'
              }`}>
                <span className={`material-symbols-outlined text-xl ${
                  action.urgent ? 'text-amber-400' : 'text-[#6b38d4]'
                }`}>
                  {action.icon}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white font-['Geist'] leading-tight">
                  {action.label}
                </p>
                {action.count > 0 && (
                  <p className="text-xs text-amber-400 mt-0.5">
                    {action.count} pending
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
