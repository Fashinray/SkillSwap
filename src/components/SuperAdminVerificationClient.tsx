'use client'

import { useState } from 'react'

interface PendingUser {
  user_id: string
  full_name: string
  email: string
  verification_status: string
  linkedin_url: string | null
  github_url: string | null
  portfolio_url: string | null
  created_at: string
  teach_skills: Array<{
    user_skill_id: string
    admin_score: number | null
    proficiency_label: string | null
    skills: { name: string; tier: string } | null
  }>
}

export default function SuperAdminVerificationClient({
  pendingUsers,
}: {
  pendingUsers: PendingUser[]
}) {
  const [users, setUsers] = useState(pendingUsers)
  const [skillScores, setSkillScores] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  function showMsg(text: string, ok: boolean) {
    setMsg({ text, ok })
    setTimeout(() => setMsg(null), 5000)
  }

  async function handleVerify(userId: string, decision: 'verified' | 'rejected') {
    setLoading(userId)
    const user = users.find((u) => u.user_id === userId)

    if (decision === 'verified' && user) {
      for (const skill of user.teach_skills) {
        const score = skillScores[skill.user_skill_id]
        if (score) {
          await fetch('/api/admin/skills', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userSkillId: skill.user_skill_id, score }),
          })
        }
      }
    }

    const res = await fetch('/api/admin/verify', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, decision }),
    })
    const data = await res.json()

    if (data.error) {
      showMsg(`Error: ${data.error}`, false)
    } else {
      showMsg(
        decision === 'verified'
          ? `${user?.full_name} has been verified and granted 5 credits.`
          : `${user?.full_name} has been rejected.`,
        decision === 'verified'
      )
      setUsers((prev) => prev.filter((u) => u.user_id !== userId))
    }
    setLoading(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white font-['Geist']">
          Verification Queue
        </h1>
        <p className="text-[#8888aa] text-sm mt-1">
          Review submitted documents and score each skill before approving.
        </p>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-sm flex items-center gap-2 ${
          msg.ok
            ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30'
            : 'bg-red-900/30 text-red-400 border border-red-500/30'
        }`}>
          <span className="material-symbols-outlined text-lg">
            {msg.ok ? 'check_circle' : 'error'}
          </span>
          {msg.text}
        </div>
      )}

      {users.length === 0 ? (
        <div className="bg-[#1a1a2e] border border-[#2d2d4e] rounded-2xl p-16 text-center">
          <span className="material-symbols-outlined text-5xl text-[#2d2d4e] block mb-3">
            check_circle
          </span>
          <p className="text-white font-['Geist'] font-medium">
            All documents reviewed
          </p>
          <p className="text-[#8888aa] text-sm mt-1">
            No pending verifications at this time.
          </p>
        </div>
      ) : (
        users.map((u) => (
          <div key={u.user_id}
            className="bg-[#1a1a2e] border border-[#2d2d4e] rounded-2xl p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-white font-['Geist'] text-lg">
                  {u.full_name}
                </p>
                <p className="text-[#8888aa] text-sm">{u.email}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${
                  u.verification_status === 'under_review'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-[#2d2d4e] text-[#8888aa]'
                }`}>
                  {u.verification_status}
                </span>
              </div>
              <p className="text-xs text-[#8888aa]">
                Submitted {new Date(u.created_at).toLocaleDateString('en-GB')}
              </p>
            </div>

            {/* Submitted links */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-[#8888aa] uppercase tracking-wide text-xs">
                Submitted Links
              </p>
              {u.linkedin_url && (
                <a href={u.linkedin_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#6b38d4] hover:underline">
                  <span className="material-symbols-outlined text-lg">work</span>
                  LinkedIn — {u.linkedin_url}
                </a>
              )}
              {u.github_url && (
                <a href={u.github_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#6b38d4] hover:underline">
                  <span className="material-symbols-outlined text-lg">code</span>
                  GitHub — {u.github_url}
                </a>
              )}
              {u.portfolio_url && (
                <a href={u.portfolio_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#6b38d4] hover:underline">
                  <span className="material-symbols-outlined text-lg">language</span>
                  Portfolio — {u.portfolio_url}
                </a>
              )}
              {!u.linkedin_url && !u.github_url && !u.portfolio_url && (
                <p className="text-sm text-[#8888aa] italic">No links provided</p>
              )}
            </div>

            {/* Skill scoring */}
            {u.teach_skills.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-white font-['Geist']">
                  Score Each Skill
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {u.teach_skills.map((skill) => (
                    <div key={skill.user_skill_id}
                      className="bg-[#0f0f1a] border border-[#2d2d4e] rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm text-white font-['Geist'] font-medium">
                            {skill.skills?.name}
                          </p>
                          <p className="text-xs text-[#8888aa]">
                            {skill.skills?.tier} tier
                          </p>
                        </div>
                        {skillScores[skill.user_skill_id] && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            skillScores[skill.user_skill_id] <= 2
                              ? 'bg-green-500/20 text-green-400'
                              : skillScores[skill.user_skill_id] <= 4
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-purple-500/20 text-purple-400'
                          }`}>
                            {skillScores[skill.user_skill_id] <= 2
                              ? 'Beginner'
                              : skillScores[skill.user_skill_id] <= 4
                              ? 'Intermediate'
                              : 'Expert'}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star}
                            onClick={() => setSkillScores((prev) => ({
                              ...prev,
                              [skill.user_skill_id]: star,
                            }))}
                            className={`flex-1 h-8 rounded-lg text-sm font-bold transition-colors ${
                              (skillScores[skill.user_skill_id] ?? 0) >= star
                                ? 'bg-[#6b38d4] text-white'
                                : 'bg-[#2d2d4e] text-[#8888aa] hover:bg-[#3d3d6e]'
                            }`}>
                            {star}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-[#8888aa] mt-1.5 text-center">
                        1–2 Beginner · 3–4 Intermediate · 5 Expert
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => handleVerify(u.user_id, 'verified')}
                disabled={loading === u.user_id}
                className="w-full sm:flex-1 py-3 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 font-['Geist']">
                <span className="material-symbols-outlined text-lg">verified</span>
                {loading === u.user_id ? 'Processing...' : 'Approve and Verify'}
              </button>
              <button
                onClick={() => handleVerify(u.user_id, 'rejected')}
                disabled={!!loading}
                className="px-5 py-3 border border-red-500/40 text-red-400 text-sm font-medium rounded-xl hover:bg-red-900/20 disabled:opacity-50 transition-colors">
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
