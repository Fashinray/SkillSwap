import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MatchBrowser from '@/components/MatchBrowser'
import IncomingRequests from '@/components/IncomingRequests'
import { getIncomingRequests } from '@/lib/actions/match'

export default async function MatchPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: mySkills } = await supabase
    .from('user_skills')
    .select('user_skill_id, role, skill_id, skills(skill_id, name, tier)')
    .eq('user_id', user.id)

  const incomingRequests = await getIncomingRequests()
  const hasTeachSkills = mySkills?.some((s) => s.role === 'teach') ?? false
  const hasLearnSkills = mySkills?.some((s) => s.role === 'learn') ?? false

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find a Match</h1>
        <p className="mt-1 text-sm text-gray-500">
          Discover students you can exchange skills with. Your compatibility
          score is based on skill overlap, reputation, and availability.
        </p>
      </div>

      {(!hasTeachSkills || !hasLearnSkills) && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          Add at least one skill you can teach and one you want to learn in your{' '}
          <a href="/profile" className="underline font-medium">profile</a>{' '}
          to get meaningful match scores.
        </div>
      )}

      {incomingRequests.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            Incoming Requests ({incomingRequests.length})
          </h2>
          <IncomingRequests requests={incomingRequests as any[]} />
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Compatible Students</h2>
        <MatchBrowser mySkills={(mySkills ?? []) as any[]} />
      </div>
    </div>
  )
}
