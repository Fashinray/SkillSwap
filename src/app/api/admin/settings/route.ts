import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

async function requireSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('users').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'super_admin') return null
  return user
}

export async function PATCH(request: Request) {
  const adminUser = await requireSuperAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Super admin only' }, { status: 403 })

  const { key, value } = await request.json()
  const admin = createAdminClient()

  const { error } = await admin
    .from('platform_settings')
    .update({ value })
    .eq('key', key)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
