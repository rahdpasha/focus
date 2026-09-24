import type {
  ReactNode,
} from 'react'

interface PageContainerProps {
  children: ReactNode
}

export default function PageContainer({
  children,
}: PageContainerProps) {
  return (
    <main className="page-container">
      {children}
    </main>
  )
}
