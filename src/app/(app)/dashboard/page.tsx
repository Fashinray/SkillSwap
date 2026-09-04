import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, credit_balance, reputation_score, is_verified')
    .eq('user_id', user.id)
    .single()

  const { data: recentTx } = await supabase
    .from('transactions')
    .select('tx_id, type, amount, description, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: upcomingSessions } = await supabase
    .from('sessions')
    .select('session_id, scheduled_time, status, duration_minutes, skill_id, teacher_id, learner_id')
    .or(`teacher_id.eq.${user.id},learner_id.eq.${user.id}`)
    .in('status', ['scheduled', 'active'])
    .order('scheduled_time', { ascending: true })
    .limit(3)

  const { data: pendingMatches } = await supabase
    .from('matches')
    .select('match_id')
    .eq('recipient_id', user.id)
    .eq('status', 'pending')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0b1c30] font-['Geist']">
          Good day, {profile?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-[#464555] mt-1">
          Here is what is happening with your skill exchanges today.
        </p>
      </div>

      {/* Verification banner */}
      {!profile?.is_verified && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-500 text-xl mt-0.5">mail</span>
          <div>
            <p className="text-sm font-semibold text-amber-900 font-['Geist']">Verify your email</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Check your inbox and click the link to activate your account and receive 5 starter credits.
            </p>
          </div>
        </div>
      )}

      {/* Pending match requests */}
      {pendingMatches && pendingMatches.length > 0 && (
        <div className="p-4 bg-[#e5eeff] border border-[#c7c4d8] rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#4f46e5] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>notifications</span>
            <p className="text-sm font-medium text-[#3525cd] font-['Geist']">
              You have {pendingMatches.length} incoming match request{pendingMatches.length > 1 ? 's' : ''}
            </p>
          </div>
          <a href="/match" className="text-xs font-semibold text-[#4f46e5] font-['Geist'] hover:underline">
            View →
          </a>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Credit Balance',
            value: profile?.credit_balance ?? 0,
            icon: 'account_balance_wallet',
            color: 'text-[#006e4b]',
            bg: 'bg-[#006e4b]/10',
            suffix: 'credits',
          },
          {
            label: 'Reputation Score',
            value: profile?.reputation_score ?? 50,
            icon: 'star',
            color: 'text-[#4f46e5]',
            bg: 'bg-[#e5eeff]',
            suffix: '/ 100',
          },
          {
            label: 'Sessions',
            value: upcomingSessions?.length ?? 0,
            icon: 'calendar_month',
            color: 'text-[#6b38d4]',
            bg: 'bg-[#e9ddff]',
            suffix: 'upcoming',
          },
          {
            label: 'Pending',
            value: pendingMatches?.length ?? 0,
            icon: 'handshake',
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            suffix: 'requests',
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-[#e5eeff] p-5 card-shadow">
            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
              <span className={`material-symbols-outlined ${stat.color} text-xl`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {stat.icon}
              </span>
            </div>
            <p className="text-xs text-[#464555] mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color} font-['Geist']`}>{stat.value}</p>
            <p className="text-xs text-[#464555] mt-0.5">{stat.suffix}</p>
          </div>
        ))}
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming sessions */}
        <div className="bg-white rounded-2xl border border-[#e5eeff] p-6 card-shadow">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-[#0b1c30] font-['Geist'] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#4f46e5] text-xl">calendar_month</span>
              Upcoming Sessions
            </h2>
            <a href="/sessions" className="text-xs font-semibold text-[#4f46e5] font-['Geist'] hover:underline">View all</a>
          </div>
          {upcomingSessions && upcomingSessions.length > 0 ? (
            <div className="space-y-3">
              {upcomingSessions.map((s: any) => (
                <div key={s.session_id}
                  className="flex items-center justify-between p-3 bg-[#eff4ff] rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-[#0b1c30] font-['Geist']">Session</p>
                    <p className="text-xs text-[#464555] mt-0.5">
                      {new Date(s.scheduled_time).toLocaleDateString('en-GB', {
                        weekday: 'short', day: 'numeric', month: 'short',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium font-['Geist'] ${
                    s.status === 'active' ? 'bg-[#006e4b]/10 text-[#006e4b]' : 'bg-[#e5eeff] text-[#4f46e5]'
                  }`}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-4xl text-[#c7c4d8]">event_available</span>
              <p className="text-sm text-[#464555] mt-2">No upcoming sessions.</p>
              <a href="/match" className="text-sm text-[#4f46e5] font-semibold hover:underline font-['Geist'] mt-1 inline-block">
                Find a match →
              </a>
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <div className="bg-white rounded-2xl border border-[#e5eeff] p-6 card-shadow">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-[#0b1c30] font-['Geist'] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006e4b] text-xl">receipt_long</span>
              Recent Transactions
            </h2>
            <a href="/credits" className="text-xs font-semibold text-[#4f46e5] font-['Geist'] hover:underline">View all</a>
          </div>
          {recentTx && recentTx.length > 0 ? (
            <div className="space-y-3">
              {recentTx.map((tx: any) => (
                <div key={tx.tx_id} className="flex items-center justify-between py-2 border-b border-[#eff4ff] last:border-0">
                  <div>
                    <p className="text-sm text-[#0b1c30] font-['Geist'] font-medium">{tx.description}</p>
                    <p className="text-xs text-[#464555]">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-sm font-bold font-['Geist'] ${tx.amount > 0 ? 'text-[#006e4b]' : 'text-[#ba1a1a]'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-4xl text-[#c7c4d8]">receipt</span>
              <p className="text-sm text-[#464555] mt-2">No transactions yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { href: '/match', icon: 'hub', label: 'Find Match', color: 'bg-[#e5eeff] text-[#4f46e5]' },
          { href: '/sessions', icon: 'calendar_month', label: 'My Sessions', color: 'bg-[#e9ddff] text-[#6b38d4]' },
          { href: '/profile', icon: 'manage_accounts', label: 'Edit Profile', color: 'bg-[#eff4ff] text-[#3525cd]' },
          { href: '/credits', icon: 'account_balance_wallet', label: 'View Ledger', color: 'bg-[#006e4b]/10 text-[#006e4b]' },
        ].map((action) => (
          <a key={action.href} href={action.href}
            className="bg-white rounded-2xl border border-[#e5eeff] p-4 flex items-center gap-3 hover:border-[#4f46e5]/30 hover:shadow-md transition-all card-shadow group">
            <div className={`w-9 h-9 ${action.color} rounded-xl flex items-center justify-center shrink-0`}>
              <span className="material-symbols-outlined text-lg">{action.icon}</span>
            </div>
            <span className="text-sm font-medium text-[#0b1c30] font-['Geist'] group-hover:text-[#4f46e5] transition-colors">
              {action.label}
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}
