import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('users').select('role').eq('user_id', user.id).single()
  if (!['admin', 'super_admin'].includes(profile?.role ?? '')) return null
  return user
}

export async function PATCH(request: Request) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { disputeId, sessionId, decision, notes } = await request.json()
  const admin = createAdminClient()

  const { error: disputeError } = await admin
    .from('disputes')
    .update({
      status: 'resolved',
      decision,
      decision_notes: notes || null,
      admin_id: adminUser.id,
      resolved_at: new Date().toISOString(),
    })
    .eq('dispute_id', disputeId)

  if (disputeError) {
    return NextResponse.json({ error: disputeError.message }, { status: 500 })
  }

  // Release the disputed escrow
  const { error: escrowError } = await admin
    .from('escrow_records')
    .update({
      status: 'released',
      resolved_by: `admin:${adminUser.id}`,
      resolved_at: new Date().toISOString(),
    })
    .eq('session_id', sessionId)
    .eq('status', 'disputed')

  if (escrowError) {
    return NextResponse.json({ error: escrowError.message }, { status: 500 })
  }

  await admin
    .from('sessions')
    .update({ status: 'completed' })
    .eq('session_id', sessionId)

  return NextResponse.json({ success: true })
}
