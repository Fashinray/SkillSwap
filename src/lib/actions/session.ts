'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

const ESCROW_DEPOSIT_PER_CREDIT = 1

export async function bookSession(formData: FormData) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const matchId = formData.get('matchId') as string
  const skillId = formData.get('skillId') as string
  const scheduledTime = formData.get('scheduledTime') as string
  const durationMinutes = parseInt(formData.get('durationMinutes') as string) || 60
  const role = formData.get('role') as 'teacher' | 'learner'

  // Get the match to find the other party
  const { data: match } = await supabase
    .from('matches')
    .select('match_id, requester_id, recipient_id, skill_id, status')
    .eq('match_id', matchId)
    .single()

  if (!match || match.status !== 'accepted') {
    return { error: 'Match not found or not accepted.' }
  }

  const teacherId = role === 'teacher' ? user.id : (
    match.requester_id === user.id ? match.recipient_id : match.requester_id
  )
  const learnerId = role === 'learner' ? user.id : (
    match.requester_id === user.id ? match.recipient_id : match.requester_id
  )

  // Get skill tier to calculate deposit
  const { data: skill } = await admin
    .from('skills')
    .select('tier')
    .eq('skill_id', skillId)
    .single()

  const creditsPerHour = skill?.tier === 'advanced' ? 3 : skill?.tier === 'intermediate' ? 2 : 1
  const depositAmount = Math.ceil(durationMinutes / 60) * creditsPerHour * ESCROW_DEPOSIT_PER_CREDIT

  // Check if this user's first session (escrow-free)
  const { data: userRecord } = await admin
    .from('users')
    .select('credit_balance, escrow_free_sessions_used')
    .eq('user_id', user.id)
    .single()

  const escrowFreeLimit = 1
  const isEscrowFree = (userRecord?.escrow_free_sessions_used ?? 0) < escrowFreeLimit

  const chatRoomId = `session_${crypto.randomUUID()}`

  // Create the session
  const { data: session, error: sessionError } = await admin
    .from('sessions')
    .insert({
      teacher_id: teacherId,
      learner_id: learnerId,
      skill_id: skillId,
      scheduled_time: scheduledTime,
      duration_minutes: durationMinutes,
      status: 'scheduled',
      chat_room_id: chatRoomId,
    })
    .select()
    .single()

  if (sessionError || !session) {
    return { error: sessionError?.message ?? 'Failed to create session' }
  }

  if (isEscrowFree) {
    // Create a pending escrow record with 0 deposit
    await admin.from('escrow_records').insert({
      session_id: session.session_id,
      teacher_deposit: 0,
      learner_deposit: 0,
      status: 'pending',
    })
    // Mark session used
    await admin.from('users').update({
      escrow_free_sessions_used: (userRecord?.escrow_free_sessions_used ?? 0) + 1
    }).eq('user_id', user.id)
  } else {
    // Activate escrow — atomic Postgres function
    const { error: escrowError } = await admin.rpc('activate_escrow', {
      p_session_id: session.session_id,
      p_teacher_id: teacherId,
      p_learner_id: learnerId,
      p_deposit_amount: depositAmount,
    })
    if (escrowError) {
      // Roll back: delete the session
      await admin.from('sessions').delete().eq('session_id', session.session_id)
      return { error: escrowError.message }
    }
  }

  revalidatePath('/sessions')
  revalidatePath('/dashboard')
  return { success: true, sessionId: session.session_id }
}

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024 // 15MB

export async function uploadSessionFile(sessionId: string, formData: FormData) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: session } = await admin
    .from('sessions')
    .select('session_id, teacher_id, learner_id')
    .eq('session_id', sessionId)
    .single()

  if (!session || (session.teacher_id !== user.id && session.learner_id !== user.id)) {
    return { error: 'You are not a participant in this session' }
  }

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) return { error: 'No file provided' }
  if (file.size > MAX_FILE_SIZE_BYTES) return { error: 'File is too large (max 15MB)' }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${sessionId}/${crypto.randomUUID()}-${safeName}`

  const { error: uploadError } = await admin.storage
    .from('session-files')
    .upload(path, file, { contentType: file.type || 'application/octet-stream' })

  if (uploadError) return { error: uploadError.message }

  const { data: signedUrlData, error: signedUrlError } = await admin.storage
    .from('session-files')
    .createSignedUrl(path, 60 * 60 * 24 * 7) // 7 days

  if (signedUrlError || !signedUrlData) {
    return { error: signedUrlError?.message ?? 'Failed to create file link' }
  }

  const { error: insertError } = await admin.from('chat_messages').insert({
    session_id: sessionId,
    sender_id: user.id,
    file_url: signedUrlData.signedUrl,
    file_name: file.name,
    file_type: file.type || null,
  })

  if (insertError) return { error: insertError.message }

  return { success: true }
}

export async function confirmCompletion(sessionId: string) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await admin.rpc('confirm_session_completion', {
    p_session_id: sessionId,
    p_user_id: user.id,
  })

  if (error) return { error: error.message }

  revalidatePath('/sessions')
  revalidatePath('/credits')
  revalidatePath('/dashboard')
  return { success: true, result: data }
}

export async function cancelSession(sessionId: string) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await admin.rpc('cancel_session', {
    p_session_id: sessionId,
    p_cancelled_by: user.id,
  })

  if (error) return { error: error.message }

  revalidatePath('/sessions')
  revalidatePath('/dashboard')
  return { success: true, result: data }
}

export async function fileDispute(sessionId: string, reason: string) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await admin.rpc('escalate_dispute', {
    p_session_id: sessionId,
    p_filer_id: user.id,
    p_reason: reason,
  })

  if (error) return { error: error.message }

  revalidatePath('/sessions')
  return { success: true }
}

export async function runGhostSweep() {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('ghost_sweep')
  if (error) return { error: error.message }
  return { success: true, ghostsProcessed: data }
}
