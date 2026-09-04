import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const userId = process.argv[2]
  const newPassword = process.argv[3]

  if (!userId || !newPassword) {
    console.error('Usage: npx tsx scripts/reset-password.ts <user_id> <new_password>')
    process.exit(1)
  }

  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: newPassword,
  })

  if (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }

  console.log('Password updated successfully.')
  console.log('You can now log in with the new password.')
}

main().catch(console.error)
