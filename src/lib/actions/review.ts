'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function submitReview(formData: FormData) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const sessionId = formData.get('sessionId') as string
  const rateeId = formData.get('rateeId') as string
  const teachingQuality = parseInt(formData.get('teachingQuality') as string)
  const punctuality = parseInt(formData.get('punctuality') as string)
  const communication = parseInt(formData.get('communication') as string)
  const overallExperience = parseInt(formData.get('overallExperience') as string)
  const comment = formData.get('comment') as string

  // Validate all scores are 1-5
  const scores = [teachingQuality, punctuality, communication, overallExperience]
  if (scores.some((s) => isNaN(s) || s < 1 || s > 5)) {
    return { error: 'All ratings must be between 1 and 5.' }
  }

  // Verify the session is completed and user is a participant
  const { data: session } = await supabase
    .from('sessions')
    .select('session_id, teacher_id, learner_id, status, skill_id')
    .eq('session_id', sessionId)
    .single()

  if (!session) return { error: 'Session not found.' }
  if (session.status !== 'completed') return { error: 'Session must be completed before reviewing.' }

  const isParticipant = session.teacher_id === user.id || session.learner_id === user.id
  if (!isParticipant) return { error: 'You are not a participant in this session.' }

  // Check for existing review
  const { data: existing } = await supabase
    .from('reviews')
    .select('review_id')
    .eq('session_id', sessionId)
    .eq('rater_id', user.id)
    .maybeSingle()

  if (existing) return { error: 'You have already submitted a review for this session.' }

  // Insert review
  const { error: reviewError } = await supabase.from('reviews').insert({
    session_id: sessionId,
    rater_id: user.id,
    ratee_id: rateeId,
    teaching_quality: teachingQuality,
    punctuality: punctuality,
    communication: communication,
    overall_experience: overallExperience,
    comment: comment || null,
  })

  if (reviewError) return { error: reviewError.message }

  // Recompute reputation for the ratee using admin client
  await updateReputationFromReview(rateeId, sessionId, admin)

  // Recompute trusted status
  await admin.rpc('recompute_trusted_status', { p_user_id: rateeId })

  revalidatePath('/sessions')
  revalidatePath(`/profile/${rateeId}`)
  return { success: true }
}

async function updateReputationFromReview(
  userId: string,
  sessionId: string,
  admin: ReturnType<typeof createAdminClient>
) {
  // Get all reviews for this user as ratee
  const { data: reviews } = await admin
    .from('reviews')
    .select('teaching_quality, punctuality, communication, overall_experience')
    .eq('ratee_id', userId)

  if (!reviews || reviews.length === 0) return

  // Calculate peer rating component: average of all dimension averages, normalised to 0-100
  const peerScores = reviews.map((r) => {
    const avg = (r.teaching_quality + r.punctuality + r.communication + r.overall_experience) / 4
    return avg * 20 // normalise 1-5 to 0-100
  })
  const peerComponent = peerScores.reduce((a, b) => a + b, 0) / peerScores.length

  // Check if AI evaluation exists for this session
  const { data: aiEval } = await admin
    .from('ai_evaluations')
    .select('overall_score, status')
    .eq('session_id', sessionId)
    .eq('status', 'scored')
    .maybeSingle()

  let newReputation: number
  if (aiEval && aiEval.overall_score !== null) {
    // Full formula: 0.7 x Peer + 0.3 x AI
    newReputation = Math.round(0.7 * peerComponent + 0.3 * aiEval.overall_score)
  } else {
    // Peer only when no AI evaluation
    newReputation = Math.round(peerComponent)
  }

  // Clamp to 0-100
  newReputation = Math.max(0, Math.min(100, newReputation))

  await admin
    .from('users')
    .update({ reputation_score: newReputation })
    .eq('user_id', userId)
}

export async function getSessionReviews(sessionId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('reviews')
    .select('review_id, rater_id, teaching_quality, punctuality, communication, overall_experience, comment, created_at')
    .eq('session_id', sessionId)
  return data ?? []
}
