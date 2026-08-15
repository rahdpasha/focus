import type {
  Subject,
  StudySession,
} from '../types'
import {
  getProductivityInsights,
} from './productivityInsights'
import {
  getConsistencyInsights,
} from './consistencyInsights'

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
  consistencyTrend?: string
}

export function getStudyRecommendation(
  sessions: StudySession[],
  subjects: Subject[],
  weeklyGoal: number
): StudyRecommendation {
  const insights =
    getProductivityInsights(
      sessions
    )

  const consistency =
    getConsistencyInsights(
      sessions,
      weeklyGoal
    )

  if (
    insights.thisWeekSessions === 0
  ) {
    return {
      type: 'noData',
      minutes: 25,
      consistencyTrend:
        consistency.trend,
    }
  }

  const studiedSubjectIds =
    new Set(
      insights.subjectBalance.map(
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

  const remainingMinutes =
    Math.max(
      0,
      weeklyGoal -
        insights.thisWeekMinutes
    )

  // Priority 1:
  // Completely neglected subject.
  if (unstudiedSubject) {
    return {
      type: 'unstudiedSubject',
      subjectName:
        unstudiedSubject.name,
      minutes: 25,
      remainingMinutes,
      changePercent:
        consistency.changePercent,
      consistencyTrend:
        consistency.trend,
    }
  }

  const lowestSubject =
    insights.subjectBalance[
      insights.subjectBalance.length -
        1
    ]

  // Priority 2:
  // A subject exists but is receiving very little time.
  if (
    lowestSubject &&
    lowestSubject.minutes < 15
  ) {
    return {
      type: 'understudiedSubject',
      subjectName:
        lowestSubject.subjectName,
      minutes: 25,
      remainingMinutes,
      changePercent:
        consistency.changePercent,
      consistencyTrend:
        consistency.trend,
    }
  }

  // Priority 3:
  // Sessions are too short to build a strong focus habit.
  if (
    insights.averageSessionMinutes >
      0 &&
    insights.averageSessionMinutes <
      15
  ) {
    return {
      type: 'shortSessions',
      minutes: 25,
      remainingMinutes,
      changePercent:
        consistency.changePercent,
      consistencyTrend:
        consistency.trend,
    }
  }

  // Priority 4:
  // Weekly target is still unfinished.
  if (
    remainingMinutes > 0
  ) {
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
      changePercent:
        consistency.changePercent,
      consistencyTrend:
        consistency.trend,
    }
  }

  return {
    type: 'maintain',
    changePercent:
      consistency.changePercent,
    consistencyTrend:
      consistency.trend,
  }
}
