'use client'

import { useState } from 'react'

interface Setting {
  key: string
  value: string
  description: string
}

export default function SuperAdminSettingsClient({
  settings,
}: {
  settings: Setting[]
}) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map((s) => [s.key, s.value]))
  )
  const [saving, setSaving] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  async function handleSave(key: string) {
    setSaving(key)
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: values[key] }),
    })
    const data = await res.json()
    if (data.error) setMsg({ text: `Error: ${data.error}`, ok: false })
    else setMsg({ text: `${key} updated.`, ok: true })
    setTimeout(() => setMsg(null), 3000)
    setSaving(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white font-['Geist']">Platform Settings</h1>
        <p className="text-[#8888aa] text-sm mt-1">
          Configure system-wide constants. Changes take effect immediately.
        </p>
      </div>

      {msg && (
        <div className={`p-3 rounded-xl text-sm ${
          msg.ok ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30'
          : 'bg-red-900/30 text-red-400 border border-red-500/30'
        }`}>
          {msg.text}
        </div>
      )}

      <div className="space-y-3">
        {settings.map((s) => (
          <div key={s.key}
            className="bg-[#1a1a2e] border border-[#2d2d4e] rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-white font-['Geist'] font-mono">
                  {s.key}
                </p>
                <p className="text-xs text-[#8888aa] mt-0.5">{s.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={values[s.key] ?? ''}
                  onChange={(e) => setValues((p) => ({ ...p, [s.key]: e.target.value }))}
                  className="w-32 px-3 py-1.5 bg-[#0f0f1a] border border-[#2d2d4e] rounded-lg text-white text-sm focus:outline-none focus:border-[#6b38d4] font-mono text-right"
                />
                <button
                  onClick={() => handleSave(s.key)}
                  disabled={saving === s.key}
                  className="px-3 py-1.5 bg-[#6b38d4] text-white text-xs font-medium rounded-lg hover:bg-[#5a2db8] disabled:opacity-50 transition-colors">
                  {saving === s.key ? '...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
