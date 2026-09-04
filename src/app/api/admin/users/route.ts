import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('users').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { userId, action } = await request.json()
  const adminClient = createAdminClient()

  if (action === 'suspend') {
    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      ban_duration: '876600h',
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'unsuspend') {
    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      ban_duration: 'none',
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
