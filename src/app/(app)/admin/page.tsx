import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import AdminDashboard from '@/components/AdminDashboard'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const admin = createAdminClient()

  // Platform analytics
  const { count: totalUsers } = await admin
    .from('users')
    .select('*', { count: 'exact', head: true })

  const { count: totalSessions } = await admin
    .from('sessions')
    .select('*', { count: 'exact', head: true })

  const { count: completedSessions } = await admin
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')

  const { count: openDisputes } = await admin
    .from('disputes')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open')

  const { count: ghostedSessions } = await admin
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ghosted')

  // Recent users
  const { data: recentUsers } = await admin
    .from('users')
    .select('user_id, full_name, email, role, credit_balance, reputation_score, is_verified, is_trusted, created_at')
    .order('created_at', { ascending: false })
    .limit(20)

  // Open disputes
  const { data: disputes } = await admin
    .from('disputes')
    .select('dispute_id, reason, status, created_at, session_id, filer_id, decision, decision_notes')
    .in('status', ['open', 'under_review'])
    .order('created_at', { ascending: false })

  // Locked escrow records
  const { data: lockedEscrow } = await admin
    .from('escrow_records')
    .select('escrow_id, session_id, teacher_deposit, learner_deposit, status, created_at')
    .in('status', ['locked', 'disputed'])
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <AdminDashboard
      analytics={{
        totalUsers: totalUsers ?? 0,
        totalSessions: totalSessions ?? 0,
        completedSessions: completedSessions ?? 0,
        openDisputes: openDisputes ?? 0,
        ghostedSessions: ghostedSessions ?? 0,
        completionRate: totalSessions
          ? Math.round(((completedSessions ?? 0) / totalSessions) * 100)
          : 0,
      }}
      users={(recentUsers ?? []) as any}
      disputes={(disputes ?? []) as any}
      lockedEscrow={(lockedEscrow ?? []) as any}
    />
  )
}
