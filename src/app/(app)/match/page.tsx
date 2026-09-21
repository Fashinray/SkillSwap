import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import IncomingRequests, { type IncomingMatchRequest } from '@/components/IncomingRequests'
import MatchFilters from '@/components/match/MatchFilters'
import MatchCard, { type MatchCardProps } from '@/components/match/MatchCard'
import { getIncomingRequests } from '@/lib/actions/match'
import { GET as computeMatches } from '@/app/api/match/compute/route'

interface MatchApiCandidate {
  user_id: string
  full_name: string
  bio: string | null
  reputation_score: number
  score: number
  can_teach_me: string[]
  i_can_teach: string[]
  is_trusted: boolean
  already_requested: boolean
  pending_from_them: boolean
}

const CATEGORY_TABS = [
  { key: 'all', label: 'All Skills', icon: 'grid_view' },
  { key: 'dev', label: 'Dev', icon: 'code' },
  { key: 'design', label: 'Design', icon: 'edit' },
  { key: 'languages', label: 'Languages', icon: 'language' },
  { key: 'finance', label: 'Finance', icon: 'bar_chart' },
  { key: 'ai-tips', label: 'AI Tips', icon: 'auto_awesome' },
  { key: 'media', label: 'Media', icon: 'photo_camera' },
]

// MatchFilters' "Category" dropdown uses the 7 labels the spec asks for,
// but the real skills.category column is only a 3-value enum
// ('academic_technical' | 'creative' | 'practical_life' — see
// BUILDER_OUTPUT.md). This maps each dropdown option onto whichever real
// category it's closest to, so the filter is honest about what it can
// actually distinguish rather than silently doing nothing.
const CATEGORY_FILTER_MAP: Record<string, string[]> = {
  development: ['academic_technical'],
  languages: ['academic_technical'],
  finance: ['academic_technical'],
  'data-analysis': ['academic_technical'],
  'soft-skills': ['practical_life'],
  design: ['creative'],
  creative: ['creative'],
}

interface MatchPageProps {
  searchParams: Promise<{ q?: string; category?: string; reputation?: string }>
}

export default async function MatchPage({ searchParams }: MatchPageProps) {
  const { q, category: categoryFilter = 'any', reputation: reputationFilter = 'any' } = await searchParams
  const searchQuery = (q ?? '').trim().toLowerCase()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: mySkills } = await supabase
    .from('user_skills')
    .select('user_skill_id, role, skill_id, skills(skill_id, name, tier, category)')
    .eq('user_id', user.id)

  const incomingRequests = await getIncomingRequests()
  const hasTeachSkills = mySkills?.some((s) => s.role === 'teach') ?? false
  const hasLearnSkills = mySkills?.some((s) => s.role === 'learn') ?? false

  // Skill names/tiers/categories for any skill_id that can appear in
  // can_teach_me / i_can_teach: both are intersections with MY OWN
  // teach/learn skills, so every id they contain is already present here
  // — no extra skills-table query needed for those.
  const mySkillMap = new Map(
    (mySkills ?? [])
      .filter((s) => s.skills)
      .map((s) => [s.skill_id, s.skills as unknown as { name: string; tier: string; category: string }])
  )

  // Reuse the existing matching route's handler directly (same request,
  // same cookies) instead of an HTTP round-trip or duplicating its scoring
  // logic, which Part A of the spec says not to touch.
  const matchResponse = await computeMatches()
  const matchData = (await matchResponse.json()) as { matches?: MatchApiCandidate[]; error?: string }
  const candidates = matchData.matches ?? []

  const candidateIds = candidates.map((c) => c.user_id)

  // Fields the compute route doesn't return (avatar, admin-verification)
  // and a fallback teach-skill per candidate for when there's no overlap
  // with my own skills (can_teach_me is empty) — read-only lookups, not
  // a change to the matching logic itself.
  const [{ data: candidateProfiles }, { data: candidateTeachSkills }] = await Promise.all([
    candidateIds.length
      ? supabase
          .from('users')
          .select('user_id, avatar_url, is_verified, admin_verified')
          .in('user_id', candidateIds)
      : Promise.resolve({ data: [] as { user_id: string; avatar_url: string | null; is_verified: boolean; admin_verified: boolean | null }[] }),
    candidateIds.length
      ? supabase
          .from('user_skills')
          .select('user_id, skill_id, role, skills(name, tier, category)')
          .in('user_id', candidateIds)
          .eq('role', 'teach')
      : Promise.resolve({ data: [] as { user_id: string; skill_id: string; role: string; skills: { name: string; tier: string; category: string } | null }[] }),
  ])

  const profileMap = new Map((candidateProfiles ?? []).map((p) => [p.user_id, p]))
  const fallbackTeachSkillMap = new Map<string, { skill_id: string; name: string; tier: string; category: string }>()
  ;(candidateTeachSkills ?? []).forEach((row) => {
    const skillInfo = row.skills as unknown as { name: string; tier: string; category: string } | null
    if (!skillInfo || fallbackTeachSkillMap.has(row.user_id)) return
    fallbackTeachSkillMap.set(row.user_id, {
      skill_id: row.skill_id,
      name: skillInfo.name,
      tier: skillInfo.tier,
      category: skillInfo.category,
    })
  })

  const cards: MatchCardProps[] = candidates.map((candidate) => {
    const profile = profileMap.get(candidate.user_id)
    const fallbackTeach = fallbackTeachSkillMap.get(candidate.user_id)

    const teachSkillId = candidate.can_teach_me[0]
    const teachFromOverlap = teachSkillId ? mySkillMap.get(teachSkillId) : undefined
    const teachSkill = teachFromOverlap ?? fallbackTeach
    const requestSkillId = teachSkillId // only request skills confirmed to overlap with my learn list

    const learnSkillId = candidate.i_can_teach[0]
    const learnSkillInfo = learnSkillId ? mySkillMap.get(learnSkillId) : undefined

    return {
      userId: candidate.user_id,
      fullName: candidate.full_name,
      avatarUrl: profile?.avatar_url ?? undefined,
      isVerified: profile?.is_verified ?? true,
      adminVerified: profile?.admin_verified ?? false,
      isTrusted: candidate.is_trusted,
      teachSkill: teachSkill?.name ?? 'General Skills',
      teachSkillTier: (teachSkill?.tier as MatchCardProps['teachSkillTier']) ?? 'basic',
      learnSkill: learnSkillInfo?.name,
      bio: candidate.bio ?? undefined,
      reputationScore: candidate.reputation_score,
      compatibilityScore: candidate.score,
      category: teachSkill?.category,
      hasExistingRequest: candidate.already_requested,
      teachSkillId: requestSkillId,
    }
  })

  const filteredCards = cards.filter((card) => {
    if (searchQuery) {
      const haystack = `${card.teachSkill} ${card.fullName}`.toLowerCase()
      if (!haystack.includes(searchQuery)) return false
    }
    if (categoryFilter !== 'any') {
      const allowed = CATEGORY_FILTER_MAP[categoryFilter]
      if (!allowed || !allowed.includes(card.category ?? '')) return false
    }
    if (reputationFilter === 'top-rated' && card.reputationScore < 75) return false
    if (reputationFilter === 'trusted' && !card.isTrusted) return false
    if (reputationFilter === 'verified' && !card.adminVerified) return false
    // No signup-date field is available on MatchCardProps, so "new users"
    // is approximated with the schema's own default reputation_score (50,
    // see supabase/migrations/001_initial_schema.sql) — i.e. users who
    // haven't accumulated any reputation history yet either way.
    if (reputationFilter === 'rising-stars' && card.reputationScore !== 50) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0b1c30] font-['Geist']">Find Your Skill Match</h1>
        <p className="mt-1 text-sm text-[#464555]">
          Connect with verified OAU students who teach what you want to learn
        </p>
        <p className="mt-2 text-xs text-[#777587]">
          {filteredCards.length} verified teacher{filteredCards.length === 1 ? '' : 's'} available · Sorted by compatibility
        </p>
      </div>

      {(!hasTeachSkills || !hasLearnSkills) && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          Add at least one skill you can teach and one you want to learn in your{' '}
          <Link href="/profile" className="underline font-medium">profile</Link>{' '}
          to get meaningful match scores.
        </div>
      )}

      {incomingRequests.length > 0 && (
        <div className="bg-white rounded-xl border border-[#e5eeff] p-6">
          <h2 className="font-semibold text-[#0b1c30] mb-4">
            Incoming Requests ({incomingRequests.length})
          </h2>
          <IncomingRequests requests={incomingRequests as unknown as IncomingMatchRequest[]} />
        </div>
      )}

      <MatchFilters
        initialSearch={q ?? ''}
        initialCategory={categoryFilter}
        initialReputation={reputationFilter}
      />

      <div className="flex items-center gap-6 overflow-x-auto pb-1">
        {CATEGORY_TABS.map((tab, i) => (
          <button
            key={tab.key}
            type="button"
            data-category={tab.key}
            className="flex flex-col items-center gap-1.5 shrink-0"
          >
            <span
              className={`w-11 h-11 rounded-full flex items-center justify-center ${
                i === 0 ? 'bg-[#4f46e5]' : 'bg-[#eff4ff]'
              }`}
            >
              <span
                className={`material-symbols-outlined text-xl ${
                  i === 0 ? 'text-white' : 'text-[#777587]'
                }`}
              >
                {tab.icon}
              </span>
            </span>
            <span className={`text-xs ${i === 0 ? 'text-[#4f46e5] font-semibold' : 'text-[#777587]'}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {filteredCards.length === 0 ? (
        <div className="py-16 text-center">
          <span className="material-symbols-outlined text-6xl text-[#4f46e5]/20">people</span>
          <h2 className="mt-4 text-xl font-semibold text-[#0b1c30] font-['Geist']">No matches found yet</h2>
          <p className="mt-2 text-sm text-[#464555] max-w-sm mx-auto">
            Add more skills to your profile or adjust your filters to see compatible learning partners.
          </p>
          <Link
            href="/profile"
            className="mt-5 inline-block rounded-xl px-5 py-2.5 text-sm font-semibold bg-[#4f46e5] text-white hover:bg-[#3525cd] transition-colors"
          >
            Update My Profile
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredCards.map((card) => (
            <MatchCard key={card.userId} {...card} />
          ))}
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-50">
        <Link
          href="/match?filter=ai"
          className="relative flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-lg bg-gradient-to-r from-[#4f46e5] to-[#6b38d4]"
        >
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
          <span className="material-symbols-outlined text-lg">psychology</span>
          AI Recommended
        </Link>
      </div>
    </div>
  )
}
