'use client'

import { useState } from 'react'

interface EscrowRecord {
  escrow_id: string
  session_id: string
  teacher_deposit: number
  learner_deposit: number
  status: string
  created_at: string
}

export default function SuperAdminEscrowClient({
  escrowRecords,
}: {
  escrowRecords: EscrowRecord[]
}) {
  const [loading, setLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [released, setReleased] = useState<string[]>([])

  function showMsg(text: string, ok: boolean) {
    setMsg({ text, ok })
    setTimeout(() => setMsg(null), 4000)
  }

  async function handleRelease(escrowId: string, sessionId: string) {
    if (!confirm('Release this escrow? Credits will be returned to both parties.')) return
    setLoading(escrowId)
    const res = await fetch('/api/admin/escrow', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ escrowId, sessionId, action: 'release' }),
    })
    const data = await res.json()
    if (data.error) showMsg(`Error: ${data.error}`, false)
    else {
      showMsg('Escrow released successfully.', true)
      setReleased((prev) => [...prev, escrowId])
    }
    setLoading(null)
  }

  const active = escrowRecords.filter((e) => !released.includes(e.escrow_id))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white font-['Geist']">Escrow Management</h1>
        <p className="text-[#8888aa] text-sm mt-1">{active.length} locked records</p>
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
          <span className="material-symbols-outlined text-5xl text-[#2d2d4e] block mb-3">
            account_balance_wallet
          </span>
          <p className="text-white font-['Geist'] font-medium">No locked escrow records</p>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map((e) => (
            <div key={e.escrow_id}
              className="bg-[#1a1a2e] border border-[#2d2d4e] rounded-2xl p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white font-['Geist']">
                  Session{' '}
                  <span className="font-mono text-xs text-[#8888aa]">
                    {e.session_id.slice(0, 12)}...
                  </span>
                </p>
                <div className="flex items-center gap-4 mt-1 text-xs text-[#8888aa]">
                  <span>Teacher: <strong className="text-white">{e.teacher_deposit} cr</strong></span>
                  <span>Learner: <strong className="text-white">{e.learner_deposit} cr</strong></span>
                  <span className={`px-2 py-0.5 rounded-full font-medium ${
                    e.status === 'disputed'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {e.status}
                  </span>
                </div>
                <p className="text-xs text-[#8888aa] mt-1">
                  Locked {new Date(e.created_at).toLocaleDateString('en-GB')}
                </p>
              </div>
              <button
                onClick={() => handleRelease(e.escrow_id, e.session_id)}
                disabled={loading === e.escrow_id}
                className="shrink-0 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                {loading === e.escrow_id ? '...' : 'Release'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
