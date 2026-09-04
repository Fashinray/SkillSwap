'use client'

import { useState } from 'react'
import { confirmCompletion, cancelSession, fileDispute } from '@/lib/actions/session'

interface Session {
  session_id: string
  scheduled_time: string
  duration_minutes: number
  status: string
  teacher_confirmed: boolean
  learner_confirmed: boolean
  teacher_id: string
  learner_id: string
  skill_id: string
}

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
  ghosted: 'bg-orange-100 text-orange-700',
  disputed: 'bg-yellow-100 text-yellow-700',
}

export default function SessionCard({
  session,
  currentUserId,
}: {
  session: Session
  currentUserId: string
}) {
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [disputeReason, setDisputeReason] = useState('')
  const [showDisputeForm, setShowDisputeForm] = useState(false)

  const isTeacher = session.teacher_id === currentUserId
  const myConfirmed = isTeacher ? session.teacher_confirmed : session.learner_confirmed
  const otherConfirmed = isTeacher ? session.learner_confirmed : session.teacher_confirmed

  async function handleConfirm() {
    setLoading('confirm')
    setMessage('')
    const result = await confirmCompletion(session.session_id)
    if (result?.error) setMessage(result.error)
    else {
      const r = result.result as any
      if (r?.already_resolved) setMessage('Already resolved.')
      else if (r?.status === 'waiting_for_other_party')
        setMessage('Your confirmation recorded. Waiting for the other party.')
      else setMessage(`Session complete! ${r?.credits_transferred ?? 0} credits transferred.`)
    }
    setLoading(null)
  }

  async function handleCancel() {
    if (!confirm('Cancel this session?')) return
    setLoading('cancel')
    const result = await cancelSession(session.session_id)
    if (result?.error) setMessage(result.error)
    else setMessage('Session cancelled.')
    setLoading(null)
  }

  async function handleDispute() {
    if (!disputeReason.trim()) {
      setMessage('Please describe the issue.')
      return
    }
    setLoading('dispute')
    const result = await fileDispute(session.session_id, disputeReason)
    if (result?.error) setMessage(result.error)
    else {
      setMessage('Dispute filed. An admin will review.')
      setShowDisputeForm(false)
    }
    setLoading(null)
  }

  const isActive = ['scheduled', 'active'].includes(session.status)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                statusColors[session.status] ?? 'bg-gray-100 text-gray-600'
              }`}
            >
              {session.status}
            </span>
            <span className="text-xs text-gray-400">
              {isTeacher ? 'You are teaching' : 'You are learning'}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-900">
            {new Date(session.scheduled_time).toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {session.duration_minutes} minutes
          </p>
          {isActive && (
            <a
              href={`/sessions/${session.session_id}`}
              className="mt-1 inline-block text-xs text-indigo-600 hover:underline font-medium"
            >
              → Enter session room
            </a>
          )}

          {isActive && (
            <div className="mt-2 text-xs text-gray-500 space-y-0.5">
              <p>Your confirmation: {myConfirmed ? '✓ Done' : '⏳ Pending'}</p>
              <p>Other party: {otherConfirmed ? '✓ Done' : '⏳ Pending'}</p>
            </div>
          )}
        </div>

        {isActive && (
          <div className="flex flex-col gap-2 items-end shrink-0">
            {!myConfirmed && (
              <button
                onClick={handleConfirm}
                disabled={loading === 'confirm'}
                className="text-sm px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading === 'confirm' ? '...' : 'Confirm Complete'}
              </button>
            )}
            <button
              onClick={handleCancel}
              disabled={loading === 'cancel'}
              className="text-sm px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {loading === 'cancel' ? '...' : 'Cancel'}
            </button>
            {!showDisputeForm && (
              <button
                onClick={() => setShowDisputeForm(true)}
                className="text-xs text-red-500 hover:underline"
              >
                File dispute
              </button>
            )}
          </div>
        )}
      </div>

      {showDisputeForm && (
        <div className="mt-4 space-y-2">
          <textarea
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            rows={2}
            placeholder="Describe the issue..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
          />
          <div className="flex gap-2">
            <button
              onClick={handleDispute}
              disabled={loading === 'dispute'}
              className="text-sm px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading === 'dispute' ? '...' : 'Submit Dispute'}
            </button>
            <button
              onClick={() => setShowDisputeForm(false)}
              className="text-sm px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {message && (
        <p className={`mt-3 text-sm ${message.includes('error') || message.includes('Error') ? 'text-red-600' : 'text-emerald-600'}`}>
          {message}
        </p>
      )}
    </div>
  )
}
