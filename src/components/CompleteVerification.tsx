'use client'

import { useState } from 'react'
import { submitVerificationDocuments } from '@/lib/actions/verification'

interface CompleteVerificationProps {
  linkedinUrl: string | null
  githubUrl: string | null
  portfolioUrl: string | null
}

export default function CompleteVerification({
  linkedinUrl,
  githubUrl,
  portfolioUrl,
}: CompleteVerificationProps) {
  const [linkedin, setLinkedin] = useState(linkedinUrl ?? '')
  const [github, setGithub] = useState(githubUrl ?? '')
  const [portfolio, setPortfolio] = useState(portfolioUrl ?? '')
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData()
    fd.append('linkedinUrl', linkedin)
    fd.append('githubUrl', github)
    fd.append('portfolioUrl', portfolio)
    files.forEach((f) => fd.append('documents', f))
    const result = await submitVerificationDocuments(fd)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-2">Complete Verification</h2>
        <p className="text-sm text-emerald-700 flex items-center gap-2">
          Submitted! The admin will review your credentials shortly.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="font-semibold text-gray-900 mb-2">Complete Verification</h2>
      <p className="text-sm text-gray-500 mb-4">
        Your account is pending verification. Submit your credentials so the
        admin can review and approve your account.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { label: 'LinkedIn URL', value: linkedin, set: setLinkedin },
          { label: 'GitHub URL', value: github, set: setGithub },
          { label: 'Portfolio URL', value: portfolio, set: setPortfolio },
        ].map((field) => (
          <div key={field.label}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
            <input
              type="url"
              value={field.value}
              onChange={(e) => field.set(e.target.value)}
              placeholder="Optional"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
            />
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload Certificates or Portfolio Files
          </label>
          <input
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 3))}
            className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">PDF, PNG, or JPG — up to 3 files, 5MB each</p>
          {files.length > 0 && (
            <div className="mt-2 space-y-1">
              {files.map((f, i) => (
                <div key={i} className="text-xs text-gray-500">{f.name}</div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Submitting...' : 'Submit for Review'}
        </button>
      </form>
    </div>
  )
}
