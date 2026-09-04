'use client'

import { useState } from 'react'
import { bookSession } from '@/lib/actions/session'

interface Match {
  match_id: string
  skill_id: string
  requester_id: string
  recipient_id: string
  skills: { name: string; tier: string } | null
  requester: { full_name: string } | null
  recipient: { full_name: string } | null
}

export default function BookSessionForm({
  matches,
  currentUserId,
}: {
  matches: Match[]
  currentUserId: string
}) {
  const [selectedMatch, setSelectedMatch] = useState(matches[0]?.match_id ?? '')
  const [role, setRole] = useState<'teacher' | 'learner'>('learner')
  const [scheduledTime, setScheduledTime] = useState('')
  const [duration, setDuration] = useState('60')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const match = matches.find((m) => m.match_id === selectedMatch)
  const otherUser =
    match?.requester_id === currentUserId ? match?.recipient : match?.requester

  const tierCredits: Record<string, number> = {
    basic: 1,
    intermediate: 2,
    advanced: 3,
  }
  const creditsPerHour = tierCredits[match?.skills?.tier ?? 'basic'] ?? 1
  const depositAmount = Math.ceil(parseInt(duration) / 60) * creditsPerHour

  async function handleSubmit() {
    if (!scheduledTime) {
      setError('Please select a date and time.')
      return
    }
    setLoading(true)
    setError('')
    setSuccess('')

    const fd = new FormData()
    fd.append('matchId', selectedMatch)
    fd.append('skillId', match?.skill_id ?? '')
    fd.append('scheduledTime', new Date(scheduledTime).toISOString())
    fd.append('durationMinutes', duration)
    fd.append('role', role)

    const result = await bookSession(fd)
    if (result?.error) setError(result.error)
    else setSuccess('Session booked! Check your upcoming sessions below.')
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Match
          </label>
          <select
            value={selectedMatch}
            onChange={(e) => setSelectedMatch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
          >
            {matches.map((m) => {
              const other =
                m.requester_id === currentUserId ? m.recipient : m.requester
              return (
                <option key={m.match_id} value={m.match_id}>
                  {other?.full_name} — {m.skills?.name}
                </option>
              )
            })}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            I will be the
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'teacher' | 'learner')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
          >
            <option value="teacher">Teacher (I teach {match?.skills?.name})</option>
            <option value="learner">Learner (I learn {match?.skills?.name})</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Date and Time
          </label>
          <input
            type="datetime-local"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            min={new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Duration
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
          >
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="90">1.5 hours</option>
            <option value="120">2 hours</option>
          </select>
        </div>
      </div>

      {match && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-amber-600 text-lg">🔒</span>
            <span className="font-semibold text-amber-900 text-sm">
              Commitment Deposit
            </span>
          </div>
          <p className="text-sm text-amber-800">
            <strong>{depositAmount} credit{depositAmount !== 1 ? 's' : ''}</strong> will
            be temporarily locked from both your balance and your partner's balance.
          </p>
          <ul className="text-xs text-amber-700 space-y-1">
            <li>✓ Returned automatically when both confirm the session</li>
            <li>✓ No money is involved — only your earned credits</li>
            <li>✗ Forfeited if you ghost or cancel within 24 hours</li>
          </ul>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading || !selectedMatch}
        className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Booking...' : 'Book Session'}
      </button>
    </div>
  )
}
