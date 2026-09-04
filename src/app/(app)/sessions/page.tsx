import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SessionCard from '@/components/SessionCard'
import BookSessionForm from '@/components/BookSessionForm'

export default async function SessionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sessions } = await supabase
    .from('sessions')
    .select('session_id, scheduled_time, duration_minutes, status, teacher_confirmed, learner_confirmed, teacher_id, learner_id, skill_id')
    .or(`teacher_id.eq.${user.id},learner_id.eq.${user.id}`)
    .order('scheduled_time', { ascending: false })

  const { data: acceptedMatches } = await supabase
    .from('matches')
    .select('match_id, skill_id, requester_id, recipient_id, skills(name, tier), requester:users!matches_requester_id_fkey(full_name), recipient:users!matches_recipient_id_fkey(full_name)')
    .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .eq('status', 'accepted')

  const upcoming = sessions?.filter((s) =>
    ['scheduled', 'active'].includes(s.status)
  ) ?? []
  const past = sessions?.filter((s) =>
    ['completed', 'cancelled', 'ghosted', 'disputed'].includes(s.status)
  ) ?? []

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
      </div>

      {acceptedMatches && acceptedMatches.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            Book a Session
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            You have {acceptedMatches.length} accepted match
            {acceptedMatches.length > 1 ? 'es' : ''}. Book a session to start
            exchanging skills.
          </p>
          <BookSessionForm
            matches={acceptedMatches as any}
            currentUserId={user.id}
          />
        </div>
      )}

      <div className="space-y-4">
        <h2 className="font-semibold text-gray-900">
          Upcoming Sessions ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-400">
            No upcoming sessions.{' '}
            <Link href="/match" className="text-indigo-600 hover:underline">
              Find a match first
            </Link>
          </p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((s) => (
              <SessionCard
                key={s.session_id}
                session={s as any}
                currentUserId={user.id}
              />
            ))}
          </div>
        )}
      </div>

      {past.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900">
            Past Sessions ({past.length})
          </h2>
          <div className="space-y-3">
            {past.map((s) => (
              <SessionCard
                key={s.session_id}
                session={s as any}
                currentUserId={user.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
