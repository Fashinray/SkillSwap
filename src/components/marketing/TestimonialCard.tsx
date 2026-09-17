interface TestimonialCardProps {
  quote: string
  name: string
  course: string
}

export default function TestimonialCard({ quote, name, course }: TestimonialCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
      <div className="flex gap-0.5 text-[#4F46E5]">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L10 14.9l-5.2 2.8 1-5.9L1.5 7.7l5.9-.8L10 1.5z" />
          </svg>
        ))}
      </div>
      <p className="mt-4 text-sm italic text-[#334155] leading-relaxed">&ldquo;{quote}&rdquo;</p>
      <p className="mt-4 text-sm font-semibold text-[#0F1729]">{name}</p>
      <p className="text-xs text-[#64748B]">{course}</p>
    </div>
  )
}
