'use client'

import { useState, useEffect } from 'react'
import { sendMatchRequest } from '@/lib/actions/match'

interface SkillInfo {
  skill_id: string
  name: string
  tier: string
}

interface MySkill {
  user_skill_id: string
  role: string
  skill_id: string
  skills: SkillInfo
}

interface MatchCandidate {
  user_id: string
  full_name: string
  bio: string | null
  reputation_score: number
  score: number
  score_breakdown: {
    skill: number
    reputation: number
    availability: number
    history: number
  }
  can_teach_me: string[]
  i_can_teach: string[]
  already_requested: boolean
  pending_from_them: boolean
}

export default function MatchBrowser({ mySkills }: { mySkills: MySkill[] }) {
  const [matches, setMatches] = useState<MatchCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requesting, setRequesting] = useState<string | null>(null)
  const [requestMsg, setRequestMsg] = useState('')

  useEffect(() => {
    fetch('/api/match/compute')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error)
        else setMatches(data.matches ?? [])
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load matches. Please refresh.')
        setLoading(false)
      })
  }, [])

  const myLearnSkills = mySkills.filter((s) => s.role === 'learn')

  async function handleRequest(candidateId: string) {
    const skillId = myLearnSkills[0]?.skill_id ?? ''
    if (!skillId) {
      setRequestMsg('Add a learn skill to your profile first.')
      return
    }
    setRequesting(candidateId)
    setRequestMsg('')
    const result = await sendMatchRequest(candidateId, skillId)
    if (result?.error) setRequestMsg(result.error)
    else {
      setRequestMsg('Match request sent!')
      setMatches((prev) =>
        prev.map((m) =>
          m.user_id === candidateId ? { ...m, already_requested: true } : m
        )
      )
    }
    setRequesting(null)
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>

  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-sm">
          No matches found yet. Add teach and learn skills plus availability
          windows to your profile.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {requestMsg && (
        <p className={`text-sm ${requestMsg.includes('sent') ? 'text-emerald-600' : 'text-red-600'}`}>
          {requestMsg}
        </p>
      )}
      {matches.map((candidate) => (
        <div
          key={candidate.user_id}
          className="border border-gray-200 rounded-xl p-5 hover:border-indigo-300 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <a
                  href={`/profile/${candidate.user_id}`}
                  className="font-semibold text-gray-900 hover:text-indigo-600 hover:underline"
                >
                  {candidate.full_name}
                </a>
                <span className="text-xs text-gray-400">Rep: {candidate.reputation_score}</span>
                {(candidate as any).is_trusted && (
                  <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                    ✓ Trusted
                  </span>
                )}
              </div>
              {candidate.bio && (
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">{candidate.bio}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                <span>
                  <span className="font-medium text-gray-700">Can teach you: </span>
                  {candidate.can_teach_me.length > 0
                    ? `${candidate.can_teach_me.length} skill(s)`
                    : 'None in common'}
                </span>
                <span>
                  <span className="font-medium text-gray-700">Wants to learn from you: </span>
                  {candidate.i_can_teach.length > 0
                    ? `${candidate.i_can_teach.length} skill(s)`
                    : 'None in common'}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full">
                  Skills {Math.round(candidate.score_breakdown.skill * 100)}%
                </span>
                <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded-full">
                  Rep {Math.round(candidate.score_breakdown.reputation * 100)}%
                </span>
                <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full">
                  Availability {Math.round(candidate.score_breakdown.availability * 100)}%
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3 shrink-0">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-700">
                  {Math.round(candidate.score * 100)}
                </div>
                <div className="text-xs text-gray-400">match score</div>
              </div>
              {candidate.already_requested ? (
                <span className="text-xs px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg">
                  Requested
                </span>
              ) : candidate.pending_from_them ? (
                <span className="text-xs px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg">
                  Sent you a request
                </span>
              ) : (
                <button
                  onClick={() => handleRequest(candidate.user_id)}
                  disabled={requesting === candidate.user_id}
                  className="text-sm px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {requesting === candidate.user_id ? 'Sending...' : 'Request Match'}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
