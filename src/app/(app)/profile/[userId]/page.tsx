import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // If viewing own profile redirect to /profile
  if (userId === user.id) redirect('/profile')

  const { data: profile } = await supabase
    .from('users')
    .select('user_id, full_name, bio, reputation_score, is_trusted, completed_sessions_count, created_at')
    .eq('user_id', userId)
    .single()

  if (!profile) redirect('/match')

  const { data: teachSkills } = await supabase
    .from('user_skills')
    .select('user_skill_id, proficiency, skills(name, tier, category)')
    .eq('user_id', userId)
    .eq('role', 'teach')

  const { data: learnSkills } = await supabase
    .from('user_skills')
    .select('user_skill_id, skills(name, tier, category)')
    .eq('user_id', userId)
    .eq('role', 'learn')

  const { data: ghostData } = await supabase
    .from('sessions')
    .select('session_id')
    .eq('status', 'ghosted')
    .or(`teacher_id.eq.${userId},learner_id.eq.${userId}`)

  const ghostCount = ghostData?.length ?? 0

  const { data: aiEvaluations } = await supabase
    .from('ai_evaluations')
    .select('overall_score, teaching_clarity, content_coverage, engagement_quality, responsiveness, status')
    .eq('status', 'scored')
    .in('session_id',
      (await supabase
        .from('sessions')
        .select('session_id')
        .eq('teacher_id', userId)
        .eq('status', 'completed')
      ).data?.map((s: any) => s.session_id) ?? []
    )

  const tierColors: Record<string, string> = {
    basic: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {profile.full_name}
              </h1>
              {profile.is_trusted && (
                <span className="text-sm px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                  ✓ Trusted
                </span>
              )}
            </div>
            {profile.bio && (
              <p className="mt-2 text-gray-600 text-sm">{profile.bio}</p>
            )}
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">
              {profile.reputation_score}
            </div>
            <div className="text-xs text-gray-400">reputation</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-6 text-sm text-gray-500">
          <div>
            <span className="font-semibold text-gray-900">
              {profile.completed_sessions_count}
            </span>{' '}
            sessions completed
          </div>
          <div className={ghostCount > 0 ? 'text-red-600' : 'text-emerald-600'}>
            <span className="font-semibold">
              {ghostCount === 0 ? '✓ 0' : `✗ ${ghostCount}`}
            </span>{' '}
            no-shows
          </div>
          <div>
            Member since{' '}
            {new Date(profile.created_at).toLocaleDateString('en-GB', {
              month: 'long',
              year: 'numeric',
            })}
          </div>
        </div>
      </div>

      {teachSkills && teachSkills.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Skills they teach</h2>
          <div className="flex flex-wrap gap-2">
            {teachSkills.map((s: any) => (
              <span
                key={s.user_skill_id}
                className={`text-sm px-3 py-1 rounded-full ${tierColors[s.skills.tier]}`}
              >
                {s.skills.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {learnSkills && learnSkills.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Skills they want to learn</h2>
          <div className="flex flex-wrap gap-2">
            {learnSkills.map((s: any) => (
              <span
                key={s.user_skill_id}
                className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700"
              >
                {s.skills.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {aiEvaluations && aiEvaluations.length > 0 && (
        <div className="bg-white rounded-xl border border-[#e5eeff] p-6 card-shadow">
          <h2 className="font-semibold text-[#0b1c30] font-['Geist'] mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#6b38d4] text-xl">auto_awesome</span>
            AI Teaching Scores
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Teaching Clarity', key: 'teaching_clarity', color: '#4f46e5' },
              { label: 'Content Coverage', key: 'content_coverage', color: '#6b38d4' },
              { label: 'Engagement', key: 'engagement_quality', color: '#006e4b' },
              { label: 'Responsiveness', key: 'responsiveness', color: '#3525cd' },
            ].map((dim) => {
              const avg = Math.round(
                aiEvaluations.reduce((sum: number, e: any) => sum + (e[dim.key] ?? 0), 0) /
                aiEvaluations.length
              )
              return (
                <div key={dim.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-[#464555]">{dim.label}</span>
                    <span className="text-sm font-bold font-['Geist']" style={{ color: dim.color }}>{avg}</span>
                  </div>
                  <div className="h-1.5 bg-[#e5eeff] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${avg}%`, backgroundColor: dim.color }} />
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-[#777587] mt-3">
            Based on {aiEvaluations.length} AI-evaluated session{aiEvaluations.length > 1 ? 's' : ''}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <a
          href="/match"
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
        >
          Find matches
        </a>
        <a
          href="/sessions"
          className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
        >
          My sessions
        </a>
      </div>
    </div>
  )
}
