import type { StudySession } from '../types'
import type { RoutineItem } from '../storage/types'

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

export function getRotationItemForDate(
  items: RoutineItem[],
  date: Date,
): RoutineItem | null {
  const rotationItems = items
    .filter(
      (item) =>
        item.enabled &&
        item.mode === 'rotation',
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

  if (rotationItems.length === 0) {
    return null
  }

  const createdDates =
    rotationItems
      .map(
        (item) =>
          new Date(item.createdAt),
      )
      .filter(
        (value) =>
          !Number.isNaN(
            value.getTime(),
          ),
      )

  const anchor =
    createdDates.length > 0
      ? new Date(
          Math.min(
            ...createdDates.map(
              (value) =>
                startOfLocalDay(
                  value,
                ).getTime(),
            ),
          ),
        )
      : date

  const elapsedDays = Math.max(
    0,
    dayNumber(date) -
      dayNumber(anchor),
  )

  return rotationItems[
    elapsedDays %
      rotationItems.length
  ]
}

export function getRoutineItemsForDate(
  items: RoutineItem[],
  date: Date,
): RoutineItem[] {
  const fixed = items.filter(
    (item) =>
      item.enabled &&
      item.mode === 'fixed',
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

export function getRoutineMinutesForDate(
  item: RoutineItem,
  sessions: StudySession[],
  date: Date,
): number {
  const start =
    startOfLocalDay(date)
  const end =
    new Date(start)
  end.setDate(end.getDate() + 1)

  const seconds = sessions.reduce(
    (total, session) => {
      if (
        !session.completed ||
        session.subjectId !==
          item.subjectId
      ) {
        return total
      }

      const completedAt =
        new Date(
          session.completedAt,
        )

      if (
        completedAt < start ||
        completedAt >= end
      ) {
        return total
      }

      return (
        total +
        Math.max(
          0,
          session.actualDuration,
        )
      )
    },
    0,
  )

  return Math.floor(seconds / 60)
}

export type RoutineStatus =
  | 'done'
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
        candidate.id === item.id,
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
    minutes >= item.targetMinutes
  ) {
    return 'done'
  }

  return dayNumber(date) <
    dayNumber(now)
    ? 'missed'
    : 'pending'
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
