'use client'

import { useState } from 'react'

interface Analytics {
  totalUsers: number
  totalSessions: number
  completedSessions: number
  openDisputes: number
  ghostedSessions: number
  completionRate: number
}

interface User {
  user_id: string
  full_name: string
  email: string
  role: string
  credit_balance: number
  reputation_score: number
  is_verified: boolean
  is_trusted: boolean
  created_at: string
}

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

interface EscrowRecord {
  escrow_id: string
  session_id: string
  teacher_deposit: number
  learner_deposit: number
  status: string
  created_at: string
}

function StatCard({ label, value, color, icon }: {
  label: string
  value: string | number
  color: string
  icon: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  )
}

export default function AdminDashboard({
  analytics, users, disputes, lockedEscrow,
}: {
  analytics: Analytics
  users: User[]
  disputes: Dispute[]
  lockedEscrow: EscrowRecord[]
}) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'disputes' | 'escrow'>('analytics')
  const [actionMsg, setActionMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [disputeDecisions, setDisputeDecisions] = useState<Record<string, string>>({})
  const [disputeNotes, setDisputeNotes] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')

  function showMsg(text: string, ok: boolean) {
    setActionMsg({ text, ok })
    setTimeout(() => setActionMsg(null), 5000)
  }

  async function handleGhostSweep() {
    setLoading('sweep')
    const res = await fetch('/api/admin/ghost-sweep', { method: 'POST' })
    const data = await res.json()
    if (data.error) showMsg(`Error: ${data.error}`, false)
    else showMsg(`Ghost sweep complete — ${data.ghostsProcessed} ghost(s) processed.`, true)
    setLoading(null)
  }

  async function handleSuspendUser(userId: string, name: string) {
    if (!confirm(`Suspend ${name}? They will not be able to log in.`)) return
    setLoading(userId)
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action: 'suspend' }),
    })
    const data = await res.json()
    if (data.error) showMsg(`Error: ${data.error}`, false)
    else showMsg(`${name} has been suspended.`, true)
    setLoading(null)
  }

  async function handleResolveDispute(disputeId: string, sessionId: string) {
    const decision = disputeDecisions[disputeId]
    if (!decision) { showMsg('Please select a decision first.', false); return }
    setLoading(disputeId)
    const res = await fetch('/api/admin/disputes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disputeId, sessionId, decision, notes: disputeNotes[disputeId] ?? '' }),
    })
    const data = await res.json()
    if (data.error) showMsg(`Error: ${data.error}`, false)
    else showMsg('Dispute resolved and escrow released.', true)
    setLoading(null)
  }

  async function handleReleaseEscrow(escrowId: string, sessionId: string) {
    if (!confirm('Manually release this escrow? Credits will be returned to both parties.')) return
    setLoading(escrowId)
    const res = await fetch('/api/admin/escrow', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ escrowId, sessionId, action: 'release' }),
    })
    const data = await res.json()
    if (data.error) showMsg(`Error: ${data.error}`, false)
    else showMsg('Escrow released successfully.', true)
    setLoading(null)
  }

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  const tabs = [
    { key: 'analytics', label: 'Overview' },
    { key: 'users', label: `Users (${users.length})` },
    { key: 'disputes', label: `Disputes (${disputes.length})` },
    { key: 'escrow', label: `Escrow (${lockedEscrow.length})` },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-400 mt-1">
            SkillSwap platform management · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={handleGhostSweep}
          disabled={loading === 'sweep'}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors shadow-sm"
        >
          {loading === 'sweep' ? (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : '👻'}
          Run Ghost Sweep
        </button>
      </div>

      {/* Action message */}
      {actionMsg && (
        <div className={`p-4 rounded-xl text-sm flex items-center gap-2 border ${
          actionMsg.ok
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {actionMsg.ok ? '✓' : '✗'} {actionMsg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-5 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard label="Total Users" value={analytics.totalUsers} color="bg-indigo-50"
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#4f46e5" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
            />
            <StatCard label="Total Sessions" value={analytics.totalSessions} color="bg-gray-50"
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#6b7280" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" /></svg>}
            />
            <StatCard label="Completed" value={analytics.completedSessions} color="bg-emerald-50"
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#059669" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <StatCard label="Completion Rate" value={`${analytics.completionRate}%`} color="bg-emerald-50"
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#059669" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>}
            />
            <StatCard label="Ghosted Sessions" value={analytics.ghostedSessions} color="bg-orange-50"
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#ea580c" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>}
            />
            <StatCard label="Open Disputes" value={analytics.openDisputes} color="bg-red-50"
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#dc2626" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>}
            />
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={1.5} stroke="currentColor"
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text" value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wide">User</th>
                    <th className="text-right px-5 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wide">Credits</th>
                    <th className="text-right px-5 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wide">Rep</th>
                    <th className="text-center px-5 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wide">Badges</th>
                    <th className="text-center px-5 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map((u) => (
                    <tr key={u.user_id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900">{u.full_name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{u.email}</div>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-indigo-600">{u.credit_balance}</td>
                      <td className="px-5 py-4 text-right text-gray-700">{u.reputation_score}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {u.role === 'admin' && (
                            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">admin</span>
                          )}
                          {u.is_trusted && (
                            <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium">✓ trusted</span>
                          )}
                          {u.is_verified && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">verified</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleSuspendUser(u.user_id, u.full_name)}
                            disabled={loading === u.user_id}
                            className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50 transition-colors"
                          >
                            {loading === u.user_id ? '...' : 'Suspend'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DISPUTES TAB */}
      {activeTab === 'disputes' && (
        <div className="space-y-4">
          {disputes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <div className="text-4xl mb-3">⚖️</div>
              <p className="font-medium text-gray-900">No open disputes</p>
              <p className="text-sm text-gray-400 mt-1">All disputes have been resolved.</p>
            </div>
          ) : (
            disputes.map((d) => (
              <div key={d.dispute_id} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">Dispute #{d.dispute_id.slice(0, 8)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        d.status === 'open' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {d.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Session {d.session_id.slice(0, 8)} · Filed {new Date(d.created_at).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 border-l-4 border-indigo-200">
                  {d.reason}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={disputeDecisions[d.dispute_id] ?? ''}
                    onChange={(e) => setDisputeDecisions((p) => ({ ...p, [d.dispute_id]: e.target.value }))}
                    className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select a decision...</option>
                    <option value="resolved_teacher_favour">Resolved — Teacher favour</option>
                    <option value="resolved_learner_favour">Resolved — Learner favour</option>
                    <option value="resolved_split">Resolved — Split equally</option>
                    <option value="dismissed">Dismissed — No action</option>
                  </select>
                  <input
                    type="text"
                    value={disputeNotes[d.dispute_id] ?? ''}
                    onChange={(e) => setDisputeNotes((p) => ({ ...p, [d.dispute_id]: e.target.value }))}
                    placeholder="Decision notes (optional)"
                    className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={() => handleResolveDispute(d.dispute_id, d.session_id)}
                  disabled={loading === d.dispute_id || !disputeDecisions[d.dispute_id]}
                  className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {loading === d.dispute_id ? 'Resolving...' : 'Resolve Dispute & Release Escrow'}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ESCROW TAB */}
      {activeTab === 'escrow' && (
        <div className="space-y-3">
          {lockedEscrow.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <div className="text-4xl mb-3">🔒</div>
              <p className="font-medium text-gray-900">No locked escrow records</p>
              <p className="text-sm text-gray-400 mt-1">All escrow deposits have been resolved.</p>
            </div>
          ) : (
            lockedEscrow.map((e) => (
              <div key={e.escrow_id}
                className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    Session <span className="font-mono text-xs text-gray-400">{e.session_id.slice(0, 12)}...</span>
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>Teacher: <strong className="text-gray-700">{e.teacher_deposit} cr</strong></span>
                    <span>Learner: <strong className="text-gray-700">{e.learner_deposit} cr</strong></span>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                      e.status === 'disputed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {e.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Locked {new Date(e.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={() => handleReleaseEscrow(e.escrow_id, e.session_id)}
                  disabled={loading === e.escrow_id}
                  className="shrink-0 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {loading === e.escrow_id ? '...' : 'Release'}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
