import {
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ListChecks,
} from 'lucide-react'
import {
  useMemo,
  useState,
} from 'react'
import type {
  StudySession,
} from '../types'
import PageContainer from './PageContainer'
import PageHeader from '../components/layout/PageHeader'
import {
  useI18n,
} from '../useI18n'

interface HistoryPageProps {
  sessions: StudySession[]
}

function dayKey(
  date: Date,
): string {
  const year =
    date.getFullYear()
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0')
  const day = String(
    date.getDate(),
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function durationLabel(
  seconds: number,
): string {
  const totalMinutes =
    Math.round(
      Math.max(
        0,
        seconds,
      ) / 60,
    )

  if (totalMinutes < 60) {
    return `${totalMinutes}m`
  }

  const hours =
    Math.floor(
      totalMinutes / 60,
    )
  const minutes =
    totalMinutes % 60

  return minutes > 0
    ? `${hours}h ${minutes}m`
    : `${hours}h`
}

function sessionTime(
  date: Date,
  locale: string,
): string {
  return date.toLocaleTimeString(
    locale,
    {
      hour: '2-digit',
      minute: '2-digit',
    },
  )
}

function checklistProgress(
  session: StudySession,
): string | null {
  const tasks =
    session.subtasks ?? []

  if (tasks.length === 0) {
    return null
  }

  const completed =
    tasks.filter(
      (task) =>
        task.completed,
    ).length

  return `${completed}/${tasks.length}`
}

export default function HistoryPage({
  sessions,
}: HistoryPageProps) {
  const { language, tr } =
    useI18n()

  const locale =
    language === 'ku'
      ? 'ku-IQ'
      : 'en-US'

  const [visibleMonth, setVisibleMonth] =
    useState(() => {
      const now = new Date()

      return new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      )
    })

  const [selectedDay, setSelectedDay] =
    useState(() =>
      dayKey(
        new Date(),
      ),
    )

  const completedSessions =
    useMemo(
      () =>
        sessions.filter(
          (session) =>
            session.completed &&
            session.actualDuration >
              0,
        ),
      [sessions],
    )

  const sessionsByDay =
    useMemo(() => {
      const map =
        new Map<
          string,
          StudySession[]
        >()

      completedSessions.forEach(
        (session) => {
          const key =
            dayKey(
              new Date(
                session.completedAt,
              ),
            )

          map.set(
            key,
            [
              ...(map.get(key) ??
                []),
              session,
            ],
          )
        },
      )

      for (const [
        key,
        value,
      ] of map) {
        map.set(
          key,
          [...value].sort(
            (a, b) =>
              new Date(
                a.completedAt,
              ).getTime() -
              new Date(
                b.completedAt,
              ).getTime(),
          ),
        )
      }

      return map
    }, [completedSessions])

  const calendarDays =
    useMemo(() => {
      const year =
        visibleMonth.getFullYear()
      const month =
        visibleMonth.getMonth()

      const first =
        new Date(
          year,
          month,
          1,
        )
      const totalDays =
        new Date(
          year,
          month + 1,
          0,
        ).getDate()

      const mondayOffset =
        (first.getDay() +
          6) %
        7

      const cells: Array<
        Date | null
      > = Array.from(
        {
          length:
            mondayOffset,
        },
        () => null,
      )

      for (
        let day = 1;
        day <= totalDays;
        day += 1
      ) {
        cells.push(
          new Date(
            year,
            month,
            day,
          ),
        )
      }

      while (
        cells.length %
          7 !==
        0
      ) {
        cells.push(null)
      }

      return cells
    }, [visibleMonth])

  const monthSessions =
    useMemo(
      () =>
        completedSessions.filter(
          (session) => {
            const date =
              new Date(
                session.completedAt,
              )

            return (
              date.getFullYear() ===
                visibleMonth.getFullYear() &&
              date.getMonth() ===
                visibleMonth.getMonth()
            )
          },
        ),
      [
        completedSessions,
        visibleMonth,
      ],
    )

  const monthSeconds =
    monthSessions.reduce(
      (sum, session) =>
        sum +
        session.actualDuration,
      0,
    )

  const monthActiveDays =
    new Set(
      monthSessions.map(
        (session) =>
          dayKey(
            new Date(
              session.completedAt,
            ),
          ),
      ),
    ).size

  const maxDaySeconds =
    Math.max(
      1,
      ...calendarDays
        .filter(
          (
            value,
          ): value is Date =>
            value !== null,
        )
        .map((date) =>
          (
            sessionsByDay.get(
              dayKey(date),
            ) ?? []
          ).reduce(
            (
              sum,
              session,
            ) =>
              sum +
              session.actualDuration,
            0,
          ),
        ),
    )

  const selectedSessions =
    sessionsByDay.get(
      selectedDay,
    ) ?? []

  const selectedSeconds =
    selectedSessions.reduce(
      (sum, session) =>
        sum +
        session.actualDuration,
      0,
    )

  const selectedDate =
    new Date(
      `${selectedDay}T00:00:00`,
    )

  const monthLabel =
    visibleMonth.toLocaleDateString(
      locale,
      {
        month: 'long',
        year: 'numeric',
      },
    )

  const weekdayLabels =
    Array.from(
      { length: 7 },
      (_, index) =>
        new Date(
          2024,
          0,
          index + 1,
        ).toLocaleDateString(
          locale,
          {
            weekday: 'short',
          },
        ),
    )

  const moveMonth = (
    amount: number,
  ) => {
    setVisibleMonth(
      (current) => {
        const next =
          new Date(
            current.getFullYear(),
            current.getMonth() +
              amount,
            1,
          )

        setSelectedDay(
          dayKey(next),
        )

        return next
      },
    )
  }

  const jumpToday = () => {
    const now =
      new Date()

    setVisibleMonth(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      ),
    )
    setSelectedDay(
      dayKey(now),
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title={tr('Study History', 'مێژووی خوێندن')}
        description="See how your study rhythm changes over time, then open any day to understand what happened."
      />

      <section className="history-overview">
        <article className="glass-panel history-summary-card">
          <CalendarDays
            size={18}
          />
          <span>
            {tr('Month focus', 'سەرنجی مانگ')}
          </span>
          <strong>
            {durationLabel(
              monthSeconds,
            )}
          </strong>
        </article>

        <article className="glass-panel history-summary-card">
          <CheckCircle2
            size={18}
          />
          <span>
            {tr('Active days', 'ڕۆژە چالاکەکان')}
          </span>
          <strong>
            {monthActiveDays}
          </strong>
        </article>

        <article className="glass-panel history-summary-card">
          <BookOpenCheck
            size={18}
          />
          <span>
            {tr('Sessions', 'سێشنەکان')}
          </span>
          <strong>
            {
              monthSessions.length
            }
          </strong>
        </article>
      </section>

      <div className="history-layout">
        <section className="glass-panel history-calendar-panel">
          <div className="history-calendar-head">
            <div>
              <div className="eyebrow">
                Focus calendar
              </div>
              <h2>
                {monthLabel}
              </h2>
            </div>

            <div className="history-month-controls">
              <button
                type="button"
                onClick={() =>
                  moveMonth(-1)
                }
                aria-label={tr('Previous month', 'مانگی پێشوو')}
              >
                <ChevronLeft
                  size={17}
                />
              </button>

              <button
                type="button"
                onClick={
                  jumpToday
                }
              >
                Today
              </button>

              <button
                type="button"
                onClick={() =>
                  moveMonth(1)
                }
                aria-label={tr('Next month', 'مانگی داهاتوو')}
              >
                <ChevronRight
                  size={17}
                />
              </button>
            </div>
          </div>

          <div className="history-calendar">
            {weekdayLabels.map(
              (label) => (
                <div
                  key={label}
                  className="history-weekday"
                >
                  {label}
                </div>
              ),
            )}

            {calendarDays.map(
              (date, index) => {
                if (!date) {
                  return (
                    <div
                      key={
                        'empty-' +
                        index
                      }
                      className="history-day empty"
                    />
                  )
                }

                const key =
                  dayKey(date)
                const daySessions =
                  sessionsByDay.get(
                    key,
                  ) ?? []

                const seconds =
                  daySessions.reduce(
                    (
                      sum,
                      session,
                    ) =>
                      sum +
                      session.actualDuration,
                    0,
                  )

                const intensity =
                  seconds > 0
                    ? Math.max(
                        0.12,
                        seconds /
                          maxDaySeconds,
                      )
                    : 0

                const isSelected =
                  key ===
                  selectedDay

                const isToday =
                  key ===
                  dayKey(
                    new Date(),
                  )

                return (
                  <button
                    key={key}
                    type="button"
                    className={[
                      'history-day',
                      isSelected
                        ? 'selected'
                        : '',
                      isToday
                        ? 'today'
                        : '',
                    ]
                      .filter(
                        Boolean,
                      )
                      .join(' ')}
                    onClick={() =>
                      setSelectedDay(
                        key,
                      )
                    }
                    aria-label={
                      `${date.toLocaleDateString(
                        locale,
                      )}, ${durationLabel(
                        seconds,
                      )}, ${daySessions.length} sessions`
                    }
                  >
                    <div className="history-day-top">
                      <span>
                        {
                          date.getDate()
                        }
                      </span>

                      {isToday && (
                        <small>
                          {tr('Today', 'ئەمڕۆ')}
                        </small>
                      )}
                    </div>

                    <div
                      className="history-heat"
                      style={{
                        opacity:
                          intensity,
                      }}
                    />

                    {seconds >
                      0 && (
                      <div className="history-day-data">
                        <strong>
                          {durationLabel(
                            seconds,
                          )}
                        </strong>
                        <span>
                          {
                            daySessions.length
                          }{' '}
                          session
                          {daySessions.length ===
                          1
                            ? ''
                            : ''}
                        </span>
                      </div>
                    )}
                  </button>
                )
              },
            )}
          </div>

          <div className="history-legend">
            <span>
              {tr('Less focus', 'سەرنجی کەمتر')}
            </span>
            {[0.15, 0.35, 0.6, 0.9].map(
              (opacity) => (
                <i
                  key={
                    opacity
                  }
                  style={{
                    opacity,
                  }}
                />
              ),
            )}
            <span>
              {tr('More focus', 'سەرنجی زیاتر')}
            </span>
          </div>
        </section>

        <aside className="glass-panel history-day-panel">
          <div className="history-day-head">
            <div>
              <div className="eyebrow">
                {tr('Selected day', 'ڕۆژی هەڵبژێردراو')}
              </div>
              <h2>
                {selectedDate.toLocaleDateString(
                  locale,
                  {
                    weekday:
                      'long',
                    month:
                      'short',
                    day:
                      'numeric',
                  },
                )}
              </h2>
            </div>

            <div className="history-day-total">
              <Clock3
                size={15}
              />
              {durationLabel(
                selectedSeconds,
              )}
            </div>
          </div>

          {selectedSessions.length ===
          0 ? (
            <div className="history-empty-state">
              Nothing was recorded here. Choose another day or complete a focus session to add history.
            </div>
          ) : (
            <div className="history-session-list">
              {selectedSessions.map(
                (session) => {
                  const checklist =
                    checklistProgress(
                      session,
                    )

                  return (
                    <article
                      key={
                        session.id
                      }
                      className="history-session-card"
                    >
                      <div className="history-session-title">
                        <span
                          style={{
                            background:
                              session.subjectColor,
                          }}
                        />
                        <strong>
                          {
                            session.subjectName
                          }
                        </strong>
                        <time>
                          {sessionTime(
                            new Date(
                              session.completedAt,
                            ),
                            locale,
                          )}
                        </time>
                      </div>

                      <div className="history-session-metrics">
                        <span>
                          {durationLabel(
                            session.actualDuration,
                          )}
                        </span>

                        <span>
                          {
                            session.interruptions
                          }{' '}
                          {tr('interruption', 'وەستاندن')}
                          {session.interruptions ===
                          1
                            ? ''
                            : ''}
                        </span>

                        {checklist && (
                          <span>
                            <ListChecks
                              size={12}
                            />
                            {checklist}{' '}
                            {tr('steps', 'هەنگاو')}
                          </span>
                        )}
                      </div>

                      {session.notes?.trim() && (
                        <p className="history-session-note">
                          {session.notes.trim()}
                        </p>
                      )}

                      {(session.subtasks
                        ?.length ??
                        0) > 0 && (
                        <div className="history-session-checklist">
                          {session.subtasks
                            ?.slice(
                              0,
                              4,
                            )
                            .map(
                              (
                                task,
                              ) => (
                                <div
                                  key={
                                    task.id
                                  }
                                  className={
                                    task.completed
                                      ? 'complete'
                                      : ''
                                  }
                                >
                                  <CheckCircle2
                                    size={12}
                                  />
                                  <span>
                                    {
                                      task.text
                                    }
                                  </span>
                                </div>
                              ),
                            )}
                        </div>
                      )}
                    </article>
                  )
                },
              )}
            </div>
          )}
        </aside>
      </div>
    </PageContainer>
  )
}
