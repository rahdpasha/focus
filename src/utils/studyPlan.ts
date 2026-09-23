import type { Subject, StudySession } from "../types"
import { getProductivityInsights } from "./productivityInsights"
import { getConsistencyInsights } from "./consistencyInsights"
import { getStudyRecommendation } from "./studyRecommendations"
import { getStudyAdvisor } from "./studyAdvisor"

export interface StudyPlanItem {
  subjectId: string
  subjectName: string
  subjectColor?: string
  minutes: number
  reason: string
  priority: "high" | "medium" | "low"
  todayCompletedMinutes: number
}

export interface SubjectAllocation {
  subjectId: string
  subjectName: string
  subjectColor?: string
  targetMinutes: number
  completedMinutesThisWeek: number
  remainingMinutes: number
  percent: number
  status: "needs_attention" | "on_track" | "completed"
}

export interface StudyPlan {
  totalPlannedTodayMinutes: number
  todayCompletedMinutes: number
  todayRemainingMinutes: number
  weeklyTargetMinutes: number
  weeklyCompletedMinutes: number
  weeklyRemainingMinutes: number
  bestTime: string | null
  items: StudyPlanItem[]
  subjectAllocations: SubjectAllocation[]
  rationale: string
  priority: "high" | "medium" | "low"
}

export function getStudyPlan(
  sessions: StudySession[],
  subjects: Subject[],
  weeklyGoal: number,
  dailyGoal = 60
): StudyPlan {
  const insights = getProductivityInsights(sessions)
  const consistency = getConsistencyInsights(sessions, weeklyGoal)
  const recommendation = getStudyRecommendation(sessions, subjects, weeklyGoal)
  const advisor = getStudyAdvisor(sessions, subjects, weeklyGoal)

  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const endOfToday = startOfToday.getTime() + 24 * 60 * 60 * 1000

  const todayMinutes = Math.round(
    sessions.reduce((total, session) => {
      const timestamp = new Date(session.completedAt).getTime()
      return timestamp >= startOfToday.getTime() && timestamp < endOfToday && session.completed
        ? total + (session.actualDuration || session.duration || 0) / 60
        : total
    }, 0)
  )

  const startOfWeek = new Date(now)
  const dayOfWeek = startOfWeek.getDay()
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek
  startOfWeek.setDate(startOfWeek.getDate() + diffToMonday)
  startOfWeek.setHours(0, 0, 0, 0)

  const weeklyCompletedMinutes = Math.round(
    sessions.reduce((total, session) => {
      const timestamp = new Date(session.completedAt).getTime()
      return timestamp >= startOfWeek.getTime() && session.completed
        ? total + (session.actualDuration || session.duration || 0) / 60
        : total
    }, 0)
  )

  const todayRemaining = Math.max(0, dailyGoal - todayMinutes)
  const weeklyRemaining = Math.max(0, weeklyGoal - weeklyCompletedMinutes)

  const subjectMinutesMap = new Map<string, number>()
  sessions.forEach((session) => {
    const timestamp = new Date(session.completedAt).getTime()
    if (timestamp >= startOfWeek.getTime() && session.completed) {
      const prev = subjectMinutesMap.get(session.subjectId) || 0
      subjectMinutesMap.set(session.subjectId, prev + (session.actualDuration || session.duration || 0) / 60)
    }
  })

  const perSubjectWeeklyTarget = subjects.length > 0 ? Math.round(weeklyGoal / subjects.length) : 0

  const subjectAllocations: SubjectAllocation[] = subjects.map((sub) => {
    const completed = Math.round(subjectMinutesMap.get(sub.id) || 0)
    const target = perSubjectWeeklyTarget
    const remaining = Math.max(0, target - completed)
    const percent = target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : 0

    let status: SubjectAllocation["status"] = "on_track"
    if (percent >= 100) status = "completed"
    else if (percent < 40) status = "needs_attention"

    return {
      subjectId: sub.id,
      subjectName: sub.name,
      subjectColor: sub.color,
      targetMinutes: target,
      completedMinutesThisWeek: completed,
      remainingMinutes: remaining,
      percent,
      status,
    }
  })

  const items: StudyPlanItem[] = []
  const usedSubjectIds = new Set<string>()

  const recommendedSubject = recommendation.subjectName
    ? subjects.find((s) => s.name === recommendation.subjectName)
    : null

  if (recommendedSubject) {
    const recommendedMinutes = Math.min(45, Math.max(25, todayRemaining || 25))
    const todaySubMinutes = Math.round(
      sessions.reduce((tot, s) => {
        const ts = new Date(s.completedAt).getTime()
        return ts >= startOfToday.getTime() && ts < endOfToday && s.subjectId === recommendedSubject.id && s.completed
          ? tot + (s.actualDuration || s.duration || 0) / 60
          : tot
      }, 0)
    )

    items.push({
      subjectId: recommendedSubject.id,
      subjectName: recommendedSubject.name,
      subjectColor: recommendedSubject.color,
      minutes: recommendedMinutes,
      reason:
        recommendation.type === "unstudiedSubject"
          ? "Not studied yet this week."
          : "Highest priority based on weekly goal gap.",
      priority: "high",
      todayCompletedMinutes: todaySubMinutes,
    })
    usedSubjectIds.add(recommendedSubject.id)
  }

  subjectAllocations
    .filter((sa) => !usedSubjectIds.has(sa.subjectId))
    .sort((a, b) => a.percent - b.percent)
    .forEach((sa) => {
      if (items.length >= 3) return

      const sub = subjects.find((s) => s.id === sa.subjectId)
      if (!sub) return

      const todaySubMinutes = Math.round(
        sessions.reduce((tot, s) => {
          const ts = new Date(s.completedAt).getTime()
          return ts >= startOfToday.getTime() && ts < endOfToday && s.subjectId === sub.id && s.completed
            ? tot + (s.actualDuration || s.duration || 0) / 60
            : tot
        }, 0)
      )

      items.push({
        subjectId: sub.id,
        subjectName: sub.name,
        subjectColor: sub.color,
        minutes: 25,
        reason: sa.status === "needs_attention" ? "Lowest weekly goal progress." : "Maintain subject balance.",
        priority: sa.status === "needs_attention" ? "medium" : "low",
        todayCompletedMinutes: todaySubMinutes,
      })
      usedSubjectIds.add(sub.id)
    })

  if (items.length === 0 && subjects.length > 0) {
    const fallback = subjects[0]
    items.push({
      subjectId: fallback.id,
      subjectName: fallback.name,
      subjectColor: fallback.color,
      minutes: Math.max(25, todayRemaining || 25),
      reason: consistency.trend === "declining" ? "Rebuild daily study momentum." : "Keep your study rhythm active.",
      priority: "medium",
      todayCompletedMinutes: todayMinutes,
    })
  }

  const totalPlannedToday = items.reduce((sum, item) => sum + item.minutes, 0)

  return {
    totalPlannedTodayMinutes: totalPlannedToday,
    todayCompletedMinutes: todayMinutes,
    todayRemainingMinutes: todayRemaining,
    weeklyTargetMinutes: weeklyGoal,
    weeklyCompletedMinutes,
    weeklyRemainingMinutes: weeklyRemaining,
    bestTime: insights.bestStudyTime?.label ?? null,
    items,
    subjectAllocations,
    rationale: advisor.summary || "Follow your structured daily study plan to meet weekly targets.",
    priority: advisor.priority || "medium",
  }
}
