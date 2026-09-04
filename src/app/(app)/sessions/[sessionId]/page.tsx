import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import SessionRoom from '@/components/SessionRoom'

export default async function SessionRoomPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: session } = await supabase
    .from('sessions')
    .select('session_id, teacher_id, learner_id, skill_id, scheduled_time, duration_minutes, status, chat_room_id, teacher_confirmed, learner_confirmed')
    .eq('session_id', sessionId)
    .single()

  if (!session) redirect('/sessions')

  const isParticipant =
    session.teacher_id === user.id || session.learner_id === user.id
  if (!isParticipant) redirect('/sessions')

  // Mark session as active when a participant enters the room
  if (session.status === 'scheduled') {
    const admin = createAdminClient()
    await admin
      .from('sessions')
      .update({ status: 'active' })
      .eq('session_id', sessionId)
      .in('status', ['scheduled'])
    // Update local session object
    session.status = 'active'
  }

  const { data: otherUser } = await supabase
    .from('users')
    .select('full_name, reputation_score, is_trusted')
    .eq('user_id', session.teacher_id === user.id ? session.learner_id : session.teacher_id)
    .single()

  const { data: skill } = await supabase
    .from('skills')
    .select('name, tier')
    .eq('skill_id', session.skill_id)
    .single()

  const { data: existingMessages } = await supabase
    .from('chat_messages')
    .select('msg_id, sender_id, content, file_url, file_name, created_at')
    .eq('session_id', session.session_id)
    .order('created_at', { ascending: true })

  return (
    <SessionRoom
      session={session as any}
      currentUserId={user.id}
      otherUser={otherUser as any}
      skill={skill as any}
      initialMessages={(existingMessages ?? []) as any}
    />
  )
}
