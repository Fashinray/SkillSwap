import type { ReactNode } from 'react'

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
  tag: string
}

export default function FeatureCard({ icon, title, description, tag }: FeatureCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
      <div className="w-11 h-11 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5]">
        {icon}
      </div>
      <h3 className="mt-4 font-['Geist'] font-semibold text-[#0F1729] text-lg">{title}</h3>
      <p className="mt-2 text-sm text-[#64748B] leading-relaxed">{description}</p>
      <span className="mt-4 inline-block px-3 py-1 rounded-full bg-[#F5F3FF] text-[#4F46E5] text-xs font-medium">
        {tag}
      </span>
    </div>
  )
}
