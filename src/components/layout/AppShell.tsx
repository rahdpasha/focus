import type { ReactNode } from 'react'
import type { Subject } from '../../types'
import type { Page } from '../../app/navigation'
import Sidebar from './Sidebar'
import BackgroundEffects from '../effects/BackgroundEffects'

interface AppShellProps {
  page: Page
  onPageChange: (page: Page) => void
  subjects: Subject[]
  activeSubjectId: string | null
  onSelectSubject: (id: string | null) => void
  onAddSubject: (name: string, color: string) => void
  onDeleteSubject: (id: string) => void
  children: ReactNode
}

export default function AppShell({
  page,
  onPageChange,
  subjects,
  activeSubjectId,
  onSelectSubject,
  onAddSubject,
  onDeleteSubject,
  children,
}: AppShellProps) {
  return (
    <>
      <BackgroundEffects />
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          background: 'transparent',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <Sidebar
          page={page}
          onPageChange={onPageChange}
          subjects={subjects}
          activeSubjectId={activeSubjectId}
          onSelectSubject={onSelectSubject}
          onAddSubject={onAddSubject}
          onDeleteSubject={onDeleteSubject}
        />
        {children}
      </div>
    </>
  )
}
