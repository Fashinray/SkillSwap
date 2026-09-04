'use client'

import { useState } from 'react'
import { addUserSkill, removeUserSkill } from '@/lib/actions/profile'

interface Skill {
  skill_id: string
  name: string
  tier: string
  category: string
}

interface UserSkill {
  user_skill_id: string
  role: string
  proficiency: number | null
  skills: Skill
}

export default function SkillManager({
  userSkills,
  allSkills,
}: {
  userSkills: UserSkill[]
  allSkills: Skill[]
}) {
  const [role, setRole] = useState<'teach' | 'learn'>('teach')
  const [selectedSkill, setSelectedSkill] = useState('')
  const [proficiency, setProficiency] = useState('3')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const teachSkills = userSkills.filter((s) => s.role === 'teach')
  const learnSkills = userSkills.filter((s) => s.role === 'learn')

  const tierColors: Record<string, string> = {
    basic: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
  }

  async function handleAdd() {
    if (!selectedSkill) return
    setLoading(true)
    setError('')
    const fd = new FormData()
    fd.append('skillId', selectedSkill)
    fd.append('role', role)
    if (role === 'teach') fd.append('proficiency', proficiency)
    const result = await addUserSkill(fd)
    if (result?.error) setError(result.error)
    setLoading(false)
  }

  async function handleRemove(id: string) {
    await removeUserSkill(id)
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-gray-400 mb-2">
        {allSkills.length} skills available in the platform
      </p>
      <div className="flex gap-3 flex-wrap items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            I want to
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'teach' | 'learn')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
          >
            <option value="teach">Teach</option>
            <option value="learn">Learn</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Skill
          </label>
          <select
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 min-w-[180px]"
          >
            <option value="">Select a skill</option>
            {allSkills.map((s) => (
              <option key={s.skill_id} value={s.skill_id}>
                {s.name} ({s.tier})
              </option>
            ))}
          </select>
        </div>
        {role === 'teach' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Proficiency (1-5)
            </label>
            <select
              value={proficiency}
              onChange={(e) => setProficiency(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        )}
        <button
          onClick={handleAdd}
          disabled={loading || !selectedSkill}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Skills I can teach
          </h3>
          {teachSkills.length === 0 ? (
            <p className="text-sm text-gray-400">None added yet.</p>
          ) : (
            <ul className="space-y-2">
              {teachSkills.map((s) => (
                <li
                  key={s.user_skill_id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-800">{s.skills.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${tierColors[s.skills.tier]}`}>
                      {s.skills.tier}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemove(s.user_skill_id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Skills I want to learn
          </h3>
          {learnSkills.length === 0 ? (
            <p className="text-sm text-gray-400">None added yet.</p>
          ) : (
            <ul className="space-y-2">
              {learnSkills.map((s) => (
                <li
                  key={s.user_skill_id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-800">{s.skills.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${tierColors[s.skills.tier]}`}>
                      {s.skills.tier}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemove(s.user_skill_id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
