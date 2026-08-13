import type { StudySession } from '../../types'
import {
  CheckCircle2,
  CircleX,
  Trash2,
  Filter,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useI18n } from '../../useI18n'

interface RecentSessionsProps {
  sessions: StudySession[]
  onDeleteSession: (id: string) => void
}

type FilterMode =
  | 'all'
  | 'completed'
  | 'interrupted'

function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  }

  const minutes = Math.floor(
    seconds / 60
  )

  const remainingSeconds =
    seconds % 60

  if (remainingSeconds === 0) {
    return `${minutes}m`
  }

  return `${minutes}m ${remainingSeconds}s`
}

function formatTimeOfDay(
  date: Date,
  locale: string
): string {
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: locale === 'en-US',
  })
}

export default function RecentSessions({
  sessions,
  onDeleteSession,
}: RecentSessionsProps) {
  const { language, t } = useI18n()

  const cardRef =
    useRef<HTMLDivElement>(null)

  const [filter, setFilter] =
    useState<FilterMode>('all')

  const [subjectFilter, setSubjectFilter] =
    useState('all')

  const subjects = useMemo(() => {
    return Array.from(
      new Set(
        sessions.map(
          (session) =>
            session.subjectName
        )
      )
    ).sort()
  }, [sessions])

  const filteredSessions =
    useMemo(() => {
      return sessions.filter(
        (session) => {
          const statusMatches =
            filter === 'all' ||
            (filter === 'completed' &&
              session.completed) ||
            (filter ===
              'interrupted' &&
              !session.completed)

          const subjectMatches =
            subjectFilter === 'all' ||
            session.subjectName ===
              subjectFilter

          return (
            statusMatches &&
            subjectMatches
          )
        }
      )
    }, [
      sessions,
      filter,
      subjectFilter,
    ])

  useEffect(() => {
    const card = cardRef.current

    if (!card) return

    const handleMouseMove = (
      event: MouseEvent
    ) => {
      const rect =
        card.getBoundingClientRect()

      if (
        rect.width === 0 ||
        rect.height === 0
      ) {
        return
      }

      const x =
        event.clientX - rect.left

      const y =
        event.clientY - rect.top

      const rotateX =
        ((y - rect.height / 2) /
          (rect.height / 2)) *
        -3

      const rotateY =
        ((x - rect.width / 2) /
          (rect.width / 2)) *
        3

      card.style.transform =
        `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
    }

    const handleMouseLeave = () => {
      card.style.transform =
        'perspective(800px) rotateX(0deg) rotateY(0deg)'
    }

    card.addEventListener(
      'mousemove',
      handleMouseMove
    )

    card.addEventListener(
      'mouseleave',
      handleMouseLeave
    )

    return () => {
      card.removeEventListener(
        'mousemove',
        handleMouseMove
      )

      card.removeEventListener(
        'mouseleave',
        handleMouseLeave
      )
    }
  }, [])

  const locale =
    language === 'ku'
      ? 'ku-IQ'
      : 'en-US'

  const filterLabels: Record<
    FilterMode,
    string
  > = {
    all: t('all'),
    completed: t('completed'),
    interrupted: t('interrupted'),
  }

  return (
    <div
      ref={cardRef}
      className="glass-panel"
      style={{
        padding: '20px',
        transition:
          'transform 0.3s ease, box-shadow 0.3s ease',
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
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontFamily:
              'Orbitron, sans-serif',
            color:
              'var(--text-muted)',
            textTransform:
              'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          {t('sessionHistory')}
        </span>

        <Filter
          size={14}
          color="var(--text-muted)"
        />
      </div>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          marginTop: '14px',
        }}
      >
        {(
          [
            'all',
            'completed',
            'interrupted',
          ] as FilterMode[]
        ).map((mode) => (
          <button
            key={mode}
            onClick={() =>
              setFilter(mode)
            }
            className="cyber-btn"
            style={{
              padding:
                '7px 12px',
              fontSize: '10px',
              opacity:
                filter === mode
                  ? 1
                  : 0.5,
            }}
          >
            {filterLabels[mode]}
          </button>
        ))}

        <select
          value={subjectFilter}
          onChange={(event) =>
            setSubjectFilter(
              event.target.value
            )
          }
          style={{
            padding:
              '7px 10px',
            background:
              'var(--void-surface-hover)',
            border:
              '1px solid var(--void-border)',
            borderRadius: '8px',
            color:
              'var(--text-primary)',
            fontSize: '11px',
            outline: 'none',
            maxWidth: '100%',
          }}
        >
          <option value="all">
            {t('allSubjects')}
          </option>

          {subjects.map(
            (subject) => (
              <option
                key={subject}
                value={subject}
              >
                {subject}
              </option>
            )
          )}
        </select>
      </div>

      {filteredSessions.length ===
      0 ? (
        <p
          style={{
            marginTop: '16px',
            color:
              'var(--text-muted)',
            fontSize: '13px',
          }}
        >
          {t(
            'noMatchingSessions'
          )}
        </p>
      ) : (
        <div
          style={{
            marginTop: '16px',
            display: 'flex',
            flexDirection:
              'column',
            gap: '4px',
          }}
        >
          {filteredSessions
            .slice(0, 30)
            .map(
              (
                session,
                index
              ) => (
                <div
                  key={session.id}
                  style={{
                    display:
                      'flex',
                    alignItems:
                      'center',
                    gap: '10px',
                    padding:
                      '10px 12px',
                    background:
                      index %
                        2 ===
                      0
                        ? 'rgba(255,255,255,0.015)'
                        : 'transparent',
                    borderRadius:
                      '8px',
                    minWidth: 0,
                  }}
                >
                  {session.completed ? (
                    <CheckCircle2
                      size={14}
                      color="var(--success)"
                    />
                  ) : (
                    <CircleX
                      size={14}
                      color="var(--energy)"
                    />
                  )}

                  <span
                    style={{
                      fontSize:
                        '13px',
                      color:
                        'var(--text-primary)',
                      flex: 1,
                      minWidth: 0,
                      overflow:
                        'hidden',
                      textOverflow:
                        'ellipsis',
                      whiteSpace:
                        'nowrap',
                    }}
                  >
                    {
                      session.subjectName
                    }
                  </span>

                  <span
                    className="mono"
                    style={{
                      fontSize:
                        '12px',
                      color:
                        session.completed
                          ? 'var(--text-secondary)'
                          : 'var(--energy)',
                      flexShrink:
                        0,
                    }}
                  >
                    {formatTime(
                      session.actualDuration
                    )}
                  </span>

                  {session.interruptions >
                    0 && (
                    <span
                      className="mono"
                      style={{
                        fontSize:
                          '9px',
                        color:
                          'var(--energy)',
                        flexShrink:
                          0,
                      }}
                    >
                      {
                        session.interruptions
                      }x
                    </span>
                  )}

                  {session.totalPausedSeconds >
                    0 && (
                    <span
                      className="mono"
                      style={{
                        fontSize:
                          '9px',
                        color:
                          'var(--text-muted)',
                        flexShrink:
                          0,
                      }}
                    >
                      +
                      {formatTime(
                        session.totalPausedSeconds
                      )}
                    </span>
                  )}

                  <span
                    className="mono"
                    style={{
                      fontSize:
                        '10px',
                      color:
                        'var(--text-muted)',
                      minWidth:
                        '70px',
                      textAlign:
                        'right',
                      flexShrink:
                        0,
                    }}
                  >
                    {formatTimeOfDay(
                      session.completedAt,
                      locale
                    )}
                  </span>

                  <button
                    onClick={() =>
                      onDeleteSession(
                        session.id
                      )
                    }
                    title={t(
                      'deleteSession'
                    )}
                    aria-label={t(
                      'deleteSession'
                    )}
                    style={{
                      width:
                        '26px',
                      height:
                        '26px',
                      display:
                        'flex',
                      alignItems:
                        'center',
                      justifyContent:
                        'center',
                      background:
                        'transparent',
                      border: 'none',
                      color:
                        'var(--text-muted)',
                      cursor:
                        'pointer',
                      opacity:
                        0.55,
                      flexShrink:
                        0,
                    }}
                  >
                    <Trash2
                      size={13}
                    />
                  </button>
                </div>
              )
            )}
        </div>
      )}
    </div>
  )
}