'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { isValidRegistrationEmail } from '@/lib/config/features'

export async function signUp(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  if (!isValidRegistrationEmail(email)) {
    return {
      error: 'Registration is restricted to OAU students. Please use your @oauife.edu.ng email address.',
    }
  }

  // Emails whose account was previously deleted (e.g. by an admin) are
  // permanently blocked from re-registering, so starter credits can't be
  // re-claimed by deleting and recreating an account. The database trigger
  // enforces this regardless of entry point; this check just gives a clear
  // message instead of a generic Postgres error surfacing through signUp.
  const admin = createAdminClient()
  const { data: blocked } = await admin
    .from('deleted_accounts')
    .select('email')
    .eq('email', email)
    .maybeSingle()

  if (blocked) {
    return { error: 'This email address was previously removed and cannot be re-registered. Contact an admin if you believe this is a mistake.' }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    // Full dump: AuthError's own fields don't always show up via plain
    // string interpolation (e.g. `code` on newer supabase-js, or a nested
    // `cause`), so log every own property plus the raw object.
    console.error(
      '[signUp] Supabase auth.signUp failed for', email, '\n',
      JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
      '\nraw error object:', error,
    )
    // AuthRetryableFetchError (5xx from the Auth server, e.g. the email
    // provider failing or its send-rate limit being hit) carries a
    // non-descriptive message like "{}" that must not reach the UI as-is.
    if (error.name === 'AuthRetryableFetchError' || !error.message || error.message === '{}') {
      return { error: 'Registration is temporarily unavailable (email service error). Please try again in a few minutes.' }
    }
    return { error: error.message }
  }

  return { success: true, message: 'Check your email to confirm your account.' }
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function grantStarterCredits(userId: string) {
  const admin = createAdminClient()

  // Wait briefly for the auth trigger to create the public.users row
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const { data: user, error: fetchError } = await admin
    .from('users')
    .select('credit_balance, is_verified')
    .eq('user_id', userId)
    .single()

  if (fetchError || !user) {
    console.error('grantStarterCredits: user not found', fetchError)
    return { error: 'User not found' }
  }

  // Idempotent: if already verified do not grant again
  if (user.is_verified) {
    console.log('grantStarterCredits: already granted, skipping')
    return { alreadyGranted: true }
  }

  const STARTER_CREDITS = 5
  const newBalance = user.credit_balance + STARTER_CREDITS

  const { error: updateError } = await admin
    .from('users')
    .update({
      is_verified: true,
      credit_balance: newBalance,
    })
    .eq('user_id', userId)

  if (updateError) {
    console.error('grantStarterCredits: update failed', updateError)
    return { error: updateError.message }
  }

  const { error: txError } = await admin.from('transactions').insert({
    user_id: userId,
    type: 'credit_grant',
    amount: STARTER_CREDITS,
    balance_after: newBalance,
    description: 'Starter credits granted on email verification',
  })

  if (txError) {
    console.error('grantStarterCredits: transaction insert failed', txError)
    return { error: txError.message }
  }

  console.log('grantStarterCredits: success, granted', STARTER_CREDITS)
  return { success: true, credits: STARTER_CREDITS }
}
