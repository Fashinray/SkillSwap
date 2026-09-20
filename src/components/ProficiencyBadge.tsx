interface Props {
  label: 'Beginner' | 'Intermediate' | 'Expert' | null | undefined
  score?: number | null
  size?: 'sm' | 'md'
}

const config = {
  Beginner:     { color: 'bg-green-100 text-green-700 border-green-200',   icon: 'school' },
  Intermediate: { color: 'bg-blue-100 text-blue-700 border-blue-200',     icon: 'auto_awesome' },
  Expert:       { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: 'workspace_premium' },
}

export default function ProficiencyBadge({ label, score, size = 'sm' }: Props) {
  if (!label) return null
  const cfg = config[label]
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'
  const iconSize = size === 'sm' ? 'text-sm' : 'text-base'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-medium font-['Geist'] ${cfg.color} ${textSize}`}>
      <span className={`material-symbols-outlined ${iconSize}`}
        style={{ fontVariationSettings: "'FILL' 1" }}>
        {cfg.icon}
      </span>
      {label}
      {score && <span className="opacity-60">· {score}★</span>}
    </span>
  )
}
