'use client'

import { useState } from 'react'

interface MatchFiltersProps {
  initialSearch?: string
  initialCategory?: string
  initialReputation?: string
}

// A real GET <form> to /match: submitting re-navigates with query params,
// which the (server component) page reads via `searchParams` to filter
// results server-side. No client-side fetch/router needed for this to
// work — local state here only keeps the inputs controlled while typing.
export default function MatchFilters({
  initialSearch = '',
  initialCategory = 'any',
  initialReputation = 'any',
}: MatchFiltersProps) {
  const [search, setSearch] = useState(initialSearch)
  const [category, setCategory] = useState(initialCategory)
  const [reputation, setReputation] = useState(initialReputation)

  return (
    <form
      method="GET"
      action="/match"
      className="bg-white rounded-2xl sm:rounded-full border border-[#e5eeff] shadow-sm flex flex-col sm:flex-row sm:items-center divide-y sm:divide-y-0 sm:divide-x divide-[#e5eeff]"
    >
      <div className="flex-1 px-5 py-3">
        <label htmlFor="match-search" className="block text-[10px] font-semibold uppercase tracking-widest text-[#777587]">
          Search Skill
        </label>
        <input
          id="match-search"
          name="q"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="What do you want to learn?"
          className="w-full mt-0.5 text-sm text-[#0b1c30] placeholder:text-[#777587] outline-none bg-transparent"
        />
      </div>

      <div className="flex-1 px-5 py-3">
        <label htmlFor="match-category" className="block text-[10px] font-semibold uppercase tracking-widest text-[#777587]">
          Category
        </label>
        <select
          id="match-category"
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full mt-0.5 text-sm text-[#0b1c30] outline-none bg-transparent"
        >
          <option value="any">Any Category</option>
          <option value="development">Development</option>
          <option value="design">Design</option>
          <option value="languages">Languages</option>
          <option value="finance">Finance</option>
          <option value="data-analysis">Data Analysis</option>
          <option value="creative">Creative</option>
          <option value="soft-skills">Soft Skills</option>
        </select>
      </div>

      <div className="flex-1 px-5 py-3">
        <label htmlFor="match-reputation" className="block text-[10px] font-semibold uppercase tracking-widest text-[#777587]">
          Reputation
        </label>
        <select
          id="match-reputation"
          name="reputation"
          value={reputation}
          onChange={(e) => setReputation(e.target.value)}
          className="w-full mt-0.5 text-sm text-[#0b1c30] outline-none bg-transparent"
        >
          <option value="any">Any Reputation</option>
          <option value="top-rated">Top Rated (75+)</option>
          <option value="trusted">Trusted Badge</option>
          <option value="verified">Verified Only</option>
          <option value="rising-stars">Rising Stars (new users)</option>
        </select>
      </div>

      <div className="px-3 py-3 flex justify-end sm:block">
        <button
          type="submit"
          aria-label="Search"
          className="w-10 h-10 rounded-full bg-[#4f46e5] hover:bg-[#3525cd] text-white flex items-center justify-center transition-colors shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </div>
    </form>
  )
}
