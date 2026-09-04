import { createClient } from '@/lib/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { grantStarterCredits } from '@/lib/actions/auth'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  if (token_hash && type) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash })

    if (!error && data.user) {
      const result = await grantStarterCredits(data.user.id)
      console.log('auth/confirm: grantStarterCredits result', result)
      return NextResponse.redirect(`${origin}/dashboard`)
    }

    console.error('auth/confirm: verifyOtp failed', error)
  } else {
    console.error('auth/confirm: missing token_hash or type on request', request.url)
  }

  return NextResponse.redirect(`${origin}/login?error=confirm_failed`)
}
