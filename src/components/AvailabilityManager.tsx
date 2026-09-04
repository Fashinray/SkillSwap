'use client'

import { useState } from 'react'
import { setAvailability } from '@/lib/actions/profile'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function minToTime(min: number) {
  const h = Math.floor(min / 60).toString().padStart(2, '0')
  const m = (min % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

function timeToMin(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

interface Slot {
  slot_id: string
  weekday: number
  start_min: number
  end_min: number
}

export default function AvailabilityManager({ slots }: { slots: Slot[] }) {
  const [localSlots, setLocalSlots] = useState(slots)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  function addSlot() {
    setLocalSlots([
      ...localSlots,
      { slot_id: crypto.randomUUID(), weekday: 1, start_min: 480, end_min: 600 },
    ])
  }

  function removeSlot(id: string) {
    setLocalSlots(localSlots.filter((s) => s.slot_id !== id))
  }

  function updateSlot(id: string, field: keyof Slot, value: number) {
    setLocalSlots(
      localSlots.map((s) => (s.slot_id === id ? { ...s, [field]: value } : s))
    )
  }

  async function save() {
    setSaving(true)
    setMessage('')
    const result = await setAvailability(
      localSlots.map((s) => ({
        weekday: s.weekday,
        start_min: s.start_min,
        end_min: s.end_min,
      }))
    )
    if (result?.error) setMessage(result.error)
    else setMessage('Availability saved.')
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      {localSlots.length === 0 && (
        <p className="text-sm text-gray-400">
          No availability set. Add time windows when you are free for sessions.
        </p>
      )}
      {localSlots.map((slot) => (
        <div key={slot.slot_id} className="flex items-center gap-3 flex-wrap">
          <select
            value={slot.weekday}
            onChange={(e) => updateSlot(slot.slot_id, 'weekday', parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
          >
            {DAYS.map((d, i) => (
              <option key={i} value={i}>{d}</option>
            ))}
          </select>
          <input
            type="time"
            value={minToTime(slot.start_min)}
            onChange={(e) => updateSlot(slot.slot_id, 'start_min', timeToMin(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
          />
          <span className="text-sm text-gray-400">to</span>
          <input
            type="time"
            value={minToTime(slot.end_min)}
            onChange={(e) => updateSlot(slot.slot_id, 'end_min', timeToMin(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
          />
          <button
            onClick={() => removeSlot(slot.slot_id)}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Remove
          </button>
        </div>
      ))}
      <div className="flex items-center gap-3">
        <button
          onClick={addSlot}
          className="px-4 py-2 border border-gray-300 text-sm text-gray-700 rounded-lg hover:bg-gray-50"
        >
          + Add time window
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save availability'}
        </button>
      </div>
      {message && (
        <p className="text-sm text-emerald-600">{message}</p>
      )}
    </div>
  )
}
