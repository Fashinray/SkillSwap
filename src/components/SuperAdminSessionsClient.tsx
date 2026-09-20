'use client'

import { useState } from 'react'

interface Session {
  session_id: string
  status: string
  scheduled_time: string
  teacher_id: string
  learner_id: string
  created_at: string
}

const statusColor: Record<string, string> = {
  scheduled: 'bg-blue-500/20 text-blue-400',
  active: 'bg-emerald-500/20 text-emerald-400',
  completed: 'bg-[#2d2d4e] text-[#8888aa]',
  ghosted: 'bg-orange-500/20 text-orange-400',
  disputed: 'bg-red-500/20 text-red-400',
  cancelled: 'bg-[#2d2d4e] text-[#8888aa]',
}

export default function SuperAdminSessionsClient({
  sessions,
}: {
  sessions: Session[]
}) {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  async function handleGhostSweep() {
    setLoading(true)
    const res = await fetch('/api/admin/ghost-sweep', { method: 'POST' })
    const data = await res.json()
    if (data.error) setMsg({ text: `Error: ${data.error}`, ok: false })
    else setMsg({ text: `Ghost sweep complete — ${data.ghostsProcessed} processed.`, ok: true })
    setTimeout(() => setMsg(null), 5000)
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-['Geist']">Session Overview</h1>
          <p className="text-[#8888aa] text-sm mt-1">Last 50 sessions</p>
        </div>
        <button onClick={handleGhostSweep} disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white text-sm font-medium rounded-xl hover:bg-orange-700 disabled:opacity-50 transition-colors">
          <span className="material-symbols-outlined text-lg">local_police</span>
          {loading ? 'Running...' : 'Run Ghost Sweep'}
        </button>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-sm ${
          msg.ok ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30'
          : 'bg-red-900/30 text-red-400 border border-red-500/30'
        }`}>
          {msg.text}
        </div>
      )}

      <div className="bg-[#1a1a2e] border border-[#2d2d4e] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2d2d4e]">
                {['Session ID', 'Status', 'Scheduled Time', 'Created'].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs uppercase tracking-wide text-[#8888aa] font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d2d4e]">
              {sessions.map((s) => (
                <tr key={s.session_id} className="hover:bg-[#0f0f1a] transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-[#8888aa]">
                    {s.session_id.slice(0, 12)}...
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      statusColor[s.status] ?? 'bg-[#2d2d4e] text-[#8888aa]'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[#8888aa] text-xs">
                    {s.scheduled_time
                      ? new Date(s.scheduled_time).toLocaleString('en-GB')
                      : '—'}
                  </td>
                  <td className="px-5 py-3 text-[#8888aa] text-xs">
                    {new Date(s.created_at).toLocaleDateString('en-GB')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
