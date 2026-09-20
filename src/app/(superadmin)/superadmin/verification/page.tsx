import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import SuperAdminVerificationClient from '@/components/SuperAdminVerificationClient'

export default async function VerificationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/dashboard')

  const admin = createAdminClient()

  const { data: pendingUsers } = await admin
    .from('users')
    .select(`
      user_id, full_name, email, verification_status,
      linkedin_url, github_url, portfolio_url, created_at,
      user_skills (
        user_skill_id, role, admin_score, proficiency_label,
        skills ( name, tier, category )
      )
    `)
    .in('verification_status', ['pending', 'under_review'])
    .order('created_at', { ascending: true })

  const pendingFiltered = (pendingUsers ?? []).map((u: any) => ({
    ...u,
    teach_skills: (u.user_skills ?? []).filter((s: any) => s.role === 'teach'),
  }))

  return <SuperAdminVerificationClient pendingUsers={pendingFiltered} />
}
