'use client'

import { useState } from 'react'
import { submitReview } from '@/lib/actions/review'

interface Props {
  sessionId: string
  rateeId: string
  rateeName: string
  existingReview: boolean
}

const dimensions = [
  { key: 'teachingQuality', label: 'Teaching Quality', description: 'How clearly did they explain the subject?' },
  { key: 'punctuality', label: 'Punctuality', description: 'Did they show up on time and stay for the full session?' },
  { key: 'communication', label: 'Communication', description: 'How well did they communicate and respond?' },
  { key: 'overallExperience', label: 'Overall Experience', description: 'How would you rate the session overall?' },
]

export default function PeerReviewForm({ sessionId, rateeId, rateeName, existingReview }: Props) {
  const [scores, setScores] = useState<Record<string, number>>({
    teachingQuality: 0,
    punctuality: 0,
    communication: 0,
    overallExperience: 0,
  })
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(existingReview)

  if (submitted) {
    return (
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
        ✓ You have submitted your review for this session.
      </div>
    )
  }

  async function handleSubmit() {
    if (Object.values(scores).some((s) => s === 0)) {
      setMessage('Please rate all four dimensions before submitting.')
      return
    }
    setLoading(true)
    setMessage('')
    const fd = new FormData()
    fd.append('sessionId', sessionId)
    fd.append('rateeId', rateeId)
    fd.append('teachingQuality', scores.teachingQuality.toString())
    fd.append('punctuality', scores.punctuality.toString())
    fd.append('communication', scores.communication.toString())
    fd.append('overallExperience', scores.overallExperience.toString())
    fd.append('comment', comment)
    const result = await submitReview(fd)
    if (result?.error) setMessage(result.error)
    else {
      setMessage('Review submitted. Thank you!')
      setSubmitted(true)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold text-gray-900">
          Rate your session with {rateeName}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Your honest feedback helps build trust on the platform.
        </p>
      </div>

      {dimensions.map((dim) => (
        <div key={dim.key}>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">{dim.label}</label>
            {scores[dim.key] > 0 && (
              <span className="text-sm text-indigo-600 font-semibold">
                {scores[dim.key]}/5
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mb-2">{dim.description}</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setScores((prev) => ({ ...prev, [dim.key]: val }))}
                className={`w-10 h-10 rounded-lg text-sm font-semibold border-2 transition-colors ${
                  scores[dim.key] === val
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : scores[dim.key] > 0 && val <= scores[dim.key]
                    ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Comment (optional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Share what went well or what could be improved..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {message && (
        <p className={`text-sm ${message.includes('Thank') ? 'text-emerald-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || Object.values(scores).some((s) => s === 0)}
        className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>
    </div>
  )
}
