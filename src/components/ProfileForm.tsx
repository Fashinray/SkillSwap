'use client'

import { useState } from 'react'
import { updateProfile } from '@/lib/actions/profile'

interface Profile {
  full_name: string
  bio: string | null
  avatar_url: string | null
}

export default function ProfileForm({ profile }: { profile: Profile | null }) {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    setMessage('')
    const result = await updateProfile(formData)
    if (result?.error) setError(result.error)
    if (result?.success) setMessage('Profile updated.')
    setLoading(false)
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
        <textarea
          name="bio"
          rows={3}
          defaultValue={profile?.bio ?? ''}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Tell other students about yourself and your skills..."
        />
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {message && (
        <p className="text-sm text-emerald-600">{message}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save changes'}
      </button>
    </form>
  )
}
