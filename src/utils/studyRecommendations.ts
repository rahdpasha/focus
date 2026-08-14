import type { Subject, StudySession } from '../types'
import { getProductivityInsights } from './productivityInsights'

export type RecommendationType =
  | 'noData'
  | 'unstudiedSubject'
  | 'understudiedSubject'
  | 'shortSessions'
  | 'weeklyGoal'
  | 'maintain'

export interface StudyRecommendation {
  type: RecommendationType
  subjectName?: string
  minutes?: number
  remainingMinutes?: number
  changePercent?: number
}

export function getStudyRecommendation(
  sessions: StudySession[],
  subjects: Subject[],
  weeklyGoal: number
): StudyRecommendation {
  const insights =
    getProductivityInsights(sessions)

  if (
    insights.thisWeekSessions === 0
  ) {
    return {
      type: 'noData',
      minutes: 25,
    }
  }

  const subjectBalance =
    insights.subjectBalance

  const studiedSubjectIds =
    new Set(
      subjectBalance.map(
        (subject) =>
          subject.subjectId
      )
    )

  const unstudiedSubject =
    subjects.find(
      (subject) =>
        !studiedSubjectIds.has(
          subject.id
        )
    )

  if (unstudiedSubject) {
    return {
      type: 'unstudiedSubject',
      subjectName:
        unstudiedSubject.name,
      minutes: 25,
    }
  }

  const lowestSubject =
    subjectBalance[
      subjectBalance.length - 1
    ]

  if (
    lowestSubject &&
    lowestSubject.minutes < 15
  ) {
    return {
      type: 'understudiedSubject',
      subjectName:
        lowestSubject.subjectName,
      minutes: 25,
    }
  }

  if (
    insights.averageSessionMinutes >
      0 &&
    insights.averageSessionMinutes <
      15
  ) {
    return {
      type: 'shortSessions',
      minutes: 25,
    }
  }

  const remainingMinutes =
    Math.max(
      0,
      weeklyGoal -
        insights.thisWeekMinutes
    )

  if (remainingMinutes > 0) {
    return {
      type: 'weeklyGoal',
      remainingMinutes,
      minutes: Math.min(
        45,
        Math.max(
          25,
          remainingMinutes
        )
      ),
    }
  }

  return {
    type: 'maintain',
    changePercent:
      insights.weekChangePercent,
  }
}
