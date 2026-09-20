import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import SuperAdminSettingsClient from '@/components/SuperAdminSettingsClient'

export default async function SuperAdminSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/dashboard')

  const admin = createAdminClient()
  const { data: settings } = await admin
    .from('platform_settings')
    .select('key, value, description')
    .order('key')

  return <SuperAdminSettingsClient settings={(settings ?? []) as any} />
}
