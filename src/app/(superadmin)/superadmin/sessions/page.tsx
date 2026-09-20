import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import SuperAdminSessionsClient from '@/components/SuperAdminSessionsClient'

export default async function SuperAdminSessionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/dashboard')

  const admin = createAdminClient()
  const { data: sessions } = await admin
    .from('sessions')
    .select('session_id, status, scheduled_time, teacher_id, learner_id, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  return <SuperAdminSessionsClient sessions={(sessions ?? []) as any} />
}
