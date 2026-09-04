'use client'

import { useState } from 'react'
import { respondToMatchRequest } from '@/lib/actions/match'

interface Request {
  match_id: string
  created_at: string
  status: string
  skill_id: string
  requester_id: string
  skills: { name: string; tier: string } | null
  requester: { full_name: string; reputation_score: number } | null
}

const tierColors: Record<string, string> = {
  basic: 'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700',
}

export default function IncomingRequests({ requests }: { requests: Request[] }) {
  const [responding, setResponding] = useState<string | null>(null)
  const [resolved, setResolved] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')

  async function handleRespond(matchId: string, response: 'accepted' | 'rejected') {
    setResponding(matchId)
    setError('')
    const result = await respondToMatchRequest(matchId, response)
    if (result?.error) setError(result.error)
    else setResolved((prev) => new Set([...prev, matchId]))
    setResponding(null)
  }

  const visible = requests.filter((r) => !resolved.has(r.match_id))
  if (visible.length === 0) {
    return <p className="text-sm text-gray-400">All requests resolved.</p>
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {visible.map((req) => (
        <div
          key={req.match_id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg gap-4"
        >
          <div>
            <a
              href={`/profile/${req.requester_id}`}
              className="text-sm font-medium text-gray-900 hover:text-indigo-600 hover:underline"
            >
              {req.requester?.full_name ?? 'Unknown user'}
            </a>
            <div className="flex items-center gap-2 mt-1">
              {req.skills && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${tierColors[req.skills.tier]}`}>
                  {req.skills.name}
                </span>
              )}
              <span className="text-xs text-gray-400">
                Rep: {req.requester?.reputation_score ?? 50}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(req.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleRespond(req.match_id, 'rejected')}
              disabled={responding === req.match_id}
              className="text-sm px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
            >
              Decline
            </button>
            <button
              onClick={() => handleRespond(req.match_id, 'accepted')}
              disabled={responding === req.match_id}
              className="text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {responding === req.match_id ? '...' : 'Accept'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
