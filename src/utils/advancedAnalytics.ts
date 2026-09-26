import type { StudySession } from '../types'

export interface AdvancedAnalytics {
  qualityScore: number
  qualityLabel:
    | 'Building'
    | 'Solid'
    | 'Strong'
    | 'Excellent'
  completionRate: number
  averageInterruptions: number
  deepWorkRatio: number
  checklistCompletion: number | null
  current7Minutes: number
  previous7Minutes: number
  momentumPercent: number
  current7ActiveDays: number
  previous7ActiveDays: number
  strongestWeekday: string | null
  strongestWeekdayMinutes: number
  headline: string
}

function startOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

function inRange(
  session: StudySession,
  start: Date,
  end: Date,
): boolean {
  const timestamp =
    new Date(
      session.completedAt,
    ).getTime()

  return (
    timestamp >= start.getTime() &&
    timestamp < end.getTime()
  )
}

function totalMinutes(
  sessions: StudySession[],
): number {
  return Math.round(
    sessions.reduce(
      (sum, session) =>
        sum +
        Math.max(
          0,
          session.actualDuration,
        ),
      0,
    ) / 60,
  )
}

function activeDays(
  sessions: StudySession[],
): number {
  const days = new Set<string>()

  sessions.forEach((session) => {
    if (
      !session.completed ||
      session.actualDuration <= 0
    ) {
      return
    }

    const date =
      new Date(
        session.completedAt,
      )

    days.add(
      `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
    )
  })

  return days.size
}

function percentChange(
  current: number,
  previous: number,
): number {
  if (previous > 0) {
    return Math.round(
      ((current - previous) /
        previous) *
        100,
    )
  }

  return current > 0
    ? 100
    : 0
}

function clamp(
  value: number,
): number {
  return Math.max(
    0,
    Math.min(100, value),
  )
}

export function getAdvancedAnalytics(
  sessions: StudySession[],
  now: Date = new Date(),
): AdvancedAnalytics {
  const today = startOfDay(now)

  const currentStart =
    new Date(today)
  currentStart.setDate(
    currentStart.getDate() - 6,
  )

  const currentEnd =
    new Date(today)
  currentEnd.setDate(
    currentEnd.getDate() + 1,
  )

  const previousStart =
    new Date(currentStart)
  previousStart.setDate(
    previousStart.getDate() - 7,
  )

  const recent30Start =
    new Date(today)
  recent30Start.setDate(
    recent30Start.getDate() - 29,
  )

  const current7 =
    sessions.filter(
      (session) =>
        session.completed &&
        inRange(
          session,
          currentStart,
          currentEnd,
        ),
    )

  const previous7 =
    sessions.filter(
      (session) =>
        session.completed &&
        inRange(
          session,
          previousStart,
          currentStart,
        ),
    )

  const recent30 =
    sessions.filter(
      (session) =>
        inRange(
          session,
          recent30Start,
          currentEnd,
        ),
    )

  const recent30Completed =
    recent30.filter(
      (session) =>
        session.completed &&
        session.actualDuration > 0,
    )

  const completionRate =
    recent30.length > 0
      ? Math.round(
          (recent30Completed.length /
            recent30.length) *
            100,
        )
      : 0

  const averageInterruptions =
    recent30Completed.length > 0
      ? Number(
          (
            recent30Completed.reduce(
              (sum, session) =>
                sum +
                Math.max(
                  0,
                  session.interruptions,
                ),
              0,
            ) /
            recent30Completed.length
          ).toFixed(1),
        )
      : 0

  const completedSeconds =
    recent30Completed.reduce(
      (sum, session) =>
        sum +
        Math.max(
          0,
          session.actualDuration,
        ),
      0,
    )

  const deepWorkSeconds =
    recent30Completed
      .filter(
        (session) =>
          session.actualDuration >=
          45 * 60,
      )
      .reduce(
        (sum, session) =>
          sum +
          Math.max(
            0,
            session.actualDuration,
          ),
        0,
      )

  const deepWorkRatio =
    completedSeconds > 0
      ? Math.round(
          (deepWorkSeconds /
            completedSeconds) *
            100,
        )
      : 0

  const checklistSessions =
    recent30Completed.filter(
      (session) =>
        (session.subtasks?.length ??
          0) > 0,
    )

  const checklistCompletion =
    checklistSessions.length > 0
      ? Math.round(
          checklistSessions.reduce(
            (sum, session) => {
              const tasks =
                session.subtasks ?? []
              const completed =
                tasks.filter(
                  (task) =>
                    task.completed,
                ).length

              return (
                sum +
                (completed /
                  tasks.length) *
                  100
              )
            },
            0,
          ) /
            checklistSessions.length,
        )
      : null

  const interruptionScore =
    clamp(
      100 -
        averageInterruptions *
          22,
    )

  const qualityScore =
    checklistCompletion === null
      ? Math.round(
          completionRate * 0.45 +
            interruptionScore *
              0.3 +
            deepWorkRatio * 0.25,
        )
      : Math.round(
          completionRate * 0.35 +
            interruptionScore *
              0.25 +
            deepWorkRatio * 0.25 +
            checklistCompletion *
              0.15,
        )

  const qualityLabel =
    qualityScore >= 85
      ? 'Excellent'
      : qualityScore >= 70
        ? 'Strong'
        : qualityScore >= 50
          ? 'Solid'
          : 'Building'

  const weekdayBuckets =
    new Map<
      number,
      number
    >()

  recent30Completed.forEach(
    (session) => {
      const weekday =
        new Date(
          session.completedAt,
        ).getDay()

      weekdayBuckets.set(
        weekday,
        (weekdayBuckets.get(
          weekday,
        ) ?? 0) +
          Math.max(
            0,
            session.actualDuration,
          ) /
            60,
      )
    },
  )

  const strongestEntry =
    [...weekdayBuckets.entries()]
      .sort(
        (
          [, a],
          [, b],
        ) => b - a,
      )[0]

  const weekdayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]

  const strongestWeekday =
    strongestEntry
      ? weekdayNames[
          strongestEntry[0]
        ]
      : null

  const strongestWeekdayMinutes =
    strongestEntry
      ? Math.round(
          strongestEntry[1],
        )
      : 0

  const current7Minutes =
    totalMinutes(current7)
  const previous7Minutes =
    totalMinutes(previous7)
  const momentumPercent =
    percentChange(
      current7Minutes,
      previous7Minutes,
    )

  const current7ActiveDays =
    activeDays(current7)
  const previous7ActiveDays =
    activeDays(previous7)

  let headline =
    'Build a larger study sample to unlock stronger patterns.'

  if (
    recent30Completed.length >= 3
  ) {
    if (
      momentumPercent >= 20 &&
      qualityScore >= 70
    ) {
      headline =
        'Your study volume and focus quality are moving together.'
    } else if (
      momentumPercent < -20
    ) {
      headline =
        'Your recent study volume has dropped; protect consistency before adding intensity.'
    } else if (
      averageInterruptions >= 2
    ) {
      headline =
        'Interruptions are the clearest constraint on your recent focus.'
    } else if (
      deepWorkRatio >= 50
    ) {
      headline =
        'A large share of your recent study time is reaching deep-work length.'
    } else {
      headline =
        'Your recent rhythm is stable; the next gain is better session depth and consistency.'
    }
  }

  return {
    qualityScore,
    qualityLabel,
    completionRate,
    averageInterruptions,
    deepWorkRatio,
    checklistCompletion,
    current7Minutes,
    previous7Minutes,
    momentumPercent,
    current7ActiveDays,
    previous7ActiveDays,
    strongestWeekday,
    strongestWeekdayMinutes,
    headline,
  }
}
