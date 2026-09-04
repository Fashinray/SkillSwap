import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

interface AvailabilitySlot {
  weekday: number
  start_min: number
  end_min: number
}

interface UserSkillRow {
  skill_id: string
  role: string
}

interface CandidateUser {
  user_id: string
  full_name: string
  bio: string | null
  reputation_score: number
  credit_balance: number
  user_skills: UserSkillRow[]
  availability_slots: AvailabilitySlot[]
}

function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0
  const intersection = new Set([...setA].filter((x) => setB.has(x)))
  const union = new Set([...setA, ...setB])
  return intersection.size / union.size
}

function computeSkillCompatibility(
  myTeach: Set<string>,
  myLearn: Set<string>,
  theirTeach: Set<string>,
  theirLearn: Set<string>
): number {
  const aTeachesBLearn = jaccardSimilarity(myTeach, theirLearn)
  const bTeachesALearn = jaccardSimilarity(theirTeach, myLearn)
  return (aTeachesBLearn + bTeachesALearn) / 2
}

function computeReputationDelta(repA: number, repB: number): number {
  return 1 - Math.abs(repA - repB) / 100
}

function computeAvailabilityOverlap(
  slotsA: AvailabilitySlot[],
  slotsB: AvailabilitySlot[]
): number {
  if (slotsA.length === 0 || slotsB.length === 0) return 0
  let intersectionMinutes = 0
  let unionMinutes = 0
  for (let day = 0; day <= 6; day++) {
    const inA = new Set<number>()
    const inB = new Set<number>()
    slotsA.filter((s) => s.weekday === day).forEach((s) => {
      for (let m = s.start_min; m < s.end_min; m++) inA.add(m)
    })
    slotsB.filter((s) => s.weekday === day).forEach((s) => {
      for (let m = s.start_min; m < s.end_min; m++) inB.add(m)
    })
    const union = new Set([...inA, ...inB])
    union.forEach((m) => {
      if (inA.has(m) && inB.has(m)) intersectionMinutes++
      unionMinutes++
    })
  }
  if (unionMinutes === 0) return 0
  return intersectionMinutes / unionMinutes
}

async function computePastSessionHistory(
  adminClient: ReturnType<typeof createAdminClient>,
  userIdA: string,
  userIdB: string
): Promise<number> {
  const { data: sessions } = await adminClient
    .from('sessions')
    .select('status')
    .or(
      `and(teacher_id.eq.${userIdA},learner_id.eq.${userIdB}),and(teacher_id.eq.${userIdB},learner_id.eq.${userIdA})`
    )
  if (!sessions || sessions.length === 0) return 0
  const hasCompleted = sessions.some((s) => s.status === 'completed')
  const hasNegative = sessions.some(
    (s) => s.status === 'ghosted' || s.status === 'disputed'
  )
  if (hasCompleted) return 0.1
  if (hasNegative) return -0.1
  return 0
}

export async function GET() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: settings } = await admin
    .from('platform_settings')
    .select('key, value')
    .in('key', [
      'MATCHING_WEIGHT_SKILL',
      'MATCHING_WEIGHT_REPUTATION',
      'MATCHING_WEIGHT_AVAILABILITY',
      'MATCHING_WEIGHT_HISTORY',
    ])

  const weights = { skill: 0.4, reputation: 0.3, availability: 0.2, history: 0.1 }
  if (settings) {
    settings.forEach((s) => {
      if (s.key === 'MATCHING_WEIGHT_SKILL') weights.skill = parseFloat(s.value)
      if (s.key === 'MATCHING_WEIGHT_REPUTATION') weights.reputation = parseFloat(s.value)
      if (s.key === 'MATCHING_WEIGHT_AVAILABILITY') weights.availability = parseFloat(s.value)
      if (s.key === 'MATCHING_WEIGHT_HISTORY') weights.history = parseFloat(s.value)
    })
  }

  const { data: myProfile } = await admin
    .from('users')
    .select('reputation_score, user_skills(skill_id, role), availability_slots(weekday, start_min, end_min)')
    .eq('user_id', user.id)
    .single()

  if (!myProfile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const mySkills = myProfile.user_skills as UserSkillRow[]
  const myTeach = new Set(mySkills.filter((s) => s.role === 'teach').map((s) => s.skill_id))
  const myLearn = new Set(mySkills.filter((s) => s.role === 'learn').map((s) => s.skill_id))
  const mySlots = myProfile.availability_slots as AvailabilitySlot[]

  const { data: candidates } = await admin
    .from('users')
    .select('user_id, full_name, bio, reputation_score, credit_balance, is_trusted, user_skills(skill_id, role), availability_slots(weekday, start_min, end_min)')
    .eq('is_verified', true)
    .neq('user_id', user.id)

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ matches: [] })
  }

  const { data: existingMatches } = await admin
    .from('matches')
    .select('requester_id, recipient_id, status')
    .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)

  const alreadyRequested = new Set<string>()
  const pendingFromThem = new Set<string>()
  if (existingMatches) {
    existingMatches.forEach((m) => {
      if (m.requester_id === user.id) alreadyRequested.add(m.recipient_id)
      if (m.recipient_id === user.id && m.status === 'pending') pendingFromThem.add(m.requester_id)
    })
  }

  const scored = await Promise.all(
    (candidates as CandidateUser[]).map(async (candidate) => {
      const theirSkills = candidate.user_skills as UserSkillRow[]
      const theirTeach = new Set(theirSkills.filter((s) => s.role === 'teach').map((s) => s.skill_id))
      const theirLearn = new Set(theirSkills.filter((s) => s.role === 'learn').map((s) => s.skill_id))
      const theirSlots = candidate.availability_slots as AvailabilitySlot[]

      const skillScore = computeSkillCompatibility(myTeach, myLearn, theirTeach, theirLearn)
      const repScore = computeReputationDelta(myProfile.reputation_score, candidate.reputation_score)
      const availScore = computeAvailabilityOverlap(mySlots, theirSlots)
      const historyRaw = await computePastSessionHistory(admin, user.id, candidate.user_id)
      const historyScore = Math.max(0, Math.min(1, 0.5 + historyRaw))

      const totalScore =
        weights.skill * skillScore +
        weights.reputation * repScore +
        weights.availability * availScore +
        weights.history * historyScore

      const sharedTeachLearn = [...myTeach].filter((id) => theirLearn.has(id))
      const sharedLearnTeach = [...myLearn].filter((id) => theirTeach.has(id))

      return {
        user_id: candidate.user_id,
        full_name: candidate.full_name,
        bio: candidate.bio,
        reputation_score: candidate.reputation_score,
        credit_balance: candidate.credit_balance,
        score: Math.round(totalScore * 100) / 100,
        score_breakdown: {
          skill: Math.round(skillScore * 100) / 100,
          reputation: Math.round(repScore * 100) / 100,
          availability: Math.round(availScore * 100) / 100,
          history: historyRaw,
        },
        can_teach_me: sharedLearnTeach,
        i_can_teach: sharedTeachLearn,
        is_trusted: (candidate as any).is_trusted ?? false,
        already_requested: alreadyRequested.has(candidate.user_id),
        pending_from_them: pendingFromThem.has(candidate.user_id),
      }
    })
  )

  const ranked = scored
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)

  return NextResponse.json({ matches: ranked, my_user_id: user.id })
}
