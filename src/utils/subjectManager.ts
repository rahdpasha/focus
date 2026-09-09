import type { Subject } from '../types'

export const SUBJECT_COLORS = [
  '#8b5cf6',
  '#3b82f6',
  '#f59e0b',
  '#14b8a6',
  '#ef4444',
  '#ec4899',
  '#22c55e',
  '#06b6d4',
] as const

export function normalizeSubjectName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

export function isValidSubjectName(name: string): boolean {
  return normalizeSubjectName(name).length > 0
}

export function subjectNameExists(subjects: Subject[], name: string, excludeId?: string): boolean {
  const normalized = normalizeSubjectName(name).toLocaleLowerCase()
  return subjects.some(
    (subject) => subject.id !== excludeId && normalizeSubjectName(subject.name).toLocaleLowerCase() === normalized,
  )
}

export function getNextSubjectColor(subjects: Subject[]): string {
  return SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length]
}

export function createSubject(subjects: Subject[], name: string, color?: string): Subject | null {
  const normalizedName = normalizeSubjectName(name)
  if (!normalizedName || subjectNameExists(subjects, normalizedName)) return null

  return {
    id: `subject-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: normalizedName,
    color: color || getNextSubjectColor(subjects),
  }
}
