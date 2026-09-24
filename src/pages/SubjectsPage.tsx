import {
  ArrowRight,
  Clock3,
  Plus,
  Archive,
  X,
} from 'lucide-react'
import {
  useMemo,
  useState,
} from 'react'
import PageHeader from '../components/layout/PageHeader'
import type {
  StudySession,
  Subject,
} from '../types'
import {
  useI18n,
} from '../useI18n'
import PageContainer from './PageContainer'
import {
  SUBJECT_COLORS,
} from '../utils/subjectManager'

interface SubjectsPageProps {
  subjects: Subject[]
  activeSubjectId:
    | string
    | null
  sessions: StudySession[]
  onSelectSubject: (
    id: string | null,
  ) => void
  onAddSubject: (
    name: string,
    color: string,
  ) => void
  onDeleteSubject: (
    id: string,
  ) => void
  onStartSession: (
    subjectId?: string,
    minutes?: number,
  ) => void
}

interface SubjectMetrics {
  subject: Subject
  completedSessions: number
  weekMinutes: number
  totalMinutes: number
  lastStudied: Date | null
}

function getStartOfWeek(): Date {
  const date = new Date()
  date.setHours(0, 0, 0, 0)

  const weekday =
    date.getDay()
  const offset =
    weekday === 0
      ? 6
      : weekday - 1

  date.setDate(
    date.getDate() - offset,
  )

  return date
}

function minutesLabel(
  minutes: number,
): string {
  if (minutes < 60) {
    return `${minutes}m`
  }

  const hours =
    Math.floor(minutes / 60)
  const remainder =
    minutes % 60

  return remainder > 0
    ? `${hours}h ${remainder}m`
    : `${hours}h`
}

export default function SubjectsPage({
  subjects,
  activeSubjectId,
  sessions,
  onSelectSubject,
  onAddSubject,
  onDeleteSubject,
  onStartSession,
}: SubjectsPageProps) {
  const { t } = useI18n()
  const [
    showCreate,
    setShowCreate,
  ] = useState(false)
  const [name, setName] =
    useState('')
  const [color, setColor] =
    useState<string>(
      SUBJECT_COLORS[
        subjects.length %
          SUBJECT_COLORS.length
      ],
    )

  const metrics =
    useMemo<
      SubjectMetrics[]
    >(() => {
      const weekStart =
        getStartOfWeek().getTime()

      return subjects.map(
        (subject) => {
          const relevant =
            sessions.filter(
              (session) =>
                session.completed &&
                session.subjectId ===
                  subject.id,
            )

          const totalMinutes =
            Math.round(
              relevant.reduce(
                (
                  sum,
                  session,
                ) =>
                  sum +
                  Math.max(
                    0,
                    session.actualDuration,
                  ),
                0,
              ) / 60,
            )

          const weekMinutes =
            Math.round(
              relevant
                .filter(
                  (session) =>
                    new Date(
                      session.completedAt,
                    ).getTime() >=
                    weekStart,
                )
                .reduce(
                  (
                    sum,
                    session,
                  ) =>
                    sum +
                    Math.max(
                      0,
                      session.actualDuration,
                    ),
                  0,
                ) / 60,
            )

          const lastStudied =
            relevant.length > 0
              ? new Date(
                  Math.max(
                    ...relevant.map(
                      (session) =>
                        new Date(
                          session.completedAt,
                        ).getTime(),
                    ),
                  ),
                )
              : null

          return {
            subject,
            completedSessions:
              relevant.length,
            weekMinutes,
            totalMinutes,
            lastStudied,
          }
        },
      )
    }, [sessions, subjects])

  const closeCreate = () => {
    setShowCreate(false)
    setName('')
    setColor(
      SUBJECT_COLORS[
        subjects.length %
          SUBJECT_COLORS.length
      ],
    )
  }

  const create = () => {
    const clean =
      name.trim()

    if (!clean) return

    onAddSubject(
      clean,
      color,
    )

    closeCreate()
  }

  return (
    <PageContainer>
      <PageHeader
        title={t('subjects')}
        description={t(
          'subjectsPageQuestion',
        )}
        action={
          <button
            type="button"
            className="cyber-btn"
            onClick={() =>
              setShowCreate(
                true,
              )
            }
          >
            <Plus size={15} />
            {t('addSubject')}
          </button>
        }
      />

      {subjects.length === 0 ? (
        <section className="glass-panel subjects-empty">
          <div className="subjects-empty-icon">
            <Plus size={22} />
          </div>
          <h2>
            Create your first
            subject
          </h2>
          <p>
            Subjects give sessions,
            plans, analytics and AI
            advice a real context.
          </p>
          <button
            type="button"
            className="cyber-btn"
            onClick={() =>
              setShowCreate(
                true,
              )
            }
          >
            Add subject
          </button>
        </section>
      ) : (
        <div className="subjects-grid">
          {metrics.map(
            ({
              subject,
              completedSessions,
              weekMinutes,
              totalMinutes,
              lastStudied,
            }) => {
              const active =
                subject.id ===
                activeSubjectId

              return (
                <article
                  key={
                    subject.id
                  }
                  className={
                    active
                      ? 'glass-panel subject-card active'
                      : 'glass-panel subject-card'
                  }
                  style={{
                    '--subject-color':
                      subject.color,
                  } as React.CSSProperties}
                >
                  <div className="subject-card-head">
                    <div className="subject-card-identity">
                      <span
                        className="subject-card-dot"
                        style={{
                          background:
                            subject.color,
                          boxShadow:
                            active
                              ? `0 0 14px ${subject.color}80`
                              : undefined,
                        }}
                      />

                      <div>
                        <h2>
                          {
                            subject.name
                          }
                        </h2>
                        <span>
                          {active
                            ? 'Current subject'
                            : 'Study subject'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="subject-card-delete"
                      onClick={() =>
                        onDeleteSubject(
                          subject.id,
                        )
                      }
                      aria-label={
                        `${t('deleteSubject')} ${subject.name}. Study history is preserved.`
                      }
                      title="Remove subject; study history is preserved"
                    >
                      <Archive
                        size={14}
                      />
                    </button>
                  </div>

                  <div className="subject-card-metrics">
                    <div>
                      <span>
                        This week
                      </span>
                      <strong>
                        {minutesLabel(
                          weekMinutes,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Sessions
                      </span>
                      <strong>
                        {
                          completedSessions
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        All time
                      </span>
                      <strong>
                        {minutesLabel(
                          totalMinutes,
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="subject-card-last">
                    <Clock3
                      size={13}
                    />
                    {lastStudied
                      ? `Last studied ${lastStudied.toLocaleDateString(
                          undefined,
                          {
                            month:
                              'short',
                            day:
                              'numeric',
                          },
                        )}`
                      : 'No completed sessions yet'}
                  </div>

                  <div className="subject-card-actions">
                    <button
                      type="button"
                      className={
                        active
                          ? 'subject-select active'
                          : 'subject-select'
                      }
                      onClick={() =>
                        onSelectSubject(
                          active
                            ? null
                            : subject.id,
                        )
                      }
                    >
                      {active
                        ? 'Selected'
                        : 'Select'}
                    </button>

                    <button
                      type="button"
                      className="subject-start"
                      onClick={() =>
                        onStartSession(
                          subject.id,
                          25,
                        )
                      }
                    >
                      Start 25m
                      <ArrowRight
                        size={14}
                      />
                    </button>
                  </div>
                </article>
              )
            },
          )}
        </div>
      )}

      {showCreate && (
        <div
          className="subject-dialog-backdrop"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeCreate()
            }
          }}
        >
          <div
            className="subject-dialog glass-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="subjects-page-create-title"
          >
            <div className="subject-dialog-head">
              <div>
                <div className="eyebrow">
                  Study area
                </div>
                <h2 id="subjects-page-create-title">
                  {t(
                    'newSubject',
                  )}
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeCreate
                }
                aria-label="Close"
              >
                <X size={17} />
              </button>
            </div>

            <input
              autoFocus
              className="subject-dialog-input"
              value={name}
              maxLength={80}
              onChange={(
                event,
              ) =>
                setName(
                  event.target
                    .value,
                )
              }
              onKeyDown={(
                event,
              ) => {
                if (
                  event.key ===
                  'Enter'
                ) {
                  create()
                }

                if (
                  event.key ===
                  'Escape'
                ) {
                  closeCreate()
                }
              }}
              placeholder={t(
                'subjectName',
              )}
            />

            <div className="subject-dialog-label">
              {t('color')}
            </div>

            <div className="subject-color-grid">
              {SUBJECT_COLORS.map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={
                      color === item
                    }
                    aria-label={
                      `Choose ${item}`
                    }
                    onClick={() =>
                      setColor(item)
                    }
                    style={{
                      background:
                        item,
                    }}
                  />
                ),
              )}
            </div>

            <button
              type="button"
              className="cyber-btn"
              disabled={!name.trim()}
              onClick={create}
            >
              <Plus size={15} />
              {t(
                'createSubject',
              )}
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
