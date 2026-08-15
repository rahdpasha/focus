import type { Subject, StudySession } from '../types'
import { getProductivityInsights } from './productivityInsights'
import { getConsistencyInsights } from './consistencyInsights'
import { getStudyRecommendation } from './studyRecommendations'

export interface StudyPlanItem {
  subjectId: string
  subjectName: string
  minutes: number
  reason: string
}

export interface StudyPlan {
  totalMinutes: number
  bestTime: string | null
  items: StudyPlanItem[]
}

export function getStudyPlan(
  sessions: StudySession[],
  subjects: Subject[],
  weeklyGoal: number
): StudyPlan {
  const insights = getProductivityInsights(sessions)
  const consistency = getConsistencyInsights(
    sessions,
    weeklyGoal
  )
  const recommendation = getStudyRecommendation(
    sessions,
    subjects,
    weeklyGoal
  )

  const remaining = Math.max(
    0,
    weeklyGoal - insights.thisWeekMinutes
  )

  const target = Math.min(
    60,
    Math.max(25, remaining || 25)
  )

  const items: StudyPlanItem[] = []

  const recommendedSubject =
    recommendation.subjectName
      ? subjects.find(
          (subject) =>
            subject.name ===
            recommendation.subjectName
        )
      : null

  if (recommendedSubject) {
    items.push({
      subjectId: recommendedSubject.id,
      subjectName:
        recommendedSubject.name,
      minutes: Math.min(
        25,
        target
      ),
      reason:
        recommendation.type ===
        'unstudiedSubject'
          ? 'Not studied this week.'
          : 'Needs more attention this week.',
    })
  }

  const usedIds = new Set(
    items.map(
      (item) => item.subjectId
    )
  )

  const weakestSubjects =
    insights.subjectBalance
      .slice()
      .reverse()

  for (
    const subject of weakestSubjects
  ) {
    if (
      items.length >= 2 ||
      subject.minutes >= 30
    ) {
      break
    }

    if (
      usedIds.has(
        subject.subjectId
      )
    ) {
      continue
    }

    const source =
      subjects.find(
        (item) =>
          item.id ===
          subject.subjectId
      )

    if (!source) {
      continue
    }

    items.push({
      subjectId: source.id,
      subjectName: source.name,
      minutes: 25,
      reason:
        'Lowest study time this week.',
    })

    usedIds.add(source.id)
  }

  if (items.length === 0) {
    const fallback =
      subjects[0]

    if (fallback) {
      items.push({
        subjectId: fallback.id,
        subjectName:
          fallback.name,
        minutes: target,
        reason:
          consistency.trend ===
          'declining'
            ? 'Help rebuild consistency.'
            : 'Keep your study rhythm going.',
      })
    }
  }

  return {
    totalMinutes:
      items.reduce(
        (sum, item) =>
          sum + item.minutes,
        0
      ),
    bestTime:
      insights.bestStudyTime?.label ??
      null,
    items,
  }
}
