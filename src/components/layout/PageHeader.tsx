import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
}

export default function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '16px',
        marginBottom: '24px',
      }}
    >
      <div>
        <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '24px' }}>{title}</h1>
        {description && (
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '6px' }}>{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
