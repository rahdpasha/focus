import { useEffect, useState, type FocusEvent, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
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
  const [editingField, setEditingField] = useState(false)
  const editableSelector =
    'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea, select'

  function handleMobileFocus(event: FocusEvent<HTMLDivElement>) {
    if (event.target.matches(editableSelector)) setEditingField(true)
  }

  function handleMobileBlur(event: FocusEvent<HTMLDivElement>) {
    const next = event.relatedTarget
    if (!(next instanceof HTMLElement) || !next.matches(editableSelector)) {
      setEditingField(false)
    }
  }

  function handleMobileKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // Escape often removes the active input before mobile Safari emits blur.
    if (event.key === 'Escape') setEditingField(false)
  }

  function handleMobilePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!(event.target instanceof Element) || !event.target.matches(editableSelector)) {
      setEditingField(false)
    }
  }

  // The app swaps route components without a full navigation. Otherwise
  // switching from a long History/League page leaves a new page midway down.
  useEffect(() => {
    window.scrollTo(0, 0)
    const content = document.getElementById('focus-main')
    if (content) content.scrollTop = 0
  }, [page])

  return (
    <>
      <a
        className="skip-link"
        href="#focus-main"
      >
        Skip to content
      </a>
      <BackgroundEffects />
      <div
        className={editingField ? 'app-shell is-editing' : 'app-shell'}
        onFocusCapture={handleMobileFocus}
        onBlurCapture={handleMobileBlur}
        onKeyDownCapture={handleMobileKeyDown}
        onPointerDownCapture={handleMobilePointerDown}
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
