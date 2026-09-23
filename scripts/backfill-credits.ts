import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local', quiet: true })

import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const STARTER_CREDITS = 5

async function main() {
  const { data: candidates, error: candidatesError } = await admin
    .from('users')
    .select('user_id, email, credit_balance')
    .eq('admin_verified', true)
    .eq('credit_balance', 0)

  if (candidatesError) {
    console.error('Failed to query candidate users:', candidatesError.message)
    process.exit(1)
  }

  if (!candidates || candidates.length === 0) {
    console.log('No admin-verified, zero-balance users found. Nothing to do.')
    return
  }

  // Supabase's fluent query builder has no NOT EXISTS (subquery) support,
  // so this is done as two queries + a JS filter rather than one — same
  // result as the spec's NOT EXISTS clause.
  const { data: grants, error: grantsError } = await admin
    .from('transactions')
    .select('user_id')
    .eq('type', 'credit_grant')
    .in('user_id', candidates.map((c) => c.user_id))

  if (grantsError) {
    console.error('Failed to query existing credit_grant transactions:', grantsError.message)
    process.exit(1)
  }

  const alreadyGranted = new Set((grants ?? []).map((g) => g.user_id))
  const affected = candidates.filter((c) => !alreadyGranted.has(c.user_id))

  let count = 0
  for (const u of affected) {
    // Same operation as api/admin/verify/route.ts's credit-grant branch —
    // not the approval action itself (untouched, per the spec's
    // instruction not to change super admin approval logic).
    const newBalance = (u.credit_balance ?? 0) + STARTER_CREDITS

    const { error: updateError } = await admin
      .from('users')
      .update({ credit_balance: newBalance })
      .eq('user_id', u.user_id)

    if (updateError) {
      console.error(`Failed to update balance for ${u.email}:`, updateError.message)
      continue
    }

    const { error: txError } = await admin.from('transactions').insert({
      user_id: u.user_id,
      type: 'credit_grant',
      amount: STARTER_CREDITS,
      balance_after: newBalance,
      description: 'Starter credits granted on admin verification (backfill)',
    })

    if (txError) {
      console.error(`Failed to record transaction for ${u.email}:`, txError.message)
      continue
    }

    console.log(`Granted 5 credits to ${u.email}`)
    count++
  }

  console.log(`\nTotal users granted starter credits: ${count}`)
}

main().catch(console.error)
