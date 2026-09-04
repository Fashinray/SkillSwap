import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const email = process.argv[2]
  const password = process.argv[3]

  if (!email || !password) {
    console.error('Usage: npx tsx scripts/create-admin.ts <email> <password>')
    process.exit(1)
  }

  console.log(`Creating admin account for ${email}...`)

  // Create auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Admin' },
  })

  if (authError) {
    // User might already exist — try to find them
    const { data: existingUsers } = await admin.auth.admin.listUsers()
    const existing = existingUsers?.users?.find((u) => u.email === email)
    if (!existing) {
      console.error('Error creating user:', authError.message)
      process.exit(1)
    }
    console.log('User already exists, promoting to admin...')
    await admin.from('users').update({ role: 'admin' }).eq('user_id', existing.id)
    console.log(`Done. ${email} is now an admin.`)
    return
  }

  const userId = authData.user.id
  await new Promise((r) => setTimeout(r, 1000))

  // Set role to admin
  await admin.from('users').update({
    role: 'admin',
    is_verified: true,
    credit_balance: 50,
    reputation_score: 50,
  }).eq('user_id', userId)

  await admin.from('transactions').insert({
    user_id: userId,
    type: 'credit_grant',
    amount: 50,
    balance_after: 50,
    description: 'Admin account starter credits',
  })

  console.log(`Done. Admin account created: ${email}`)
  console.log(`Password: ${password}`)
  console.log(`Login at http://localhost:3000/login`)
}

main().catch(console.error)
