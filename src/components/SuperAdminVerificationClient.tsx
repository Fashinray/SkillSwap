'use client'

import { useState } from 'react'

type ProficiencyLabel = 'Beginner' | 'Intermediate' | 'Expert'

function deriveLabel(score: number): ProficiencyLabel {
  return score <= 2 ? 'Beginner' : score <= 4 ? 'Intermediate' : 'Expert'
}

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
  documents: Array<{
    doc_id: string
    doc_type: string
    file_name: string
    file_size: number | null
    uploaded_at: string
    signed_url: string | null
  }>
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function SuperAdminVerificationClient({
  pendingUsers,
}: {
  pendingUsers: PendingUser[]
}) {
  const [users, setUsers] = useState(pendingUsers)
  const [skillScores, setSkillScores] = useState<Record<string, number>>({})
  const [skillLabels, setSkillLabels] = useState<Record<string, ProficiencyLabel>>({})
  const [loading, setLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  function showMsg(text: string, ok: boolean) {
    setMsg({ text, ok })
    setTimeout(() => setMsg(null), 5000)
  }

  function setScore(userSkillId: string, score: number) {
    setSkillScores((prev) => ({ ...prev, [userSkillId]: score }))
    // Re-deriving the label here only moves it when the admin hasn't
    // already picked one explicitly for this skill — once they've
    // clicked a label button, changing the stars doesn't silently
    // overwrite their choice.
    setSkillLabels((prev) =>
      prev[userSkillId] ? prev : { ...prev, [userSkillId]: deriveLabel(score) }
    )
  }

  async function handleVerify(userId: string, decision: 'verified' | 'rejected') {
    setLoading(userId)
    const user = users.find((u) => u.user_id === userId)

    if (decision === 'verified' && user) {
      const skillErrors: string[] = []
      for (const skill of user.teach_skills) {
        const score = skillScores[skill.user_skill_id]
        if (score) {
          const res = await fetch('/api/admin/skills', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userSkillId: skill.user_skill_id,
              score,
              label: skillLabels[skill.user_skill_id] ?? deriveLabel(score),
            }),
          })
          if (!res.ok) {
            skillErrors.push(skill.skills?.name ?? skill.user_skill_id)
          }
        }
      }
      if (skillErrors.length > 0) {
        showMsg(`Could not save scores for: ${skillErrors.join(', ')}. Approval cancelled — fix and try again.`, false)
        setLoading(null)
        return
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

            {/* Submitted documents */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-[#8888aa] uppercase tracking-wide text-xs">
                Submitted Documents
              </p>
              {u.documents.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {u.documents.map((doc) =>
                    doc.signed_url ? (
                      <a
                        key={doc.doc_id}
                        href={doc.signed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm bg-[#0f0f1a] border border-[#2d2d4e] hover:border-[#6b38d4] rounded-lg px-3 py-2 text-[#c7c4d8] hover:text-white transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg text-[#6b38d4]">description</span>
                        <span className="truncate max-w-[200px]">{doc.file_name}</span>
                        {doc.file_size != null && (
                          <span className="text-xs text-[#8888aa]">({formatFileSize(doc.file_size)})</span>
                        )}
                        <span className="material-symbols-outlined text-sm text-[#8888aa]">open_in_new</span>
                      </a>
                    ) : (
                      <span
                        key={doc.doc_id}
                        className="flex items-center gap-2 text-sm bg-[#0f0f1a] border border-red-500/30 rounded-lg px-3 py-2 text-red-400"
                        title="Could not generate a link for this file — it may be missing from storage"
                      >
                        <span className="material-symbols-outlined text-lg">error</span>
                        {doc.file_name} (unavailable)
                      </span>
                    )
                  )}
                </div>
              ) : (
                <p className="text-sm text-[#8888aa] italic">No documents uploaded</p>
              )}
            </div>

            {/* Skill scoring */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-white font-['Geist']">
                Score Each Skill
              </p>
              {u.teach_skills.length === 0 ? (
                <p className="text-sm text-[#8888aa] italic bg-[#0f0f1a] border border-[#2d2d4e] rounded-xl p-3">
                  This user hasn&apos;t added any skills to teach yet — there&apos;s nothing to score.
                  They can add teach skills from their profile; the submission can still be
                  approved or rejected without a score.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {u.teach_skills.map((skill) => {
                    const currentLabel = skillLabels[skill.user_skill_id]
                    return (
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
                          {currentLabel && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              currentLabel === 'Beginner'
                                ? 'bg-green-500/20 text-green-400'
                                : currentLabel === 'Intermediate'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-purple-500/20 text-purple-400'
                            }`}>
                              {currentLabel}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button key={star}
                              onClick={() => setScore(skill.user_skill_id, star)}
                              className={`flex-1 h-8 rounded-lg text-sm font-bold transition-colors ${
                                (skillScores[skill.user_skill_id] ?? 0) >= star
                                  ? 'bg-[#6b38d4] text-white'
                                  : 'bg-[#2d2d4e] text-[#8888aa] hover:bg-[#3d3d6e]'
                              }`}>
                              {star}
                            </button>
                          ))}
                        </div>

                        <div className="flex gap-1.5 mt-2">
                          {(['Beginner', 'Intermediate', 'Expert'] as const).map((opt) => (
                            <button key={opt}
                              type="button"
                              onClick={() => setSkillLabels((prev) => ({ ...prev, [skill.user_skill_id]: opt }))}
                              className={`flex-1 h-7 rounded-lg text-xs font-semibold transition-colors ${
                                currentLabel === opt
                                  ? 'bg-[#6b38d4] text-white'
                                  : 'bg-[#2d2d4e] text-[#8888aa] hover:bg-[#3d3d6e]'
                              }`}>
                              {opt}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-[#8888aa] mt-1.5 text-center">
                          Stars suggest a label — click a label above to override it
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

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
