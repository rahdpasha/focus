import type { CSSProperties } from 'react'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string
  accentColor?: string
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  accentColor = 'var(--primary)',
}: StatCardProps) {
  return (
    <article
      className="glass-panel dashboard-stat-card"
      style={
        {
          '--stat-accent': accentColor,
        } as CSSProperties
      }
    >
      <div className="dashboard-stat-card-head">
        <div className="dashboard-stat-card-icon">
          <Icon size={15} />
        </div>
        <span>{label}</span>
      </div>

      <strong className="mono">
        {value}
      </strong>
    </article>
  )
}
