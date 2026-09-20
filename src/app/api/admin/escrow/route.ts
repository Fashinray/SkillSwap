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

  const { escrowId, sessionId, action } = await request.json()
  const admin = createAdminClient()

  if (action === 'release') {
    const { data: escrow } = await admin
      .from('escrow_records')
      .select('teacher_deposit, learner_deposit, session_id')
      .eq('escrow_id', escrowId)
      .single()

    if (!escrow) {
      return NextResponse.json({ error: 'Escrow not found' }, { status: 404 })
    }

    const { data: session } = await admin
      .from('sessions')
      .select('teacher_id, learner_id')
      .eq('session_id', sessionId)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Return deposits to both parties
    const { data: teacher } = await admin
      .from('users').select('credit_balance').eq('user_id', session.teacher_id).single()
    const { data: learner } = await admin
      .from('users').select('credit_balance').eq('user_id', session.learner_id).single()

    await admin.from('users')
      .update({ credit_balance: (teacher?.credit_balance ?? 0) + escrow.teacher_deposit })
      .eq('user_id', session.teacher_id)

    await admin.from('transactions').insert({
      user_id: session.teacher_id, type: 'escrow_release',
      amount: escrow.teacher_deposit,
      balance_after: (teacher?.credit_balance ?? 0) + escrow.teacher_deposit,
      session_id: sessionId, escrow_id: escrowId,
      description: 'Escrow released by admin',
    })

    await admin.from('users')
      .update({ credit_balance: (learner?.credit_balance ?? 0) + escrow.learner_deposit })
      .eq('user_id', session.learner_id)

    await admin.from('transactions').insert({
      user_id: session.learner_id, type: 'escrow_release',
      amount: escrow.learner_deposit,
      balance_after: (learner?.credit_balance ?? 0) + escrow.learner_deposit,
      session_id: sessionId, escrow_id: escrowId,
      description: 'Escrow released by admin',
    })

    await admin.from('escrow_records').update({
      status: 'released',
      resolved_by: `admin:${adminUser.id}`,
      resolved_at: new Date().toISOString(),
    }).eq('escrow_id', escrowId)

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
