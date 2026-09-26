import type { StudySession } from '../types'
import type { RoutineItem } from '../storage/types'

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]

function startOfLocalDay(
  date: Date,
): Date {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

function dayNumber(date: Date): number {
  return Math.floor(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    ) / 86400000,
  )
}

function sameLocalDay(
  first: Date,
  second: Date,
): boolean {
  return (
    first.getFullYear() ===
      second.getFullYear() &&
    first.getMonth() ===
      second.getMonth() &&
    first.getDate() ===
      second.getDate()
  )
}

function routineDays(
  item: RoutineItem,
): number[] {
  const days = Array.from(
    new Set(
      (item.daysOfWeek ?? ALL_DAYS)
        .filter(
          (day) =>
            Number.isInteger(day) &&
            day >= 0 &&
            day <= 6,
        ),
    ),
  )

  return days.length > 0
    ? days
    : ALL_DAYS
}

function itemExistsOnDate(
  item: RoutineItem,
  date: Date,
): boolean {
  const createdAt =
    new Date(item.createdAt)

  return (
    !Number.isNaN(
      createdAt.getTime(),
    ) &&
    dayNumber(createdAt) <=
      dayNumber(date)
  )
}

function itemAllowsDate(
  item: RoutineItem,
  date: Date,
): boolean {
  return (
    item.enabled &&
    itemExistsOnDate(
      item,
      date,
    ) &&
    routineDays(item).includes(
      date.getDay(),
    )
  )
}

export function toRoutineDateKey(
  date: Date,
): string {
  const year =
    date.getFullYear()
  const month =
    String(
      date.getMonth() + 1,
    ).padStart(2, '0')
  const day =
    String(
      date.getDate(),
    ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function getRotationItemForDate(
  items: RoutineItem[],
  date: Date,
): RoutineItem | null {
  const target =
    startOfLocalDay(date)

  const rotationItems = items
    .filter(
      (item) =>
        item.enabled &&
        item.mode ===
          'rotation' &&
        itemExistsOnDate(
          item,
          target,
        ),
    )
    .sort(
      (a, b) =>
        a.rotationOrder -
          b.rotationOrder ||
        a.createdAt.localeCompare(
          b.createdAt,
        ) ||
        a.id.localeCompare(b.id),
    )

  if (
    rotationItems.length === 0
  ) {
    return null
  }

  const validCreatedDates =
    rotationItems
      .map(
        (item) =>
          new Date(
            item.createdAt,
          ),
      )
      .filter(
        (value) =>
          !Number.isNaN(
            value.getTime(),
          ),
      )

  if (
    validCreatedDates.length === 0
  ) {
    return null
  }

  const anchor =
    startOfLocalDay(
      new Date(
        Math.min(
          ...validCreatedDates.map(
            (value) =>
              value.getTime(),
          ),
        ),
      ),
    )

  if (
    dayNumber(target) <
    dayNumber(anchor)
  ) {
    return null
  }

  let step = 0
  const cursor =
    new Date(anchor)

  while (
    dayNumber(cursor) <=
    dayNumber(target)
  ) {
    const eligible =
      rotationItems.filter(
        (item) =>
          itemAllowsDate(
            item,
            cursor,
          ),
      )

    if (eligible.length > 0) {
      const selected =
        eligible[
          step %
            eligible.length
        ]

      if (
        sameLocalDay(
          cursor,
          target,
        )
      ) {
        return selected
      }

      step += 1
    }

    cursor.setDate(
      cursor.getDate() + 1,
    )
  }

  return null
}

export function getRoutineItemsForDate(
  items: RoutineItem[],
  date: Date,
): RoutineItem[] {
  const fixed = items.filter(
    (item) =>
      item.mode === 'fixed' &&
      itemAllowsDate(
        item,
        date,
      ),
  )

  const rotation =
    getRotationItemForDate(
      items,
      date,
    )

  return rotation
    ? [...fixed, rotation]
    : fixed
}

function getCountedSessions(
  item: RoutineItem,
  sessions: StudySession[],
  date: Date,
): StudySession[] {
  const key =
    toRoutineDateKey(date)
  const start =
    startOfLocalDay(date)
  const end =
    new Date(start)
  end.setDate(
    end.getDate() + 1,
  )

  return sessions.filter(
    (session) => {
      if (
        !session.completed
      ) {
        return false
      }

      if (
        session.routineItemId ===
          item.id &&
        session.routineDate === key
      ) {
        return true
      }

      if (
        session.routineItemId ||
        session.routineDate
      ) {
        return false
      }

      if (
        session.subjectId !==
        item.subjectId
      ) {
        return false
      }

      const completedAt =
        new Date(
          session.completedAt,
        )

      return (
        completedAt >= start &&
        completedAt < end
      )
    },
  )
}

export function getRoutineMinutesForDate(
  item: RoutineItem,
  sessions: StudySession[],
  date: Date,
): number {
  const seconds =
    getCountedSessions(
      item,
      sessions,
      date,
    ).reduce(
      (total, session) =>
        total +
        Math.max(
          0,
          session.actualDuration,
        ),
      0,
    )

  return Math.floor(
    seconds / 60,
  )
}

function wasRecoveredLater(
  item: RoutineItem,
  sessions: StudySession[],
  date: Date,
): boolean {
  const key =
    toRoutineDateKey(date)
  const targetDay =
    dayNumber(date)

  return getCountedSessions(
    item,
    sessions,
    date,
  ).some(
    (session) =>
      session.routineItemId ===
        item.id &&
      session.routineDate ===
        key &&
      dayNumber(
        new Date(
          session.completedAt,
        ),
      ) > targetDay,
  )
}

export type RoutineStatus =
  | 'done'
  | 'recovered'
  | 'recoverable'
  | 'pending'
  | 'missed'
  | 'off'

export function getRoutineStatus(
  item: RoutineItem,
  items: RoutineItem[],
  sessions: StudySession[],
  date: Date,
  now = new Date(),
): RoutineStatus {
  const scheduled =
    getRoutineItemsForDate(
      items,
      date,
    ).some(
      (candidate) =>
        candidate.id ===
        item.id,
    )

  if (!scheduled) {
    return 'off'
  }

  const minutes =
    getRoutineMinutesForDate(
      item,
      sessions,
      date,
    )

  if (
    minutes >=
    item.targetMinutes
  ) {
    return wasRecoveredLater(
      item,
      sessions,
      date,
    )
      ? 'recovered'
      : 'done'
  }

  const daysLate =
    dayNumber(now) -
    dayNumber(date)

  if (daysLate <= 0) {
    return 'pending'
  }

  const recoveryDays =
    Math.max(
      0,
      Math.min(
        3,
        Math.round(
          item.recoveryDays ?? 1,
        ),
      ),
    )

  return daysLate <=
    recoveryDays
    ? 'recoverable'
    : 'missed'
}

export interface RecoverableRoutineOccurrence {
  item: RoutineItem
  date: Date
  dateKey: string
  remainingMinutes: number
}

export function getRecoverableRoutineOccurrences(
  items: RoutineItem[],
  sessions: StudySession[],
  now = new Date(),
): RecoverableRoutineOccurrence[] {
  const maxRecoveryDays =
    items.reduce(
      (max, item) =>
        Math.max(
          max,
          Math.max(
            0,
            Math.min(
              3,
              Math.round(
                item.recoveryDays ??
                  1,
              ),
            ),
          ),
        ),
      0,
    )

  const results: RecoverableRoutineOccurrence[] =
    []

  for (
    let daysAgo = 1;
    daysAgo <=
    maxRecoveryDays;
    daysAgo += 1
  ) {
    const date =
      startOfLocalDay(now)

    date.setDate(
      date.getDate() -
        daysAgo,
    )

    for (
      const item of
        getRoutineItemsForDate(
          items,
          date,
        )
    ) {
      if (
        getRoutineStatus(
          item,
          items,
          sessions,
          date,
          now,
        ) !== 'recoverable'
      ) {
        continue
      }

      results.push({
        item,
        date,
        dateKey:
          toRoutineDateKey(
            date,
          ),
        remainingMinutes:
          Math.max(
            1,
            item.targetMinutes -
              getRoutineMinutesForDate(
                item,
                sessions,
                date,
              ),
          ),
      })
    }
  }

  return results
}

export interface RoutineStreakStats {
  current: number
  best: number
  recovered: number
  atRisk: boolean
}

function routineDayState(
  items: RoutineItem[],
  sessions: StudySession[],
  date: Date,
  now: Date,
):
  | 'off'
  | 'complete'
  | 'open'
  | 'missed' {
  const scheduled =
    getRoutineItemsForDate(
      items,
      date,
    )

  if (
    scheduled.length === 0
  ) {
    return 'off'
  }

  const statuses =
    scheduled.map(
      (item) =>
        getRoutineStatus(
          item,
          items,
          sessions,
          date,
          now,
        ),
    )

  if (
    statuses.every(
      (status) =>
        status === 'done' ||
        status ===
          'recovered',
    )
  ) {
    return 'complete'
  }

  if (
    statuses.some(
      (status) =>
        status === 'missed',
    )
  ) {
    return 'missed'
  }

  return 'open'
}

export function getRoutineStreakStats(
  items: RoutineItem[],
  sessions: StudySession[],
  now = new Date(),
): RoutineStreakStats {
  if (items.length === 0) {
    return {
      current: 0,
      best: 0,
      recovered: 0,
      atRisk: false,
    }
  }

  const today =
    startOfLocalDay(now)
  const earliestCreated =
    items
      .map(
        (item) =>
          new Date(
            item.createdAt,
          ),
      )
      .filter(
        (date) =>
          !Number.isNaN(
            date.getTime(),
          ),
      )
      .reduce<Date | null>(
        (earliest, date) =>
          !earliest ||
          date < earliest
            ? date
            : earliest,
        null,
      )

  const floorDate =
    startOfLocalDay(
      earliestCreated ??
        today,
    )
  const maxHistoryStart =
    new Date(today)
  maxHistoryStart.setDate(
    maxHistoryStart.getDate() -
      365,
  )

  const historyStart =
    floorDate >
    maxHistoryStart
      ? floorDate
      : maxHistoryStart

  let best = 0
  let running = 0
  let recovered = 0

  const cursor =
    new Date(historyStart)

  while (
    dayNumber(cursor) <=
    dayNumber(today)
  ) {
    const state =
      routineDayState(
        items,
        sessions,
        cursor,
        now,
      )

    if (
      state === 'complete'
    ) {
      running += 1
      best = Math.max(
        best,
        running,
      )

      for (
        const item of
          getRoutineItemsForDate(
            items,
            cursor,
          )
      ) {
        if (
          getRoutineStatus(
            item,
            items,
            sessions,
            cursor,
            now,
          ) === 'recovered'
        ) {
          recovered += 1
        }
      }
    } else if (
      state === 'missed'
    ) {
      running = 0
    }

    cursor.setDate(
      cursor.getDate() + 1,
    )
  }

  let current = 0
  let atRisk = false
  const reverse =
    new Date(today)
  let firstScheduledDay = true

  for (
    let inspected = 0;
    inspected <= 365;
    inspected += 1
  ) {
    const state =
      routineDayState(
        items,
        sessions,
        reverse,
        now,
      )

    if (state === 'off') {
      reverse.setDate(
        reverse.getDate() - 1,
      )
      continue
    }

    if (
      firstScheduledDay &&
      sameLocalDay(
        reverse,
        today,
      ) &&
      state === 'open'
    ) {
      firstScheduledDay = false
      reverse.setDate(
        reverse.getDate() - 1,
      )
      continue
    }

    firstScheduledDay = false

    if (
      state === 'complete'
    ) {
      current += 1
    } else if (
      state === 'open'
    ) {
      atRisk = true
    } else if (
      state === 'missed'
    ) {
      break
    }

    reverse.setDate(
      reverse.getDate() - 1,
    )

    if (
      dayNumber(reverse) <
      dayNumber(historyStart)
    ) {
      break
    }
  }

  return {
    current,
    best,
    recovered,
    atRisk,
  }
}

export function getRecentRoutineDates(
  days = 7,
  now = new Date(),
): Date[] {
  return Array.from(
    { length: days },
    (_, index) => {
      const date =
        startOfLocalDay(now)
      date.setDate(
        date.getDate() -
          (days - 1 - index),
      )
      return date
    },
  )
}
