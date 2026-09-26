import type { ReactNode } from 'react'
import type { Subject } from '../../types'
import type { Page } from '../../app/navigation'
import Sidebar from './Sidebar'
import MobileDock from './MobileDock'
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
      <a
        className="skip-link"
        href="#focus-main"
      >
        Skip to content
      </a>
      <BackgroundEffects />
      <div className="app-shell">
        <Sidebar
          page={page}
          onPageChange={onPageChange}
          subjects={subjects}
          activeSubjectId={activeSubjectId}
          onSelectSubject={onSelectSubject}
          onAddSubject={onAddSubject}
          onDeleteSubject={onDeleteSubject}
        />
        <div
          id="focus-main"
          className="app-content"
          tabIndex={-1}
        >
          {children}
        </div>
        <MobileDock
          page={page}
          onPageChange={onPageChange}
        />
      </div>
    </>
  )
}
