import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import SuperAdminDisputesClient from '@/components/SuperAdminDisputesClient'

export default async function SuperAdminDisputesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/dashboard')

  const admin = createAdminClient()
  const { data: disputes } = await admin
    .from('disputes')
    .select('dispute_id, reason, status, created_at, session_id, filer_id, decision, decision_notes')
    .in('status', ['open', 'under_review'])
    .order('created_at', { ascending: false })

  return <SuperAdminDisputesClient disputes={(disputes ?? []) as any} />
}
