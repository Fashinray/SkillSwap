import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import SuperAdminEscrowClient from '@/components/SuperAdminEscrowClient'

export default async function SuperAdminEscrowPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/dashboard')

  const admin = createAdminClient()
  const { data: escrow } = await admin
    .from('escrow_records')
    .select('escrow_id, session_id, teacher_deposit, learner_deposit, status, created_at')
    .in('status', ['locked', 'disputed'])
    .order('created_at', { ascending: false })

  return <SuperAdminEscrowClient escrowRecords={(escrow ?? []) as any} />
}
