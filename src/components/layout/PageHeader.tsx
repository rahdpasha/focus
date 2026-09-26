import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  compact?: boolean
}

export default function PageHeader({
  title,
  description,
  action,
  compact = false,
}: PageHeaderProps) {
  return (
    <header className={compact ? 'page-header page-header-compact' : 'page-header'}>
      <div className="page-header-copy">
        <div className="page-header-kicker">
          FOCUS / {title}
        </div>

        <h1>{title}</h1>

        {description && (
          <p>{description}</p>
        )}
      </div>

      {action && (
        <div className="page-header-action">
          {action}
        </div>
      )}
    </header>
  )
}
