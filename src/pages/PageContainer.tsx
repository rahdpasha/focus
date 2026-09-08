import type { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
}

export default function PageContainer({ children }: PageContainerProps) {
  return (
    <main
      style={{
        flex: 1,
        minWidth: 0,
        padding: '32px',
        overflowY: 'auto',
      }}
    >
      {children}
    </main>
  )
}
