import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

async function requireAdminOrSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('users').select('role').eq('user_id', user.id).single()
  if (!['admin', 'super_admin'].includes(profile?.role ?? '')) return null
  return user
}

export async function PATCH(request: Request) {
  const adminUser = await requireAdminOrSuperAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { userSkillId, score } = await request.json()
  if (!score || score < 1 || score > 5) {
    return NextResponse.json({ error: 'Score must be 1 to 5' }, { status: 400 })
  }

  const label = score <= 2 ? 'Beginner' : score <= 4 ? 'Intermediate' : 'Expert'
  const admin = createAdminClient()
  const { error } = await admin
    .from('user_skills')
    .update({ admin_score: score, proficiency_label: label })
    .eq('user_skill_id', userSkillId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, label })
}
