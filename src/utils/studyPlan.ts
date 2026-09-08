import type { Subject, StudySession } from '../types'
import { getProductivityInsights } from './productivityInsights'
import { getConsistencyInsights } from './consistencyInsights'
import { getStudyRecommendation } from './studyRecommendations'
import { getStudyAdvisor } from './studyAdvisor'

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
  rationale: string
  priority: 'high' | 'medium' | 'low'
}

export function getStudyPlan(
  sessions: StudySession[],
  subjects: Subject[],
  weeklyGoal: number,
  dailyGoal = 60
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
  const advisor = getStudyAdvisor(sessions, subjects, weeklyGoal)

  const remainingWeekly = Math.max(0, weeklyGoal - insights.thisWeekMinutes)
  const todayMinutes = sessions.reduce((total, session) => {
    const timestamp = new Date(session.completedAt).getTime()
    const now = new Date()
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    const end = start.getTime() + 24 * 60 * 60 * 1000
    return timestamp >= start.getTime() && timestamp < end && session.completed
      ? total + session.actualDuration / 60
      : total
  }, 0)
  const remainingDaily = Math.max(0, dailyGoal - todayMinutes)
  const target = Math.min(60, Math.max(25, remainingDaily || (remainingWeekly ? Math.min(remainingWeekly, 60) : 25)))

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
    const recommendedMinutes = Math.min(
      25,
      Math.max(15, advisor.action.minutes || 25),
      target
    )

    items.push({
      subjectId: recommendedSubject.id,
      subjectName:
        recommendedSubject.name,
      minutes: recommendedMinutes,
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
    totalMinutes: items.reduce((sum, item) => sum + item.minutes, 0),
    bestTime: insights.bestStudyTime?.label ?? null,
    items,
    rationale: advisor.summary,
    priority: advisor.priority,
  }
}
