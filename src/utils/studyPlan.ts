import type { Subject, StudySession } from "../types"
import type {
  AdvancedGoal,
  RoutineItem,
  RoutineSessionContext,
} from "../storage/types"
import { getProductivityInsights } from "./productivityInsights"
import { getConsistencyInsights } from "./consistencyInsights"
import { getAdvancedGoalProgress } from "./advancedGoals"
import {
  getRecoverableRoutineOccurrences,
  getRoutineItemsForDate,
  getRoutineMinutesForDate,
  toRoutineDateKey,
} from "./routine"

export type StudyPlanReason =
  | "routine_due"
  | "recovery_due"
  | "goal_deadline"
  | "goal_gap"
  | "understudied"
  | "weekly_gap"
  | "starter"

export interface StudyPlanItem {
  subjectId: string
  subjectName: string
  subjectColor?: string
  minutes: number
  reason: string
  reasonCode: StudyPlanReason
  reasons: StudyPlanReason[]
  priority: "high" | "medium" | "low"
  priorityScore: number
  todayCompletedMinutes: number
  routineContext?: RoutineSessionContext
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
  generatedAt: string
  totalPlannedTodayMinutes: number
  todayCompletedMinutes: number
  todayRemainingMinutes: number
  weeklyTargetMinutes: number
  weeklyCompletedMinutes: number
  weeklyRemainingMinutes: number
  bestTime: string | null
  items: StudyPlanItem[]
  mainPrioritySubjectId?: string
  subjectAllocations: SubjectAllocation[]
  rationale: string
  priority: "high" | "medium" | "low"
}

export interface StudyPlanInput {
  sessions: StudySession[]
  subjects: Subject[]
  weeklyGoal: number
  dailyGoal?: number
  routineItems?: RoutineItem[]
  advancedGoals?: AdvancedGoal[]
  now?: Date
}

interface PlanCandidate {
  subjectId: string
  minutes: number
  score: number
  reasonCode: StudyPlanReason
  routineContext?: RoutineSessionContext
}

const MAX_BLOCK_MINUTES = 90
const MAX_PLAN_BLOCKS = 5

function startOfLocalDay(date: Date): Date {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

function startOfLocalWeek(date: Date): Date {
  const value = startOfLocalDay(date)
  const dayOfWeek = value.getDay()
  const diffToMonday =
    (dayOfWeek === 0 ? -6 : 1) -
    dayOfWeek

  value.setDate(
    value.getDate() + diffToMonday,
  )

  return value
}

function minutesInRange(
  sessions: StudySession[],
  start: Date,
  end?: Date,
  subjectId?: string,
): number {
  return Math.round(
    sessions.reduce((total, session) => {
      if (!session.completed) {
        return total
      }

      if (
        subjectId &&
        session.subjectId !== subjectId
      ) {
        return total
      }

      const timestamp =
        new Date(
          session.completedAt,
        ).getTime()

      if (
        timestamp <
        start.getTime()
      ) {
        return total
      }

      if (
        end &&
        timestamp >=
          end.getTime()
      ) {
        return total
      }

      return (
        total +
        Math.max(
          0,
          session.actualDuration,
        ) /
          60
      )
    }, 0),
  )
}

function reasonText(
  reason: StudyPlanReason,
): string {
  switch (reason) {
    case "routine_due":
      return "Routine due today."
    case "recovery_due":
      return "Recovery from a missed routine."
    case "goal_deadline":
      return "This goal is closest to its deadline."
    case "goal_gap":
      return "You're behind this goal's pace."
    case "understudied":
      return "You studied this subject less this week."
    case "weekly_gap":
      return "Your weekly target needs more focused time."
    case "starter":
    default:
      return "Start with one focused block."
  }
}

function priorityFromScore(
  score: number,
): StudyPlanItem["priority"] {
  if (score >= 800) {
    return "high"
  }

  if (score >= 400) {
    return "medium"
  }

  return "low"
}

function goalPriorityWeight(
  priority: AdvancedGoal["priority"],
): number {
  switch (priority) {
    case "high":
      return 90
    case "medium":
      return 45
    case "low":
    default:
      return 0
  }
}

function safeDeadline(
  value: string,
): Date | null {
  const date =
    new Date(value)

  return Number.isNaN(
    date.getTime(),
  )
    ? null
    : date
}

function buildSubjectAllocations(
  subjects: Subject[],
  sessions: StudySession[],
  weeklyGoal: number,
  startOfWeek: Date,
): SubjectAllocation[] {
  const subjectMinutesMap =
    new Map<string, number>()

  for (const session of sessions) {
    if (!session.completed) {
      continue
    }

    const timestamp =
      new Date(
        session.completedAt,
      ).getTime()

    if (
      timestamp <
      startOfWeek.getTime()
    ) {
      continue
    }

    const previous =
      subjectMinutesMap.get(
        session.subjectId,
      ) ?? 0

    subjectMinutesMap.set(
      session.subjectId,
      previous +
        Math.max(
          0,
          session.actualDuration,
        ) /
          60,
    )
  }

  const perSubjectWeeklyTarget =
    subjects.length > 0
      ? Math.round(
          weeklyGoal /
            subjects.length,
        )
      : 0

  return subjects.map(
    (subject) => {
      const completed =
        Math.round(
          subjectMinutesMap.get(
            subject.id,
          ) ?? 0,
        )

      const target =
        perSubjectWeeklyTarget

      const remaining =
        Math.max(
          0,
          target - completed,
        )

      const percent =
        target > 0
          ? Math.min(
              100,
              Math.round(
                (completed /
                  target) *
                  100,
              ),
            )
          : 0

      let status:
        SubjectAllocation["status"] =
          "on_track"

      if (percent >= 100) {
        status = "completed"
      } else if (
        percent < 40
      ) {
        status =
          "needs_attention"
      }

      return {
        subjectId:
          subject.id,
        subjectName:
          subject.name,
        subjectColor:
          subject.color,
        targetMinutes:
          target,
        completedMinutesThisWeek:
          completed,
        remainingMinutes:
          remaining,
        percent,
        status,
      }
    },
  )
}

function mergeCandidates(
  candidates: PlanCandidate[],
): PlanCandidate[] {
  const bySubject =
    new Map<
      string,
      PlanCandidate & {
        reasons:
          StudyPlanReason[]
      }
    >()

  for (const candidate of candidates) {
    if (
      candidate.minutes <= 0
    ) {
      continue
    }

    const existing =
      bySubject.get(
        candidate.subjectId,
      )

    if (!existing) {
      bySubject.set(
        candidate.subjectId,
        {
          ...candidate,
          minutes:
            Math.min(
              MAX_BLOCK_MINUTES,
              Math.max(
                1,
                Math.round(
                  candidate.minutes,
                ),
              ),
            ),
          reasons: [
            candidate.reasonCode,
          ],
        },
      )
      continue
    }

    existing.minutes =
      Math.min(
        MAX_BLOCK_MINUTES,
        Math.max(
          existing.minutes,
          Math.round(
            candidate.minutes,
          ),
        ),
      )

    if (
      !existing.reasons.includes(
        candidate.reasonCode,
      )
    ) {
      existing.reasons.push(
        candidate.reasonCode,
      )
    }

    if (
      candidate.score >
      existing.score
    ) {
      existing.score =
        candidate.score
      existing.reasonCode =
        candidate.reasonCode
      existing.routineContext =
        candidate.routineContext ??
        existing.routineContext
    } else if (
      !existing.routineContext &&
      candidate.routineContext
    ) {
      existing.routineContext =
        candidate.routineContext
    }
  }

  return Array.from(
    bySubject.values(),
  ).map(
    ({
      reasons: _reasons,
      ...candidate
    }) => candidate,
  )
}

function createPlan(
  input: StudyPlanInput,
): StudyPlan {
  const {
    sessions,
    subjects,
    weeklyGoal,
    dailyGoal = 60,
    routineItems = [],
    advancedGoals = [],
    now = new Date(),
  } = input

  const insights =
    getProductivityInsights(
      sessions,
      now,
    )

  const consistency =
    getConsistencyInsights(
      sessions,
      weeklyGoal,
      4,
      now,
    )

  const startOfToday =
    startOfLocalDay(now)

  const endOfToday =
    new Date(
      startOfToday,
    )

  endOfToday.setDate(
    endOfToday.getDate() + 1,
  )

  const startOfWeek =
    startOfLocalWeek(now)

  const todayMinutes =
    minutesInRange(
      sessions,
      startOfToday,
      endOfToday,
    )

  const weeklyCompletedMinutes =
    minutesInRange(
      sessions,
      startOfWeek,
    )

  const todayRemaining =
    Math.max(
      0,
      dailyGoal -
        todayMinutes,
    )

  const weeklyRemaining =
    Math.max(
      0,
      weeklyGoal -
        weeklyCompletedMinutes,
    )

  const subjectAllocations =
    buildSubjectAllocations(
      subjects,
      sessions,
      weeklyGoal,
      startOfWeek,
    )

  if (
    subjects.length === 0
  ) {
    return {
      generatedAt:
        now.toISOString(),
      totalPlannedTodayMinutes:
        0,
      todayCompletedMinutes:
        todayMinutes,
      todayRemainingMinutes:
        todayRemaining,
      weeklyTargetMinutes:
        weeklyGoal,
      weeklyCompletedMinutes,
      weeklyRemainingMinutes:
        weeklyRemaining,
      bestTime:
        insights.bestStudyTime
          ?.label ?? null,
      items: [],
      subjectAllocations,
      rationale:
        "Add a subject to build your first study plan.",
      priority: "low",
    }
  }

  const activeSubjectIds =
    new Set(
      subjects.map(
        (subject) =>
          subject.id,
      ),
    )

  const candidates:
    PlanCandidate[] = []

  for (
    const item of
      getRoutineItemsForDate(
        routineItems,
        now,
      )
  ) {
    if (
      !activeSubjectIds.has(
        item.subjectId,
      )
    ) {
      continue
    }

    const completed =
      getRoutineMinutesForDate(
        item,
        sessions,
        now,
      )

    const remaining =
      Math.max(
        0,
        item.targetMinutes -
          completed,
      )

    if (
      remaining <= 0
    ) {
      continue
    }

    candidates.push({
      subjectId:
        item.subjectId,
      minutes: remaining,
      score: 1000,
      reasonCode:
        "routine_due",
      routineContext: {
        itemId: item.id,
        routineDate:
          toRoutineDateKey(
            now,
          ),
      },
    })
  }

  for (
    const occurrence of
      getRecoverableRoutineOccurrences(
        routineItems,
        sessions,
        now,
      )
  ) {
    if (
      !activeSubjectIds.has(
        occurrence.item
          .subjectId,
      )
    ) {
      continue
    }

    candidates.push({
      subjectId:
        occurrence.item
          .subjectId,
      minutes:
        Math.min(
          45,
          occurrence.remainingMinutes,
        ),
      score: 900,
      reasonCode:
        "recovery_due",
      routineContext: {
        itemId:
          occurrence.item.id,
        routineDate:
          occurrence.dateKey,
      },
    })
  }

  const leastStudiedAllocation =
    [...subjectAllocations]
      .sort(
        (a, b) =>
          a.percent -
            b.percent ||
          a.subjectId.localeCompare(
            b.subjectId,
          ),
      )[0]

  for (
    const goal of
      advancedGoals
  ) {
    if (
      goal.status !==
      "active"
    ) {
      continue
    }

    const progress =
      getAdvancedGoalProgress(
        goal,
        sessions,
        now,
      )

    if (
      progress.completed ||
      progress.remainingMinutes <=
        0
    ) {
      continue
    }

    const subjectId =
      goal.subjectId &&
      activeSubjectIds.has(
        goal.subjectId,
      )
        ? goal.subjectId
        : leastStudiedAllocation
            ?.subjectId

    if (!subjectId) {
      continue
    }

    const deadline =
      safeDeadline(
        goal.deadline,
      )

    const daysRemaining =
      deadline
        ? Math.max(
            1,
            Math.ceil(
              (deadline.getTime() -
                startOfToday.getTime()) /
                86400000,
            ),
          )
        : 14

    const dailyPace =
      Math.max(
        1,
        Math.ceil(
          progress.remainingMinutes /
            daysRemaining,
        ),
      )

    const urgent =
      progress.overdue ||
      daysRemaining <= 3

    const reasonCode:
      StudyPlanReason =
        urgent
          ? "goal_deadline"
          : "goal_gap"

    const baseScore =
      urgent
        ? 800
        : 650

    const deadlineBoost =
      urgent
        ? Math.max(
            0,
            4 -
              Math.min(
                daysRemaining,
                4,
              ),
          ) * 15
        : Math.max(
            0,
            14 -
              Math.min(
                daysRemaining,
                14,
              ),
          )

    candidates.push({
      subjectId,
      minutes:
        Math.min(
          60,
          progress.remainingMinutes,
          Math.max(
            15,
            dailyPace,
          ),
        ),
      score:
        baseScore +
        goalPriorityWeight(
          goal.priority,
        ) +
        deadlineBoost,
      reasonCode,
    })
  }

  if (
    weeklyCompletedMinutes > 0
  ) {
    for (
      const allocation of
        subjectAllocations
    ) {
      if (
        allocation.status ===
        "completed"
      ) {
        continue
      }

      candidates.push({
        subjectId:
          allocation.subjectId,
        minutes: 25,
        score:
          400 +
          Math.max(
            0,
            100 -
              allocation.percent,
          ),
        reasonCode:
          "understudied",
      })
    }
  }

  if (
    candidates.length === 0
  ) {
    const fallback =
      leastStudiedAllocation ??
      subjectAllocations[0]

    if (fallback) {
      candidates.push({
        subjectId:
          fallback.subjectId,
        minutes:
          Math.min(
            45,
            Math.max(
              25,
              todayRemaining ||
                25,
            ),
          ),
        score: 200,
        reasonCode:
          "starter",
      })
    }
  }

  if (
    weeklyRemaining > 0
  ) {
    for (
      const candidate of
        candidates
    ) {
      candidate.score += 20
    }
  }

  const merged =
    mergeCandidates(
      candidates,
    ).sort(
      (a, b) =>
        b.score -
          a.score ||
        a.subjectId.localeCompare(
          b.subjectId,
        ),
    )

  const planBudget =
    Math.min(
      240,
      Math.max(
        60,
        dailyGoal,
      ),
    )

  const items:
    StudyPlanItem[] = []

  let plannedMinutes = 0

  for (
    const candidate of
      merged
  ) {
    if (
      items.length >=
      MAX_PLAN_BLOCKS
    ) {
      break
    }

    const remainingBudget =
      planBudget -
      plannedMinutes

    if (
      remainingBudget < 5
    ) {
      break
    }

    const subject =
      subjects.find(
        (item) =>
          item.id ===
          candidate.subjectId,
      )

    if (!subject) {
      continue
    }

    const minutes =
      Math.min(
        candidate.minutes,
        remainingBudget,
      )

    if (
      minutes <= 0
    ) {
      continue
    }

    const reasons =
      candidates
        .filter(
          (item) =>
            item.subjectId ===
            candidate.subjectId,
        )
        .sort(
          (a, b) =>
            b.score -
            a.score,
        )
        .map(
          (item) =>
            item.reasonCode,
        )
        .filter(
          (
            reason,
            index,
            all,
          ) =>
            all.indexOf(
              reason,
            ) === index,
        )

    items.push({
      subjectId:
        subject.id,
      subjectName:
        subject.name,
      subjectColor:
        subject.color,
      minutes,
      reason:
        reasonText(
          candidate.reasonCode,
        ),
      reasonCode:
        candidate.reasonCode,
      reasons,
      priority:
        priorityFromScore(
          candidate.score,
        ),
      priorityScore:
        candidate.score,
      todayCompletedMinutes:
        minutesInRange(
          sessions,
          startOfToday,
          endOfToday,
          subject.id,
        ),
      routineContext:
        candidate.routineContext,
    })

    plannedMinutes +=
      minutes
  }

  const main =
    items[0]

  return {
    generatedAt:
      now.toISOString(),
    totalPlannedTodayMinutes:
      plannedMinutes,
    todayCompletedMinutes:
      todayMinutes,
    todayRemainingMinutes:
      todayRemaining,
    weeklyTargetMinutes:
      weeklyGoal,
    weeklyCompletedMinutes,
    weeklyRemainingMinutes:
      weeklyRemaining,
    bestTime:
      insights.bestStudyTime
        ?.label ?? null,
    items,
    mainPrioritySubjectId:
      main?.subjectId,
    subjectAllocations,
    rationale:
      main
        ? reasonText(
            main.reasonCode,
          )
        : consistency.trend ===
              "declining"
          ? "Rebuild daily study momentum."
          : "You are caught up for now.",
    priority:
      main?.priority ??
      "low",
  }
}

export function getStudyPlan(
  input: StudyPlanInput,
): StudyPlan
export function getStudyPlan(
  sessions: StudySession[],
  subjects: Subject[],
  weeklyGoal: number,
  dailyGoal?: number,
): StudyPlan
export function getStudyPlan(
  inputOrSessions:
    | StudyPlanInput
    | StudySession[],
  subjects?: Subject[],
  weeklyGoal?: number,
  dailyGoal = 60,
): StudyPlan {
  if (
    Array.isArray(
      inputOrSessions,
    )
  ) {
    return createPlan({
      sessions:
        inputOrSessions,
      subjects:
        subjects ?? [],
      weeklyGoal:
        weeklyGoal ?? 0,
      dailyGoal,
    })
  }

  return createPlan(
    inputOrSessions,
  )
}
