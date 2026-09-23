import { useMemo, useState } from 'react'
import type { StudySession } from '../types'
import PageContainer from './PageContainer'
import PageHeader from '../components/layout/PageHeader'
import { useI18n } from '../useI18n'

interface HistoryPageProps {
  sessions: StudySession[]
}

function dayKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatDurationSeconds(seconds: number): string {
  const safeSeconds = Math.max(
    0,
    Math.round(seconds),
  )

  if (safeSeconds < 60) {
    return `${safeSeconds}s`
  }

  const totalMinutes = Math.floor(
    safeSeconds / 60,
  )

  const remainingSeconds =
    safeSeconds % 60

  if (totalMinutes < 60) {
    return remainingSeconds > 0
      ? `${totalMinutes}m ${remainingSeconds}s`
      : `${totalMinutes}m`
  }

  const hours = Math.floor(
    totalMinutes / 60,
  )

  const minutesRemaining =
    totalMinutes % 60

  if (
    minutesRemaining === 0 &&
    remainingSeconds === 0
  ) {
    return `${hours}h`
  }

  if (remainingSeconds === 0) {
    return `${hours}h ${minutesRemaining}m`
  }

  return `${hours}h ${minutesRemaining}m ${remainingSeconds}s`
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function HistoryPage({
  sessions,
}: HistoryPageProps) {
  const { language } = useI18n()

  const locale =
    language === 'ku'
      ? 'ku-IQ'
      : 'en-US'

  const [visibleMonth, setVisibleMonth] = useState(
    () => {
      const now = new Date()
      return new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      )
    },
  )

  const [selectedDay, setSelectedDay] = useState(
    () => dayKey(new Date()),
  )

  const completedSessions = useMemo(
    () =>
      sessions.filter(
        (session) => session.completed,
      ),
    [sessions],
  )

  const sessionsByDay = useMemo(() => {
    const map = new Map<
      string,
      StudySession[]
    >()

    for (const session of completedSessions) {
      const key = dayKey(
        new Date(session.completedAt),
      )

      const existing = map.get(key) ?? []
      existing.push(session)
      map.set(key, existing)
    }

    return map
  }, [completedSessions])

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear()
    const month = visibleMonth.getMonth()

    const firstDay = new Date(
      year,
      month,
      1,
    )

    const lastDay = new Date(
      year,
      month + 1,
      0,
    )

    // Monday = 0 ... Sunday = 6
    const mondayOffset =
      (firstDay.getDay() + 6) % 7

    const totalDays =
      lastDay.getDate()

    const cells: Array<
      Date | null
    > = []

    for (
      let i = 0;
      i < mondayOffset;
      i += 1
    ) {
      cells.push(null)
    }

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

    while (cells.length % 7 !== 0) {
      cells.push(null)
    }

    return cells
  }, [visibleMonth])

  const selectedSessions =
    sessionsByDay.get(selectedDay) ?? []

  const selectedSeconds =
    selectedSessions.reduce(
      (total, session) =>
        total +
        Math.max(
          0,
          session.actualDuration,
        ),
      0,
    )

  const monthlySeconds =
    completedSessions
      .filter((session) => {
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
      })
      .reduce(
        (total, session) =>
          total +
          Math.max(
            0,
            session.actualDuration,
          ),
        0,
      )

  const selectedDate = new Date(
    `${selectedDay}T00:00:00`,
  )

  const previousMonth = () => {
    setVisibleMonth((current) => {
      const next = new Date(
        current.getFullYear(),
        current.getMonth() - 1,
        1,
      )
      setSelectedDay(dayKey(next))
      return next
    })
  }

  const nextMonth = () => {
    setVisibleMonth((current) => {
      const next = new Date(
        current.getFullYear(),
        current.getMonth() + 1,
        1,
      )
      setSelectedDay(dayKey(next))
      return next
    })
  }

  const today = () => {
    const now = new Date()
    setVisibleMonth(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      ),
    )
    setSelectedDay(dayKey(now))
  }

  const monthLabel =
    visibleMonth.toLocaleDateString(
      locale,
      {
        month: 'long',
        year: 'numeric',
      },
    )

  const weekdayLabels = Array.from(
    { length: 7 },
    (_, index) =>
      new Date(
        2024,
        0,
        1 + index,
      ).toLocaleDateString(
        locale,
        {
          weekday: 'short',
        },
      ),
  )

  return (
    <PageContainer>
      <PageHeader
        title="Study History"
        description="Review your study activity day by day."
      />

      <div
        className="glass-panel"
        style={{
          padding: '20px',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '18px',
          }}
        >
          <div>
            <div
              style={{
                color:
                  'var(--text-primary)',
                fontSize: '18px',
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            >
              {monthLabel}
            </div>

            <div
              style={{
                color:
                  'var(--text-muted)',
                fontSize: '10px',
                marginTop: '4px',
              }}
            >
              {formatDurationSeconds(
                monthlySeconds,
              )}{' '}
              studied this month
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '8px',
            }}
          >
            <button
              className="cyber-btn"
              type="button"
              onClick={previousMonth}
            >
              ←
            </button>

            <button
              className="cyber-btn"
              type="button"
              onClick={today}
            >
              TODAY
            </button>

            <button
              className="cyber-btn"
              type="button"
              onClick={nextMonth}
            >
              →
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(7, minmax(0, 1fr))',
            gap: '6px',
          }}
        >
          {weekdayLabels.map(
            (label) => (
              <div
                key={label}
                style={{
                  color:
                    'var(--text-muted)',
                  fontSize: '9px',
                  textAlign: 'center',
                  padding:
                    '6px 2px',
                  textTransform:
                    'uppercase',
                }}
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
                    key={`empty-${index}`}
                    style={{
                      minHeight:
                        '68px',
                    }}
                  />
                )
              }

              const key =
                dayKey(date)

              const daySessions =
                sessionsByDay.get(
                  key,
                ) ?? []

              const minutes =
                daySessions.reduce(
                  (
                    total,
                    session,
                  ) =>
                    total +
                    Math.max(
                      0,
                      Math.round(
                        session.actualDuration ||
                          session.duration ||
                          0,
                      ),
                    ),
                  0,
                )

              const selected =
                key === selectedDay

              const isToday =
                key ===
                dayKey(new Date())

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    setSelectedDay(
                      key,
                    )
                  }
                  style={{
                    minHeight:
                      '68px',
                    borderRadius:
                      '10px',
                    border: selected
                      ? '1px solid var(--primary-glow)'
                      : '1px solid var(--void-border)',
                    background:
                      selected
                        ? 'var(--void-surface-hover)'
                        : 'transparent',
                    color:
                      'var(--text-primary)',
                    cursor:
                      'pointer',
                    padding:
                      '8px',
                    textAlign:
                      'left',
                  }}
                >
                  <div
                    style={{
                      display:
                        'flex',
                      justifyContent:
                        'space-between',
                      gap: '4px',
                    }}
                  >
                    <span
                      style={{
                        fontSize:
                          '11px',
                        fontWeight:
                          isToday
                            ? 700
                            : 400,
                      }}
                    >
                      {date.getDate()}
                    </span>

                    {isToday && (
                      <span
                        style={{
                          color:
                            'var(--primary-glow)',
                          fontSize:
                            '8px',
                        }}
                      >
                        TODAY
                      </span>
                    )}
                  </div>

                  {daySessions.length >
                    0 && (
                    <>
                      <div
                        style={{
                          color:
                            'var(--primary-glow)',
                          fontSize:
                            '11px',
                          marginTop:
                            '11px',
                          fontFamily:
                            'Orbitron, sans-serif',
                        }}
                      >
                        {formatDurationSeconds(
                          minutes,
                        )}
                      </div>

                      <div
                        style={{
                          color:
                            'var(--text-muted)',
                          fontSize:
                            '8px',
                          marginTop:
                            '3px',
                        }}
                      >
                        {
                          daySessions.length
                        }{' '}
                        session
                        {daySessions.length ===
                        1
                          ? ''
                          : 's'}
                      </div>
                    </>
                  )}
                </button>
              )
            },
          )}
        </div>
      </div>

      <div
        className="glass-panel"
        style={{
          padding: '20px',
        }}
      >
        <div
          style={{
            display:
              'flex',
            justifyContent:
              'space-between',
            gap: '12px',
            alignItems:
              'flex-start',
            marginBottom:
              '16px',
          }}
        >
          <div>
            <div
              style={{
                color:
                  'var(--text-primary)',
                fontSize: '16px',
                fontWeight: 600,
              }}
            >
              {selectedDate.toLocaleDateString(
                locale,
                {
                  weekday:
                    'long',
                  month:
                    'long',
                  day:
                    'numeric',
                  year:
                    'numeric',
                },
              )}
            </div>

            <div
              style={{
                color:
                  'var(--text-muted)',
                fontSize: '10px',
                marginTop: '5px',
              }}
            >
              {formatDurationSeconds(
                selectedSeconds,
              )}{' '}
              studied ·{' '}
              {selectedSessions.length}{' '}
              session
              {selectedSessions.length ===
              1
                ? ''
                : 's'}
            </div>
          </div>
        </div>

        {selectedSessions.length ===
        0 ? (
          <div
            style={{
              padding:
                '18px',
              borderRadius:
                '10px',
              border:
                '1px solid var(--void-border)',
              color:
                'var(--text-muted)',
              fontSize: '12px',
            }}
          >
            No completed study sessions on this day.
          </div>
        ) : (
          <div
            style={{
              display:
                'grid',
              gap: '9px',
            }}
          >
            {selectedSessions.map(
              (session) => (
                <div
                  key={
                    session.id
                  }
                  style={{
                    display:
                      'flex',
                    justifyContent:
                      'space-between',
                    alignItems:
                      'center',
                    gap: '16px',
                    padding:
                      '13px',
                    borderRadius:
                      '10px',
                    border:
                      '1px solid var(--void-border)',
                    background:
                      'var(--void-surface-hover)',
                  }}
                >
                  <div>
                    <div
                      style={{
                        color:
                          'var(--text-primary)',
                        fontSize:
                          '13px',
                      }}
                    >
                      {session.subjectName}
                    </div>

                    <div
                      style={{
                        color:
                          'var(--text-muted)',
                        fontSize:
                          '9px',
                        marginTop:
                          '4px',
                      }}
                    >
                      {formatTime(
                        new Date(
                          session.completedAt,
                        ),
                      )}
                      {session.interruptions >
                        0 &&
                        ` · ${session.interruptions} interruptions`}
                    </div>
                  </div>

                  <div
                    className="mono"
                    style={{
                      color:
                        'var(--primary-glow)',
                      fontSize:
                        '12px',
                    }}
                  >
                    {formatDurationSeconds(
                      session.actualDuration,
                    )}
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
