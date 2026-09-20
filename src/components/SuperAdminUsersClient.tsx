'use client'

import { useState } from 'react'

interface User {
  user_id: string
  full_name: string
  email: string
  role: string
  credit_balance: number
  reputation_score: number
  is_verified: boolean
  admin_verified: boolean
  is_trusted: boolean
  verification_status: string
  created_at: string
}

export default function SuperAdminUsersClient({ users }: { users: User[] }) {
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  function showMsg(text: string, ok: boolean) {
    setMsg({ text, ok })
    setTimeout(() => setMsg(null), 4000)
  }

  async function handleSuspend(userId: string, name: string) {
    if (!confirm(`Suspend ${name}?`)) return
    setLoading(userId)
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action: 'suspend' }),
    })
    const data = await res.json()
    if (data.error) showMsg(`Error: ${data.error}`, false)
    else showMsg(`${name} suspended.`, true)
    setLoading(null)
  }

  const filtered = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  const statusColor: Record<string, string> = {
    verified: 'bg-emerald-500/20 text-emerald-400',
    pending: 'bg-[#2d2d4e] text-[#8888aa]',
    under_review: 'bg-amber-500/20 text-amber-400',
    rejected: 'bg-red-500/20 text-red-400',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white font-['Geist']">User Management</h1>
        <p className="text-[#8888aa] text-sm mt-1">{users.length} registered users</p>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-sm flex items-center gap-2 ${
          msg.ok ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30'
          : 'bg-red-900/30 text-red-400 border border-red-500/30'
        }`}>
          {msg.text}
        </div>
      )}

      <div className="relative">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8888aa] text-xl">
          search
        </span>
        <input
          type="text" value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users by name or email..."
          className="w-full pl-11 pr-4 py-3 bg-[#1a1a2e] border border-[#2d2d4e] rounded-xl text-white text-sm placeholder-[#8888aa] focus:outline-none focus:border-[#6b38d4]"
        />
      </div>

      <div className="bg-[#1a1a2e] border border-[#2d2d4e] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2d2d4e]">
                {['User', 'Role', 'Credits', 'Rep', 'Status', 'Actions'].map((h) => (
                  <th key={h} className={`text-left px-4 py-3 text-xs uppercase tracking-wide text-[#8888aa] font-medium ${
                    h === 'Rep' || h === 'Credits' ? 'hidden sm:table-cell' : ''
                  }`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d2d4e]">
              {filtered.map((u) => (
                <tr key={u.user_id} className="hover:bg-[#0f0f1a] transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-white font-medium font-['Geist']">{u.full_name}</p>
                    <p className="text-[#8888aa] text-xs mt-0.5">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      u.role === 'super_admin' ? 'bg-[#6b38d4]/20 text-[#6b38d4]'
                      : u.role === 'admin' ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-[#2d2d4e] text-[#8888aa]'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#6b38d4] font-bold font-['Geist'] hidden sm:table-cell">
                    {u.credit_balance}
                  </td>
                  <td className="px-4 py-3 text-white hidden sm:table-cell">
                    {u.reputation_score}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      statusColor[u.verification_status] ?? 'bg-[#2d2d4e] text-[#8888aa]'
                    }`}>
                      {u.verification_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.role === 'user' && (
                      <button
                        onClick={() => handleSuspend(u.user_id, u.full_name)}
                        disabled={loading === u.user_id}
                        className="text-xs text-red-400 hover:underline disabled:opacity-50">
                        Suspend
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
  )
}
