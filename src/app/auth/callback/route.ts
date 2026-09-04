import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { grantStarterCredits } from '@/lib/actions/auth'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const result = await grantStarterCredits(data.user.id)
      console.log('auth/callback: grantStarterCredits result', result)
      return NextResponse.redirect(`${origin}/dashboard`)
    }

    console.error('auth/callback: exchangeCodeForSession failed', error)
  } else {
    console.error('auth/callback: no code param on request', request.url)
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
