import type { Subject, StudySession } from '../types'
import { getProductivityInsights } from './productivityInsights'
import { getConsistencyInsights } from './consistencyInsights'
import { getStudyRecommendation, type StudyRecommendation } from './studyRecommendations'

export type AdvisorPriority = 'high' | 'medium' | 'low'

export interface AdvisorEvidence {
  label: string
  value: string | number
}

export interface StudyAdvisorResult {
  recommendation: StudyRecommendation
  priority: AdvisorPriority
  summary: string
  evidence: AdvisorEvidence[]
  action: {
    subjectId?: string
    subjectName?: string
    minutes: number
  }
}

export function getStudyAdvisor(
  sessions: StudySession[],
  subjects: Subject[],
  weeklyGoal: number
): StudyAdvisorResult {
  const recommendation = getStudyRecommendation(
    sessions,
    subjects,
    weeklyGoal
  )
  const insights = getProductivityInsights(sessions)
  const consistency = getConsistencyInsights(sessions, weeklyGoal)

  const subject = recommendation.subjectName
    ? subjects.find((item) => item.name === recommendation.subjectName)
    : undefined

  const evidence: AdvisorEvidence[] = []

  if (recommendation.remainingMinutes !== undefined) {
    evidence.push({ label: 'weeklyRemainingMinutes', value: recommendation.remainingMinutes })
  }

  if (insights.averageSessionMinutes > 0) {
    evidence.push({ label: 'averageSessionMinutes', value: insights.averageSessionMinutes })
  }

  evidence.push({ label: 'consistencyTrend', value: consistency.trend })

  if (subject) {
    const balance = insights.subjectBalance.find((item) => item.subjectName === subject.name)
    if (balance) {
      evidence.push({ label: 'subjectMinutesThisWeek', value: balance.minutes })
    }
  }

  const priority: AdvisorPriority =
    recommendation.type === 'unstudiedSubject' ||
    recommendation.type === 'understudiedSubject'
      ? 'high'
      : recommendation.type === 'weeklyGoal' || recommendation.type === 'shortSessions'
        ? 'medium'
        : 'low'

  return {
    recommendation,
    priority,
    summary: buildSummary(recommendation, consistency.trend, insights.averageSessionMinutes),
    evidence,
    action: {
      subjectId: subject?.id,
      subjectName: recommendation.subjectName,
      minutes: recommendation.minutes ?? 25,
    },
  }
}

function buildSummary(
  recommendation: StudyRecommendation,
  trend: string,
  averageSessionMinutes: number
): string {
  switch (recommendation.type) {
    case 'unstudiedSubject':
      return `${recommendation.subjectName} has not been studied this week.`
    case 'understudiedSubject':
      return `${recommendation.subjectName} is receiving very little study time.`
    case 'shortSessions':
      return `Your average session is ${averageSessionMinutes} minutes; a focused 25-minute block is recommended.`
    case 'weeklyGoal':
      return `You are ${recommendation.remainingMinutes ?? 0} minutes short of your weekly goal.`
    case 'maintain':
      return trend === 'improving'
        ? 'Your study rhythm is improving. Maintain the current pace.'
        : 'Your study rhythm is stable. Maintain the current pace.'
    case 'noData':
    default:
      return 'Start a focused session to give FOCUS enough data to guide you.'
  }
}
