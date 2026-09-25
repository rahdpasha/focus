import {
  Check,
  Circle,
  Flame,
  Play,
  Plus,
  RotateCw,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import type {
  Subject,
  StudySession,
} from '../types'
import type {
  RoutineItem,
  RoutineSessionContext,
} from '../storage/types'
import {
  getRecentRoutineDates,
  getRecoverableRoutineOccurrences,
  getRotationItemForDate,
  getRoutineItemsForDate,
  getRoutineMinutesForDate,
  getRoutineStatus,
  getRoutineStreakStats,
  toRoutineDateKey,
} from '../utils/routine'
import PageContainer from './PageContainer'
import PageHeader from '../components/layout/PageHeader'
import { useI18n } from '../useI18n'

interface RoutinePageProps {
  subjects: Subject[]
  sessions: StudySession[]
  routineItems: RoutineItem[]
  onAddRoutineItem: (
    title: string,
    subjectId: string,
    targetMinutes: number,
    mode: RoutineItem['mode'],
    daysOfWeek?: number[],
    recoveryDays?: number,
  ) => void
  onUpdateRoutineItem: (
    id: string,
    patch: Partial<
      Omit<
        RoutineItem,
        'id' | 'createdAt'
      >
    >,
  ) => void
  onDeleteRoutineItem: (
    id: string,
  ) => void
  onStartSession: (
    subjectId?: string,
    minutes?: number,
    routineContext?: RoutineSessionContext,
  ) => void
}

function shortDay(date: Date) {
  return date.toLocaleDateString(
    undefined,
    {
      weekday: 'short',
    },
  )
}

const WEEKDAYS = [
  { value: 0, label: 'S' },
  { value: 1, label: 'M' },
  { value: 2, label: 'T' },
  { value: 3, label: 'W' },
  { value: 4, label: 'T' },
  { value: 5, label: 'F' },
  { value: 6, label: 'S' },
]

function dayRuleLabel(
  days: number[],
): string {
  const normalized =
    Array.from(
      new Set(days),
    ).sort()

  if (normalized.length === 7) {
    return 'Every day'
  }

  if (
    normalized.length === 5 &&
    [1, 2, 3, 4, 5].every(
      (day) => normalized.includes(day),
    )
  ) {
    return 'Weekdays'
  }

  if (
    normalized.length === 2 &&
    normalized.includes(0) &&
    normalized.includes(6)
  ) {
    return 'Weekends'
  }

  return normalized
    .map(
      (day) =>
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day],
    )
    .join(', ')
}

export default function RoutinePage({
  subjects,
  sessions,
  routineItems,
  onAddRoutineItem,
  onUpdateRoutineItem,
  onDeleteRoutineItem,
  onStartSession,
}: RoutinePageProps) {
  const { t } = useI18n()
  const [title, setTitle] =
    useState('')
  const [subjectId, setSubjectId] =
    useState(
      subjects[0]?.id ?? '',
    )
  const [
    targetMinutes,
    setTargetMinutes,
  ] = useState(25)
  const [mode, setMode] =
    useState<RoutineItem['mode']>(
      'fixed',
    )
  const [daysOfWeek, setDaysOfWeek] =
    useState<number[]>([0, 1, 2, 3, 4, 5, 6])
  const [recoveryDays, setRecoveryDays] =
    useState(1)
  const [pendingDelete, setPendingDelete] =
    useState<string | null>(null)

  const [today, setToday] =
    useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(
      () => {
        setToday(new Date())
      },
      60_000,
    )

    return () =>
      window.clearInterval(timer)
  }, [])

  const selectedSubjectId =
    subjectId &&
    subjects.some(
      (subject) =>
        subject.id === subjectId,
    )
      ? subjectId
      : subjects[0]?.id ?? ''

  const recentDates = useMemo(
    () =>
      getRecentRoutineDates(
        7,
        today,
      ),
    [today],
  )

  const recoveryQueue =
    getRecoverableRoutineOccurrences(
      routineItems,
      sessions,
      today,
    )

  const streak =
    getRoutineStreakStats(
      routineItems,
      sessions,
      today,
    )

  const todaysItems =
    getRoutineItemsForDate(
      routineItems,
      today,
    )

  const rotationToday =
    getRotationItemForDate(
      routineItems,
      today,
    )

  const tomorrow =
    new Date(today)
  tomorrow.setDate(
    tomorrow.getDate() + 1,
  )

  const rotationTomorrow =
    getRotationItemForDate(
      routineItems,
      tomorrow,
    )

  const completedToday =
    todaysItems.filter(
      (item) => {
        const status =
          getRoutineStatus(
            item,
            routineItems,
            sessions,
            today,
          )

        return (
          status === 'done' ||
          status === 'recovered'
        )
      },
    ).length

  const addItem = () => {
    const subject =
      subjects.find(
        (item) =>
          item.id === selectedSubjectId,
      )

    if (!subject) return

    onAddRoutineItem(
      title.trim() ||
        subject.name,
      subject.id,
      targetMinutes,
      mode,
      daysOfWeek,
      recoveryDays,
    )

    setTitle('')
    setTargetMinutes(25)
  }

  const toggleBuilderDay = (
    day: number,
  ) => {
    setDaysOfWeek(
      (current) => {
        if (
          current.includes(day)
        ) {
          if (
            current.length === 1
          ) {
            return current
          }

          return current.filter(
            (value) =>
              value !== day,
          )
        }

        return [
          ...current,
          day,
        ].sort()
      },
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title={t('routine')}
        description={t(
          'routinePageQuestion',
        )}
      />

      <div className="routine-v5">
        <section
          className="glass-panel routine-panel"
          style={{
            padding: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'center',
              gap: '14px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div className="eyebrow">
                Today
              </div>
              <h2
                style={{
                  margin:
                    '5px 0 0',
                }}
              >
                {completedToday}/{
                  todaysItems.length
                } complete
              </h2>
            </div>

            {rotationToday && (
              <div
                style={{
                  padding:
                    '10px 12px',
                  border:
                    '1px solid var(--primary-border)',
                  borderRadius:
                    '12px',
                  background:
                    'var(--primary-soft)',
                  color:
                    'var(--text-secondary)',
                  fontSize:
                    '12px',
                }}
              >
                <RotateCw
                  size={14}
                  style={{
                    verticalAlign:
                      'middle',
                    marginRight:
                      '7px',
                  }}
                />
                Rotation:{' '}
                <strong>
                  {
                    rotationToday.title
                  }
                </strong>
                {rotationTomorrow && (
                  <span
                    style={{
                      marginLeft:
                        '8px',
                      color:
                        'var(--text-muted)',
                    }}
                  >
                    · Tomorrow:{' '}
                    {
                      rotationTomorrow.title
                    }
                  </span>
                )}
              </div>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '10px',
              marginTop: '14px',
            }}
          >
            <div
              style={{
                padding: '12px',
                border:
                  '1px solid var(--void-border)',
                borderRadius:
                  '11px',
                background:
                  'var(--void-surface-hover)',
              }}
            >
              <div
                className="eyebrow"
                style={{
                  display: 'flex',
                  alignItems:
                    'center',
                  gap: '6px',
                }}
              >
                <Flame size={13} />
                Current streak
              </div>
              <strong
                className="mono"
                style={{
                  display: 'block',
                  marginTop: '6px',
                  fontSize: '18px',
                }}
              >
                {streak.current}d
              </strong>
            </div>

            <div
              style={{
                padding: '12px',
                border:
                  '1px solid var(--void-border)',
                borderRadius:
                  '11px',
                background:
                  'var(--void-surface-hover)',
              }}
            >
              <div className="eyebrow">
                Best streak
              </div>
              <strong
                className="mono"
                style={{
                  display: 'block',
                  marginTop: '6px',
                  fontSize: '18px',
                }}
              >
                {streak.best}d
              </strong>
            </div>

            <div
              style={{
                padding: '12px',
                border:
                  '1px solid var(--void-border)',
                borderRadius:
                  '11px',
                background:
                  'var(--void-surface-hover)',
              }}
            >
              <div className="eyebrow">
                Today completed
              </div>
              <strong
                className="mono"
                style={{
                  display: 'block',
                  marginTop: '6px',
                  fontSize: '18px',
                }}
              >
                {completedToday}/{todaysItems.length}
              </strong>
            </div>

            <div
              style={{
                padding: '12px',
                border:
                  '1px solid var(--void-border)',
                borderRadius:
                  '11px',
                background:
                  'var(--void-surface-hover)',
              }}
            >
              <div
                className="eyebrow"
                style={{
                  display: 'flex',
                  alignItems:
                    'center',
                  gap: '6px',
                }}
              >
                <ShieldCheck
                  size={13}
                />
                Recovery
              </div>
              <strong
                className="mono"
                style={{
                  display: 'block',
                  marginTop: '6px',
                  fontSize: '18px',
                }}
              >
                {recoveryQueue.length} open
              </strong>
              {streak.atRisk && (
                <span
                  style={{
                    color:
                      'var(--energy)',
                    fontSize: '10px',
                  }}
                >
                  streak protected while recovery is open
                </span>
              )}
            </div>
          </div>
        </section>

        <section
          style={{
            display: 'grid',
            gap: '12px',
          }}
        >
          {todaysItems.length ===
          0 ? (
            <div
              className="glass-panel routine-panel"
              style={{
                padding: '24px',
                color:
                  'var(--text-muted)',
              }}
            >
              Add fixed daily items
              or a rotation pool
              below.
            </div>
          ) : (
            todaysItems.map(
              (item) => {
                const subject =
                  subjects.find(
                    (candidate) =>
                      candidate.id ===
                      item.subjectId,
                  )

                const minutes =
                  getRoutineMinutesForDate(
                    item,
                    sessions,
                    today,
                  )
                const done =
                  minutes >=
                  item.targetMinutes

                return (
                  <article
                    key={item.id}
                    className="glass-panel routine-panel"
                    style={{
                      padding:
                        '18px',
                      display:
                        'grid',
                      gap: '14px',
                    }}
                  >
                    <div
                      style={{
                        display:
                          'flex',
                        justifyContent:
                          'space-between',
                        alignItems:
                          'center',
                        gap: '12px',
                        flexWrap:
                          'wrap',
                      }}
                    >
                      <div
                        style={{
                          display:
                            'flex',
                          alignItems:
                            'center',
                          gap:
                            '12px',
                        }}
                      >
                        <div
                          aria-label={
                            done
                              ? 'Completed'
                              : 'Pending'
                          }
                          style={{
                            width:
                              '40px',
                            height:
                              '40px',
                            borderRadius:
                              '11px',
                            display:
                              'grid',
                            placeItems:
                              'center',
                            border:
                              done
                                ? '1px solid var(--primary-border)'
                                : '1px solid var(--void-border)',
                            background:
                              done
                                ? 'var(--primary-soft)'
                                : 'var(--void-surface-hover)',
                            fontSize:
                              '20px',
                          }}
                        >
                          {done
                            ? '✅'
                            : '·'}
                        </div>

                        <div>
                          <div
                            style={{
                              fontWeight:
                                750,
                              color:
                                'var(--text-primary)',
                            }}
                          >
                            {
                              item.title
                            }
                          </div>

                          <div
                            style={{
                              color:
                                'var(--text-muted)',
                              fontSize:
                                '11px',
                              marginTop:
                                '4px',
                            }}
                          >
                            {subject
                              ?.name ??
                              'Subject removed'}{' '}
                            · {
                              item.mode ===
                              'fixed'
                                ? 'Every day'
                                : 'Rotation'
                            }
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="cyber-btn routine-primary-action"
                        disabled={
                          !subject
                        }
                        onClick={() =>
                          onStartSession(
                            item.subjectId,
                            Math.max(
                              1,
                              item.targetMinutes -
                                minutes,
                            ),
                            {
                              itemId:
                                item.id,
                              routineDate:
                                toRoutineDateKey(
                                  today,
                                ),
                            },
                          )
                        }
                      >
                        <Play
                          size={14}
                        />
                        {done
                          ? 'Focus again'
                          : `Start ${item.targetMinutes}m`}
                      </button>
                    </div>

                    <div>
                      <div
                        style={{
                          display:
                            'flex',
                          justifyContent:
                            'space-between',
                          color:
                            'var(--text-muted)',
                          fontSize:
                            '11px',
                          marginBottom:
                            '7px',
                        }}
                      >
                        <span>
                          {minutes}m
                          focused
                        </span>
                        <span>
                          {
                            item.targetMinutes
                          }m target
                        </span>
                      </div>

                      <div
                        style={{
                          height:
                            '7px',
                          borderRadius:
                            '999px',
                          overflow:
                            'hidden',
                          background:
                            'var(--void-border)',
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(
                                (minutes /
                                  item.targetMinutes) *
                                  100,
                              ),
                            )}%`,
                            height:
                              '100%',
                            background:
                              'var(--primary-glow)',
                          }}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        display:
                          'grid',
                        gridTemplateColumns:
                          'repeat(7, minmax(34px, 1fr))',
                        gap: '6px',
                      }}
                    >
                      {recentDates.map(
                        (date) => {
                          const status =
                            getRoutineStatus(
                              item,
                              routineItems,
                              sessions,
                              date,
                              today,
                            )

                          return (
                            <div
                              key={
                                date.toISOString()
                              }
                              title={
                                status
                              }
                              style={{
                                minHeight:
                                  '42px',
                                borderRadius:
                                  '9px',
                                border:
                                  '1px solid var(--void-border)',
                                background:
                                  'var(--void-surface-hover)',
                                display:
                                  'grid',
                                placeItems:
                                  'center',
                                fontSize:
                                  '12px',
                              }}
                            >
                              <span>
                                {status ===
                                'done'
                                  ? '✅'
                                  : status ===
                                      'recovered'
                                    ? '↩️'
                                    : status ===
                                        'recoverable'
                                      ? '⏳'
                                      : status ===
                                          'missed'
                                        ? '❌'
                                        : status ===
                                            'pending'
                                          ? '·'
                                          : '—'}
                              </span>
                              <small
                                style={{
                                  color:
                                    'var(--text-muted)',
                                  fontSize:
                                    '8px',
                                }}
                              >
                                {
                                  shortDay(
                                    date,
                                  )
                                }
                              </small>
                            </div>
                          )
                        },
                      )}
                    </div>
                  </article>
                )
              },
            )
          )}
        </section>

        {recoveryQueue.length > 0 && (
          <section
            className="glass-panel routine-panel"
            style={{
              padding: '20px',
            }}
          >
            <div className="eyebrow">
              Missed-day recovery
            </div>
            <h2
              style={{
                margin:
                  '6px 0 4px',
              }}
            >
              Recover without mixing days
            </h2>
            <p
              style={{
                color:
                  'var(--text-muted)',
                fontSize: '12px',
                marginBottom:
                  '14px',
              }}
            >
              Recovery focus is credited to the missed routine day, while today keeps its own progress.
            </p>

            <div
              style={{
                display: 'grid',
                gap: '10px',
              }}
            >
              {recoveryQueue.map(
                (entry) => (
                  <div
                    key={
                      entry.item.id +
                      entry.dateKey
                    }
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'minmax(0,1fr) auto',
                      gap: '12px',
                      alignItems:
                        'center',
                      padding:
                        '13px 14px',
                      border:
                        '1px solid var(--void-border)',
                      borderRadius:
                        '11px',
                      background:
                        'var(--void-surface-hover)',
                    }}
                  >
                    <div>
                      <strong>
                        {
                          entry.item
                            .title
                        }
                      </strong>
                      <div
                        style={{
                          color:
                            'var(--text-muted)',
                          fontSize:
                            '11px',
                          marginTop:
                            '4px',
                        }}
                      >
                        {entry.date.toLocaleDateString(
                          undefined,
                          {
                            weekday:
                              'short',
                            month:
                              'short',
                            day:
                              'numeric',
                          },
                        )}{' '}
                        · {
                          entry.remainingMinutes
                        }m remaining
                      </div>
                    </div>

                    <button
                      type="button"
                      className="cyber-btn routine-primary-action"
                      onClick={() =>
                        onStartSession(
                          entry.item
                            .subjectId,
                          entry.remainingMinutes,
                          {
                            itemId:
                              entry.item
                                .id,
                            routineDate:
                              entry.dateKey,
                          },
                        )
                      }
                    >
                      Recover
                    </button>
                  </div>
                ),
              )}
            </div>
          </section>
        )}

        <section
          className="glass-panel routine-panel"
          style={{
            padding: '20px',
          }}
        >
          <div className="eyebrow">
            Build your routine
          </div>
          <h2
            style={{
              margin:
                '6px 0 14px',
            }}
          >
            Fixed + rotating study
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '10px',
            }}
          >
            <input
              value={title}
              maxLength={80}
              placeholder="Name (optional)"
              onChange={(event) =>
                setTitle(
                  event.target
                    .value,
                )
              }
            />

            <select
              value={selectedSubjectId}
              onChange={(event) =>
                setSubjectId(
                  event.target
                    .value,
                )
              }
            >
              <option value="">
                Select subject
              </option>
              {subjects.map(
                (subject) => (
                  <option
                    key={
                      subject.id
                    }
                    value={
                      subject.id
                    }
                  >
                    {
                      subject.name
                    }
                  </option>
                ),
              )}
            </select>

            <input
              type="number"
              min={1}
              max={720}
              value={targetMinutes}
              onChange={(
                event,
              ) =>
                setTargetMinutes(
                  Number(
                    event.target
                      .value,
                  ),
                )
              }
              aria-label="Routine target minutes"
            />

            <select
              value={mode}
              onChange={(event) =>
                setMode(
                  event.target
                    .value as RoutineItem['mode'],
                )
              }
            >
              <option value="fixed">
                Fixed
              </option>
              <option value="rotation">
                Rotation pool
              </option>
            </select>

            <select
              value={recoveryDays}
              onChange={(event) =>
                setRecoveryDays(
                  Number(
                    event.target.value,
                  ),
                )
              }
              aria-label="Recovery window"
            >
              <option value={0}>
                No recovery
              </option>
              <option value={1}>
                +1 day recovery
              </option>
              <option value={2}>
                +2 days recovery
              </option>
              <option value={3}>
                +3 days recovery
              </option>
            </select>

            <button
              type="button"
              className="cyber-btn routine-primary-action"
              disabled={!subjectId}
              onClick={addItem}
            >
              <Plus size={15} />
              Add routine
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              marginTop: '12px',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                color:
                  'var(--text-muted)',
                fontSize: '11px',
                marginRight: '4px',
              }}
            >
              Schedule
            </span>

            {[
              {
                label: 'Every day',
                days: [0, 1, 2, 3, 4, 5, 6],
              },
              {
                label: 'Weekdays',
                days: [1, 2, 3, 4, 5],
              },
              {
                label: 'Weekends',
                days: [0, 6],
              },
            ].map((preset) => {
              const active =
                preset.days.length ===
                  daysOfWeek.length &&
                preset.days.every((day) =>
                  daysOfWeek.includes(day),
                )

              return (
                <button
                  key={preset.label}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    setDaysOfWeek(
                      preset.days,
                    )
                  }
                  className={
                    active
                      ? 'routine-schedule-preset active'
                      : 'routine-schedule-preset'
                  }
                >
                  {preset.label}
                </button>
              )
            })}

            <span
              style={{
                color:
                  'var(--text-muted)',
                fontSize: '11px',
              }}
            >
              {dayRuleLabel(daysOfWeek)}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              marginTop: '8px',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                color:
                  'var(--text-muted)',
                fontSize: '11px',
                marginRight: '4px',
              }}
            >
              Days
            </span>

            {WEEKDAYS.map(
              (day) => {
                const active =
                  daysOfWeek.includes(
                    day.value,
                  )

                return (
                  <button
                    key={day.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      toggleBuilderDay(
                        day.value,
                      )
                    }
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius:
                        '9px',
                      border:
                        active
                          ? '1px solid var(--primary-border)'
                          : '1px solid var(--void-border)',
                      background:
                        active
                          ? 'var(--primary-soft)'
                          : 'var(--void-surface-hover)',
                      color:
                        active
                          ? 'var(--primary-glow)'
                          : 'var(--text-muted)',
                    }}
                  >
                    {day.label}
                  </button>
                )
              },
            )}
          </div>

          <div
            style={{
              marginTop:
                '16px',
              display: 'grid',
              gap: '8px',
            }}
          >
            {routineItems.map(
              (item) => {
                const subject =
                  subjects.find(
                    (candidate) =>
                      candidate.id ===
                      item.subjectId,
                  )

                return (
                  <div
                    key={item.id}
                    style={{
                      display:
                        'grid',
                      gridTemplateColumns:
                        'minmax(0,1fr) auto auto',
                      gap: '10px',
                      alignItems:
                        'center',
                      padding:
                        '11px 12px',
                      border:
                        '1px solid var(--void-border)',
                      borderRadius:
                        '10px',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color:
                            'var(--text-primary)',
                          fontWeight:
                            650,
                          fontSize:
                            '13px',
                        }}
                      >
                        {
                          item.title
                        }
                      </div>
                      <div
                        style={{
                          color:
                            'var(--text-muted)',
                          fontSize:
                            '10px',
                          marginTop:
                            '3px',
                        }}
                      >
                        {subject
                          ?.name ??
                          'Subject removed'}{' '}
                        · {
                          item.targetMinutes
                        }m · {
                          item.mode
                        } · {
                          dayRuleLabel(
                            item.daysOfWeek,
                          )
                        } · recovery {
                          item.recoveryDays
                        }d
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onUpdateRoutineItem(
                          item.id,
                          {
                            enabled:
                              !item.enabled,
                          },
                        )
                      }
                      aria-label={
                        item.enabled
                          ? 'Disable routine item'
                          : 'Enable routine item'
                      }
                      style={{
                        display:
                          'flex',
                        alignItems:
                          'center',
                        gap: '5px',
                        color:
                          item.enabled
                            ? 'var(--primary-glow)'
                            : 'var(--text-muted)',
                      }}
                    >
                      {item.enabled ? (
                        <Check
                          size={15}
                        />
                      ) : (
                        <Circle
                          size={15}
                        />
                      )}
                      {item.enabled
                        ? 'On'
                        : 'Off'}
                    </button>

                    <button
                      type="button"
                      aria-label={
                        pendingDelete ===
                        item.id
                          ? 'Confirm delete routine item'
                          : 'Delete routine item'
                      }
                      onClick={() => {
                        if (
                          pendingDelete ===
                          item.id
                        ) {
                          onDeleteRoutineItem(
                            item.id,
                          )
                          setPendingDelete(
                            null,
                          )
                          return
                        }

                        setPendingDelete(
                          item.id,
                        )
                      }}
                    >
                      {pendingDelete ===
                      item.id ? (
                        <X size={16} />
                      ) : (
                        <Trash2
                          size={16}
                        />
                      )}
                    </button>

                    <div
                      style={{
                        gridColumn:
                          '1 / -1',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '5px',
                        alignItems:
                          'center',
                      }}
                    >
                      {WEEKDAYS.map(
                        (day) => {
                          const active =
                            item.daysOfWeek.includes(
                              day.value,
                            )

                          return (
                            <button
                              key={day.value}
                              type="button"
                              aria-pressed={
                                active
                              }
                              onClick={() => {
                                const next =
                                  active
                                    ? item.daysOfWeek.filter(
                                        (
                                          value,
                                        ) =>
                                          value !==
                                          day.value,
                                      )
                                    : [
                                        ...item.daysOfWeek,
                                        day.value,
                                      ].sort()

                                if (
                                  next.length ===
                                  0
                                ) {
                                  return
                                }

                                onUpdateRoutineItem(
                                  item.id,
                                  {
                                    daysOfWeek:
                                      next,
                                  },
                                )
                              }}
                              className={
                                active
                                  ? 'routine-day-toggle active'
                                  : 'routine-day-toggle'
                              }
                            >
                              {
                                day.label
                              }
                            </button>
                          )
                        },
                      )}

                      <select
                        aria-label={
                          'Recovery window for ' +
                          item.title
                        }
                        value={
                          item.recoveryDays
                        }
                        onChange={(
                          event,
                        ) =>
                          onUpdateRoutineItem(
                            item.id,
                            {
                              recoveryDays:
                                Number(
                                  event.target
                                    .value,
                                ),
                            },
                          )
                        }
                        className="routine-recovery-select"
                      >
                        <option value={0}>
                          No recovery
                        </option>
                        <option value={1}>
                          +1 day
                        </option>
                        <option value={2}>
                          +2 days
                        </option>
                        <option value={3}>
                          +3 days
                        </option>
                      </select>
                    </div>
                  </div>
                )
              },
            )}
          </div>
        </section>
      </div>
    </PageContainer>
  )
}
