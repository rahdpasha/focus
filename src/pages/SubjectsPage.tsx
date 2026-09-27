import {
  ArrowRight,
  Check,
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
  createRequestKey?: number
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
  language: 'en' | 'ku',
): string {
  if (minutes < 60) {
    return language === 'ku'
      ? `${minutes} خولەک`
      : `${minutes}m`
  }

  const hours =
    Math.floor(minutes / 60)
  const remainder =
    minutes % 60

  if (remainder > 0) {
    return language === 'ku'
      ? `${hours} کاتژمێر ${remainder} خولەک`
      : `${hours}h ${remainder}m`
  }

  return language === 'ku'
    ? `${hours} کاتژمێر`
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
  createRequestKey = 0,
}: SubjectsPageProps) {
  const { language, t, tr } = useI18n()
  const [
    showCreate,
    setShowCreate,
  ] = useState(
    createRequestKey > 0,
  )
  const [name, setName] =
    useState('')
  const [
    pendingRemoval,
    setPendingRemoval,
  ] = useState<string | null>(
    null,
  )
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
            {tr('Create your first subject', 'یەکەم بابەتت دروست بکە')}
          </h2>
          <p>
            {tr('Add the subjects you actually study. FOCUS will use them across sessions, plans, progress and guidance.', 'ئەو بابەتانە زیاد بکە کە بەڕاستی دەیانخوێنیت. FOCUS لە سێشن، پلان، پێشکەوتن و ڕێنماییدا بەکاریان دەهێنێت.')}
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
            {t('addSubject')}
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
                            ? tr('Current subject', 'بابەتی ئێستا')
                            : tr('Study subject', 'بابەتی خوێندن')}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={
                        pendingRemoval ===
                        subject.id
                          ? 'subject-card-delete confirm'
                          : 'subject-card-delete'
                      }
                      onClick={() => {
                        if (
                          pendingRemoval ===
                          subject.id
                        ) {
                          onDeleteSubject(
                            subject.id,
                          )
                          setPendingRemoval(
                            null,
                          )
                          return
                        }

                        setPendingRemoval(
                          subject.id,
                        )
                      }}
                      aria-label={
                        pendingRemoval ===
                        subject.id
                          ? `${tr('Confirm removal of', 'پشتڕاستکردنەوەی لابردنی')} ${subject.name}`
                          : `${t('deleteSubject')} ${subject.name}. ${tr('Study history is preserved.', 'مێژووی خوێندن دەپارێزرێت.')}`
                      }
                      title={
                        pendingRemoval ===
                        subject.id
                          ? tr(tr('Click again to confirm', 'دووبارە کرتە بکە بۆ پشتڕاستکردنەوە'), 'دووبارە کرتە بکە بۆ پشتڕاستکردنەوە')
                          : tr(tr('Remove subject; study history is preserved', 'بابەت لاببە؛ مێژووی خوێندن دەپارێزرێت'), 'بابەت لاببە؛ مێژووی خوێندن دەپارێزرێت')
                      }
                    >
                      {pendingRemoval ===
                      subject.id ? (
                        <Check
                          size={14}
                        />
                      ) : (
                        <Archive
                          size={14}
                        />
                      )}
                    </button>
                  </div>

                  <div className="subject-card-metrics">
                    <div>
                      <span>
                        {tr('This week', 'ئەم هەفتەیە')}
                      </span>
                      <strong>
                        {minutesLabel(weekMinutes, language)}
                      </strong>
                    </div>

                    <div>
                      <span>
                        {tr('Sessions', 'سێشنەکان')}
                      </span>
                      <strong>
                        {
                          completedSessions
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        {tr('All time', 'هەموو کات')}
                      </span>
                      <strong>
                        {minutesLabel(totalMinutes, language)}
                      </strong>
                    </div>
                  </div>

                  <div className="subject-card-last">
                    <Clock3
                      size={13}
                    />
                    {lastStudied
                      ? `${tr('Last studied', 'دوایین خوێندن')} ${lastStudied.toLocaleDateString(
                          language === 'ku'
                            ? 'ku-IQ'
                            : 'en-US',
                          {
                            month:
                              'short',
                            day:
                              'numeric',
                          },
                        )}`
                      : tr('No completed sessions yet', 'هێشتا هیچ سێشنێکی تەواوکراو نییە')}
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
                        ? tr('Selected', 'هەڵبژێردراوە')
                        : tr('Select', 'هەڵبژێرە')}
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
                      {tr('Start 25m', 'دەستپێکردنی ٢٥ خولەک')}
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
                  {tr('Study area', 'بەشی خوێندن')}
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
                aria-label={tr('Close', 'داخستن')}
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
                      `${tr('Choose', 'هەڵبژێرە')} ${item}`
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
