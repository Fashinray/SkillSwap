import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import SuperAdminUsersClient from '@/components/SuperAdminUsersClient'

export default async function SuperAdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/dashboard')

  const admin = createAdminClient()
  const { data: users } = await admin
    .from('users')
    .select('user_id, full_name, email, role, credit_balance, reputation_score, is_verified, admin_verified, is_trusted, verification_status, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  return <SuperAdminUsersClient users={(users ?? []) as any} />
}
