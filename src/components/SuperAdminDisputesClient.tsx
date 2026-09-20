'use client'

import { useState } from 'react'

interface Dispute {
  dispute_id: string
  reason: string
  status: string
  created_at: string
  session_id: string
  filer_id: string
  decision: string | null
  decision_notes: string | null
}

export default function SuperAdminDisputesClient({
  disputes,
}: {
  disputes: Dispute[]
}) {
  const [decisions, setDecisions] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [resolved, setResolved] = useState<string[]>([])

  function showMsg(text: string, ok: boolean) {
    setMsg({ text, ok })
    setTimeout(() => setMsg(null), 5000)
  }

  async function handleResolve(disputeId: string, sessionId: string) {
    const decision = decisions[disputeId]
    if (!decision) { showMsg('Select a decision first.', false); return }
    setLoading(disputeId)
    const res = await fetch('/api/admin/disputes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disputeId, sessionId, decision, notes: notes[disputeId] ?? '' }),
    })
    const data = await res.json()
    if (data.error) showMsg(`Error: ${data.error}`, false)
    else {
      showMsg('Dispute resolved and escrow released.', true)
      setResolved((prev) => [...prev, disputeId])
    }
    setLoading(null)
  }

  const active = disputes.filter((d) => !resolved.includes(d.dispute_id))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white font-['Geist']">Dispute Resolution</h1>
        <p className="text-[#8888aa] text-sm mt-1">{active.length} open disputes</p>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-sm flex items-center gap-2 ${
          msg.ok ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30'
          : 'bg-red-900/30 text-red-400 border border-red-500/30'
        }`}>
          {msg.text}
        </div>
      )}

      {active.length === 0 ? (
        <div className="bg-[#1a1a2e] border border-[#2d2d4e] rounded-2xl p-16 text-center">
          <span className="material-symbols-outlined text-5xl text-[#2d2d4e] block mb-3">gavel</span>
          <p className="text-white font-['Geist'] font-medium">No open disputes</p>
        </div>
      ) : (
        active.map((d) => (
          <div key={d.dispute_id}
            className="bg-[#1a1a2e] border border-[#2d2d4e] rounded-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-white font-['Geist']">
                  Dispute #{d.dispute_id.slice(0, 8)}
                </p>
                <p className="text-xs text-[#8888aa] mt-0.5">
                  Session {d.session_id.slice(0, 8)} · {new Date(d.created_at).toLocaleDateString('en-GB')}
                </p>
              </div>
              <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">
                {d.status}
              </span>
            </div>

            <div className="p-4 bg-[#0f0f1a] border-l-4 border-[#6b38d4] rounded-xl text-sm text-[#8888aa]">
              {d.reason}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={decisions[d.dispute_id] ?? ''}
                onChange={(e) => setDecisions((p) => ({ ...p, [d.dispute_id]: e.target.value }))}
                className="px-3 py-2.5 bg-[#0f0f1a] border border-[#2d2d4e] rounded-xl text-white text-sm focus:outline-none focus:border-[#6b38d4]">
                <option value="">Select decision...</option>
                <option value="resolved_teacher_favour">Teacher favour</option>
                <option value="resolved_learner_favour">Learner favour</option>
                <option value="resolved_split">Split equally</option>
                <option value="dismissed">Dismissed</option>
              </select>
              <input
                type="text"
                value={notes[d.dispute_id] ?? ''}
                onChange={(e) => setNotes((p) => ({ ...p, [d.dispute_id]: e.target.value }))}
                placeholder="Decision notes (optional)"
                className="px-3 py-2.5 bg-[#0f0f1a] border border-[#2d2d4e] rounded-xl text-white text-sm focus:outline-none focus:border-[#6b38d4] placeholder-[#8888aa]"
              />
            </div>

            <button
              onClick={() => handleResolve(d.dispute_id, d.session_id)}
              disabled={loading === d.dispute_id || !decisions[d.dispute_id]}
              className="px-5 py-2.5 bg-[#6b38d4] text-white text-sm font-medium rounded-xl hover:bg-[#5a2db8] disabled:opacity-50 transition-colors">
              {loading === d.dispute_id ? 'Resolving...' : 'Resolve & Release Escrow'}
            </button>
          </div>
        ))
      )}
    </div>
  )
}
