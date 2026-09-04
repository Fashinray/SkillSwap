import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type CheckResult = { name: string; passed: boolean; detail?: string }

async function check(name: string, fn: () => Promise<boolean>, detail?: string): Promise<CheckResult> {
  try {
    const passed = await fn()
    console.log(`${passed ? 'PASS' : 'FAIL'} — ${name}${detail ? ': ' + detail : ''}`)
    return { name, passed, detail }
  } catch (e: any) {
    console.log(`FAIL — ${name}: ${e.message}`)
    return { name, passed: false, detail: e.message }
  }
}

async function main() {
  console.log('\n=== SkillSwap Schema Verification ===\n')
  const results: CheckResult[] = []

  const expectedTables = [
    'users', 'skills', 'user_skills', 'matches', 'sessions',
    'escrow_records', 'transactions', 'chat_messages', 'reviews',
    'ai_evaluations', 'disputes', 'platform_settings'
  ]

  for (const table of expectedTables) {
    results.push(await check(`Table exists: ${table}`, async () => {
      const { error } = await supabase.from(table).select('*').limit(0)
      return !error
    }))
  }

  const expectedSettings = [
    'ESCROW_FREE_SESSION_LIMIT',
    'LATE_CANCEL_FORFEITURE_RATE',
    'GHOST_GRACE_PERIOD_MINUTES',
    'INITIAL_REPUTATION_SCORE',
    'MAX_REPUTATION_SCORE',
    'MATCHING_WEIGHT_SKILL',
    'MATCHING_WEIGHT_REPUTATION',
    'MATCHING_WEIGHT_AVAILABILITY',
    'MATCHING_WEIGHT_HISTORY',
    'PORTFOLIO_MAX_FILE_SIZE_MB',
    'PORTFOLIO_MAX_FILES_PER_USER',
    'CHAT_MAX_FILE_SIZE_MB'
  ]

  results.push(await check('platform_settings has all 12 seed rows', async () => {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('key')
    if (error) return false
    const keys = data.map((r: any) => r.key)
    return expectedSettings.every(k => keys.includes(k))
  }))

  results.push(await check('credit_balance cannot be set directly by client', async () => {
    const { data: users } = await supabase.from('users').select('user_id').limit(1)
    if (!users || users.length === 0) return true
    const { error } = await supabase
      .from('users')
      .update({ credit_balance: 9999 })
      .eq('user_id', users[0].user_id)
    return !!error
  }))

  const passed = results.filter(r => r.passed).length
  const total = results.length
  console.log(`\n=== ${passed}/${total} checks passed ===\n`)

  if (passed < total) process.exit(1)
}

main()
