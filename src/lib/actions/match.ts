'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function sendMatchRequest(recipientId: string, skillId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: existing } = await supabase
    .from('matches')
    .select('match_id, status')
    .or(
      `and(requester_id.eq.${user.id},recipient_id.eq.${recipientId}),and(requester_id.eq.${recipientId},recipient_id.eq.${user.id})`
    )
    .maybeSingle()

  if (existing && existing.status === 'pending') {
    return { error: 'A match request already exists between you and this user.' }
  }

  const { error } = await supabase.from('matches').insert({
    requester_id: user.id,
    recipient_id: recipientId,
    skill_id: skillId,
    status: 'pending',
  })

  if (error) return { error: error.message }
  revalidatePath('/match')
  return { success: true }
}

export async function respondToMatchRequest(
  matchId: string,
  response: 'accepted' | 'rejected'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: match } = await supabase
    .from('matches')
    .select('match_id, requester_id, recipient_id, skill_id, status')
    .eq('match_id', matchId)
    .eq('recipient_id', user.id)
    .single()

  if (!match) return { error: 'Match request not found.' }
  if (match.status !== 'pending') return { error: 'This request has already been resolved.' }

  const { error } = await supabase
    .from('matches')
    .update({ status: response })
    .eq('match_id', matchId)

  if (error) return { error: error.message }
  revalidatePath('/match')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function getIncomingRequests() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('matches')
    .select('match_id, created_at, status, skill_id, requester_id, skills(name, tier), requester:users!matches_requester_id_fkey(full_name, reputation_score)')
    .eq('recipient_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  return data ?? []
}
