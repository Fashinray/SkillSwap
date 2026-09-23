import Image from 'next/image'
import Link from 'next/link'
import { sendMatchRequest } from '@/lib/actions/match'

export interface MatchCardProps {
  userId: string
  fullName: string
  avatarUrl?: string
  isVerified: boolean
  adminVerified: boolean
  isTrusted: boolean
  teachSkill: string
  teachSkillTier: 'basic' | 'intermediate' | 'advanced'
  learnSkill?: string
  bio?: string
  reputationScore: number
  compatibilityScore?: number
  category?: string
  hasExistingRequest?: boolean
  // Not part of the spec's literal props list (see BUILDER_OUTPUT.md
  // deviations) — needed to wire the Request button to the existing
  // sendMatchRequest(recipientId, skillId) action without rewriting it.
  teachSkillId?: string
  // 'pending' | 'under_review' | 'verified' | 'rejected' (see
  // supabase/migrations/011_superadmin_and_verification.sql) — drives the
  // 3-state verification pill below.
  verificationStatus?: string
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  creative: 'from-orange-500 to-pink-500',
  academic_technical: 'from-indigo-500 to-purple-600',
  practical_life: 'from-indigo-500 to-purple-600',
}

const TIER_LABELS: Record<MatchCardProps['teachSkillTier'], string> = {
  basic: 'Basic',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

function VerificationPill({
  adminVerified,
  verificationStatus,
}: {
  adminVerified: boolean
  verificationStatus?: string
}) {
  if (adminVerified) {
    return (
      <span className="bg-green-500/90 text-white text-xs px-2 py-0.5 rounded-full font-medium">
        ✓ Verified
      </span>
    )
  }
  if (verificationStatus === 'under_review') {
    return (
      <span className="bg-amber-400/90 text-white text-xs px-2 py-0.5 rounded-full font-medium">
        Under Review
      </span>
    )
  }
  // Covers 'pending' (the column's default — nothing submitted yet) and
  // 'rejected'. The spec's literal wording is 'not_started' or null, but
  // the real verification_status CHECK constraint only allows
  // 'pending' | 'under_review' | 'verified' | 'rejected' (see
  // supabase/migrations/011_superadmin_and_verification.sql) — 'pending' is
  // what a fresh/never-submitted row actually has.
  return (
    <span className="bg-slate-400/90 text-white text-xs px-2 py-0.5 rounded-full font-medium">
      Unverified
    </span>
  )
}

function Avatar({
  avatarUrl,
  fullName,
  isVerified,
}: {
  avatarUrl?: string
  fullName: string
  isVerified: boolean
}) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={fullName}
        width={48}
        height={48}
        className="w-12 h-12 rounded-full object-cover shrink-0"
      />
    )
  }
  const initials =
    fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U'
  return (
    <div
      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${
        isVerified ? 'bg-[#4f46e5]' : 'bg-slate-400'
      }`}
    >
      {initials}
    </div>
  )
}

export default function MatchCard({
  userId,
  fullName,
  avatarUrl,
  isVerified,
  adminVerified,
  isTrusted,
  teachSkill,
  teachSkillTier,
  learnSkill,
  bio,
  reputationScore,
  compatibilityScore,
  category,
  hasExistingRequest,
  teachSkillId,
  verificationStatus,
}: MatchCardProps) {
  const gradient = CATEGORY_GRADIENTS[category ?? ''] ?? 'from-indigo-500 to-purple-600'
  const tierLabel = TIER_LABELS[teachSkillTier]
  const subtitle = `${tierLabel} ${teachSkill} Teacher`

  const description =
    bio && bio.trim().length > 0
      ? bio
      : `Teaching ${teachSkill}${learnSkill ? ` · Wants to learn ${learnSkill}` : ''}`

  // MatchCardProps has no score_breakdown (skill/reputation/availability),
  // only the combined compatibilityScore and reputationScore — so the
  // metric bar picks between those two rather than the three breakdown
  // components the spec describes (see BUILDER_OUTPUT.md deviations).
  const useReputation = reputationScore >= 70
  const metricLabel = useReputation ? 'REPUTATION' : 'SKILL MATCH'
  const metricPct = useReputation
    ? reputationScore
    : Math.round((compatibilityScore ?? 0) * 100)
  const metricValue = useReputation ? `${reputationScore}/100` : `${metricPct}%`
  const fillPct = Math.min(100, Math.max(0, metricPct))

  // Wraps the existing sendMatchRequest action (unmodified) so it fits the
  // <form action> signature, which requires a void-returning function —
  // sendMatchRequest itself returns { error } | { success } for callers
  // that need the result.
  async function requestMatch() {
    'use server'
    if (!teachSkillId) return
    await sendMatchRequest(userId, teachSkillId)
  }

  return (
    <div
      className="match-card bg-white rounded-2xl overflow-hidden border border-[#e5eeff] shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col"
      data-testid="match-card"
    >
      <div className={`relative h-36 bg-gradient-to-br ${gradient} overflow-hidden`}>
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white opacity-10" />
        <div className="absolute top-10 left-8 w-12 h-12 rounded-full bg-white opacity-20" />
        <div className="absolute bottom-4 left-1/3 w-16 h-16 rounded-full bg-white opacity-10" />

        <div className="absolute top-3 left-3">
          <VerificationPill adminVerified={adminVerified} verificationStatus={verificationStatus} />
        </div>

        {typeof compatibilityScore === 'number' && (
          <div className="absolute bottom-2 right-2 bg-white/95 text-indigo-700 font-bold text-sm px-2.5 py-1 rounded-full shadow-sm">
            {Math.round(compatibilityScore * 100)}% Match
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-3">
          <Avatar avatarUrl={avatarUrl} fullName={fullName} isVerified={isVerified} />
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-[#0b1c30] text-base truncate">{fullName}</span>
              {isTrusted && (
                <span className="text-amber-500 text-sm shrink-0" aria-label="Trusted">
                  ⭐
                </span>
              )}
            </div>
            <p className="text-[#464555] text-sm truncate">{subtitle}</p>
          </div>
        </div>

        <h3 className="mt-3 font-bold text-[#4f46e5] text-lg leading-tight line-clamp-2">
          {teachSkill}
        </h3>
        <p className="mt-1 text-[#464555] text-sm line-clamp-2">{description}</p>

        <div className="mt-3">
          <div className="flex items-center justify-between">
            <span className="uppercase text-[10px] font-semibold text-[#464555] tracking-widest">
              {metricLabel}
            </span>
            <span className="text-xs text-indigo-600 font-medium">{metricValue}</span>
          </div>
          <div className="mt-1 h-1 bg-slate-100 rounded-full w-full">
            <div
              className="h-1 bg-indigo-500 rounded-full"
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>

        <div className="mt-auto pt-4 flex gap-2">
          <Link
            href={`/profile/${userId}`}
            className="flex-1 text-center rounded-xl px-4 py-2 text-sm font-semibold border border-[#c7c4d8] text-[#464555] hover:bg-[#eff4ff] transition-colors"
          >
            View Profile
          </Link>

          {hasExistingRequest ? (
            <span className="flex-1 text-center rounded-xl px-4 py-2 text-sm font-semibold bg-gray-100 text-gray-400 cursor-not-allowed">
              Requested
            </span>
          ) : teachSkillId ? (
            <form action={requestMatch} className="flex-1">
              <button
                type="submit"
                className="w-full rounded-xl px-4 py-2 text-sm font-semibold bg-[#4f46e5] text-white hover:bg-[#3525cd] transition-colors"
              >
                Request
              </button>
            </form>
          ) : (
            <span
              className="flex-1 text-center rounded-xl px-4 py-2 text-sm font-semibold bg-gray-100 text-gray-400 cursor-not-allowed"
              title="No matching skill found to request"
            >
              Request
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
