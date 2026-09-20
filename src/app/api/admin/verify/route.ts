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

  const { userId, decision, rejectionReason } = await request.json()
  const admin = createAdminClient()

  const { error } = await admin.from('users').update({
    verification_status: decision,
    admin_verified: decision === 'verified',
    admin_verified_at: new Date().toISOString(),
    admin_verified_by: adminUser.id,
    rejection_reason: rejectionReason || null,
  }).eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Grant starter credits on first verification
  if (decision === 'verified') {
    const { data: userData } = await admin
      .from('users')
      .select('credit_balance, is_verified')
      .eq('user_id', userId)
      .single()

    if (userData && !userData.is_verified) {
      const newBalance = (userData.credit_balance ?? 0) + 5
      await admin.from('users').update({
        is_verified: true,
        credit_balance: newBalance,
      }).eq('user_id', userId)

      await admin.from('transactions').insert({
        user_id: userId,
        type: 'credit_grant',
        amount: 5,
        balance_after: newBalance,
        description: 'Starter credits granted on admin verification',
      })
    }
  }

  return NextResponse.json({ success: true })
}
