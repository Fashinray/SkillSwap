'use client'

import { useState, useEffect } from 'react'

interface EvaluationScores {
  teaching_clarity: number
  content_coverage: number
  engagement_quality: number
  responsiveness: number
  overall_score: number
  feedback_text: string
  status: string
  applied_to_reputation: boolean
}

interface Props {
  sessionId: string
  teacherId: string
  currentUserId: string
  sessionStatus: string
}

const dimensions = [
  { key: 'teaching_clarity', label: 'Teaching Clarity', icon: 'school', color: '#4f46e5' },
  { key: 'content_coverage', label: 'Content Coverage', icon: 'menu_book', color: '#6b38d4' },
  { key: 'engagement_quality', label: 'Engagement Quality', icon: 'psychology', color: '#006e4b' },
  { key: 'responsiveness', label: 'Responsiveness', icon: 'support_agent', color: '#3525cd' },
  { key: 'overall_score', label: 'Overall Score', icon: 'star', color: '#f59e0b' },
]

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-[#e5eeff] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-bold font-['Geist'] text-[#0b1c30] w-10 text-right">
        {score}
      </span>
    </div>
  )
}

export default function AIEvaluationPanel({
  sessionId,
  teacherId,
  currentUserId,
  sessionStatus,
}: Props) {
  const [evaluation, setEvaluation] = useState<EvaluationScores | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [showTranscriptInput, setShowTranscriptInput] = useState(false)
  const [error, setError] = useState('')
  const [newReputation, setNewReputation] = useState<number | null>(null)

  useEffect(() => {
    fetchEvaluation()
  }, [sessionId])

  async function fetchEvaluation() {
    setLoading(true)
    try {
      const res = await fetch(`/api/ai/evaluate?sessionId=${sessionId}`)
      const data = await res.json()
      if (data.evaluation) setEvaluation(data.evaluation)
    } catch {
      // no evaluation yet
    }
    setLoading(false)
  }

  async function runEvaluation() {
    if (!transcript.trim()) {
      setError('Please paste the session transcript before running evaluation.')
      return
    }
    if (transcript.trim().split(' ').length < 20) {
      setError('Transcript is too short. Please provide a meaningful session transcript.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/ai/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, transcriptText: transcript, teacherId }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else if (data.alreadyScored) {
        setEvaluation(data.evaluation)
      } else if (data.success) {
        setEvaluation(data.scores ? { ...data.scores, status: 'scored', applied_to_reputation: data.newReputation !== null } : null)
        if (data.newReputation !== null) setNewReputation(data.newReputation)
        await fetchEvaluation()
      }
    } catch {
      setError('Network error. Please try again.')
    }
    setSubmitting(false)
  }

  if (sessionStatus !== 'completed') {
    return null
  }

  return (
    <div className="bg-white rounded-2xl border border-[#e5eeff] p-6 card-shadow space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6b38d4] to-[#4f46e5] flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-xl">psychology</span>
        </div>
        <div>
          <h3 className="font-bold text-[#0b1c30] font-['Geist']">AI Session Evaluation</h3>
          <p className="text-xs text-[#464555]">
            Powered by GPT-4o-mini · Optional · Improves reputation accuracy
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-[#464555]">
          <svg className="animate-spin h-4 w-4 text-[#4f46e5]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Checking evaluation status...
        </div>
      )}

      {/* Already scored — show results */}
      {!loading && evaluation && evaluation.status === 'scored' && (
        <div className="space-y-5">
          {newReputation !== null && (
            <div className="p-3 bg-[#006e4b]/10 border border-[#006e4b]/20 rounded-xl flex items-center gap-2 text-sm text-[#006e4b] font-medium font-['Geist']">
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
              Reputation updated to {newReputation}/100
            </div>
          )}

          <div className="space-y-3">
            {dimensions.map((dim) => (
              <div key={dim.key}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="material-symbols-outlined text-base" style={{ color: dim.color }}>
                    {dim.icon}
                  </span>
                  <span className="text-sm font-semibold text-[#0b1c30] font-['Geist']">{dim.label}</span>
                </div>
                <ScoreBar
                  score={(evaluation as any)[dim.key]}
                  color={dim.color}
                />
              </div>
            ))}
          </div>

          <div className="p-4 bg-[#eff4ff] rounded-xl border-l-4 border-[#4f46e5]">
            <p className="text-xs font-semibold text-[#464555] uppercase tracking-wide mb-2 font-['Geist']">
              AI Feedback Report
            </p>
            <p className="text-sm text-[#0b1c30] leading-relaxed">{evaluation.feedback_text}</p>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#777587]">
            <span className="material-symbols-outlined text-sm">shield</span>
            Session transcript was discarded after analysis (NDPR compliant)
          </div>
        </div>
      )}

      {/* Failed — show retry */}
      {!loading && evaluation && evaluation.status === 'failed' && (
        <div className="space-y-3">
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
            <span className="material-symbols-outlined text-lg">error</span>
            Previous evaluation failed. You can retry below.
          </div>
          <button
            onClick={() => setShowTranscriptInput(true)}
            className="w-full py-2.5 border-2 border-dashed border-[#4f46e5] text-[#4f46e5] text-sm font-semibold font-['Geist'] rounded-xl hover:bg-[#eff4ff] transition-colors"
          >
            Retry Evaluation
          </button>
        </div>
      )}

      {/* Not yet evaluated */}
      {!loading && !evaluation && !showTranscriptInput && (
        <div className="space-y-4">
          <div className="p-4 bg-[#eff4ff] rounded-xl text-sm text-[#464555] leading-relaxed">
            <p className="font-semibold text-[#0b1c30] font-['Geist'] mb-1">How it works</p>
            <ol className="space-y-1 list-decimal list-inside text-xs">
              <li>Paste a transcript of the session chat or your notes</li>
              <li>GPT-4o-mini scores the teaching quality on 5 dimensions</li>
              <li>Scores blend with peer reviews to update the teacher reputation</li>
              <li>Transcript is discarded immediately after scoring</li>
            </ol>
          </div>
          <button
            onClick={() => setShowTranscriptInput(true)}
            className="w-full py-3 bg-gradient-to-r from-[#6b38d4] to-[#4f46e5] text-white text-sm font-semibold font-['Geist'] rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">auto_awesome</span>
            Run AI Evaluation
          </button>
        </div>
      )}

      {/* Transcript input */}
      {!loading && showTranscriptInput && (!evaluation || evaluation.status !== 'scored') && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#0b1c30] font-['Geist'] mb-2">
              Session Transcript
            </label>
            <p className="text-xs text-[#464555] mb-2">
              Paste the chat log, your session notes, or a summary of what was discussed.
              The more detail, the better the scores.
            </p>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={8}
              placeholder="Paste the session transcript or notes here...

Example:
Teacher: Today we are covering Python list comprehensions.
A list comprehension lets you create a new list by applying an
expression to each item in an existing list...
Learner: Can you show me an example?
Teacher: Of course. squares = [x**2 for x in range(10)]..."
              className="w-full px-4 py-3 border border-[#c7c4d8] rounded-xl text-sm text-[#0b1c30] bg-white focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/30 focus:border-[#4f46e5] resize-none transition-all"
            />
            <p className="text-xs text-[#777587] mt-1">
              {transcript.trim().split(/\s+/).filter(Boolean).length} words
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={runEvaluation}
              disabled={submitting || !transcript.trim()}
              className="flex-1 py-3 bg-gradient-to-r from-[#6b38d4] to-[#4f46e5] text-white text-sm font-semibold font-['Geist'] rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analysing with GPT-4o-mini...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">auto_awesome</span>
                  Analyse Transcript
                </>
              )}
            </button>
            <button
              onClick={() => { setShowTranscriptInput(false); setError('') }}
              className="px-4 py-3 border border-[#c7c4d8] text-[#464555] text-sm rounded-xl hover:bg-[#eff4ff] transition-colors font-['Geist']"
            >
              Cancel
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#777587]">
            <span className="material-symbols-outlined text-sm">shield</span>
            Transcript is discarded immediately after scoring and never stored
          </div>
        </div>
      )}
    </div>
  )
}
