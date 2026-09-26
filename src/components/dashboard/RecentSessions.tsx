import type {
  StudySession,
} from '../../types'
import {
  CheckCircle2,
  CircleX,
  Filter,
  Trash2,
} from 'lucide-react'
import {
  useMemo,
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

function formatTime(
  seconds: number,
  language: 'en' | 'ku',
): string {
  const secondUnit =
    language === 'ku' ? ' چرکە' : 's'
  const minuteUnit =
    language === 'ku' ? ' خولەک' : 'm'

  if (seconds < 60) {
    return `${seconds}${secondUnit}`
  }

  const minutes =
    Math.floor(seconds / 60)
  const remainingSeconds =
    seconds % 60

  return remainingSeconds === 0
    ? `${minutes}${minuteUnit}`
    : `${minutes}${minuteUnit} ${remainingSeconds}${secondUnit}`
}

function formatTimeOfDay(
  date: Date,
  locale: string,
): string {
  return date.toLocaleTimeString(
    locale,
    {
      hour: '2-digit',
      minute: '2-digit',
      hour12:
        locale === 'en-US',
    },
  )
}

export default function RecentSessions({
  sessions,
  onDeleteSession,
}: RecentSessionsProps) {
  const { language, t, tr } =
    useI18n()

  const [filter, setFilter] =
    useState<FilterMode>('all')
  const [
    subjectFilter,
    setSubjectFilter,
  ] = useState('all')
  const [
    pendingDelete,
    setPendingDelete,
  ] = useState<string | null>(
    null,
  )

  const subjects =
    useMemo(
      () =>
        Array.from(
          new Set(
            sessions.map(
              (session) =>
                session.subjectName,
            ),
          ),
        ).sort(),
      [sessions],
    )

  const filteredSessions =
    useMemo(
      () =>
        sessions.filter(
          (session) => {
            const statusMatches =
              filter === 'all' ||
              (filter ===
                'completed' &&
                session.completed) ||
              (filter ===
                'interrupted' &&
                !session.completed)

            const subjectMatches =
              subjectFilter ===
                'all' ||
              session.subjectName ===
                subjectFilter

            return (
              statusMatches &&
              subjectMatches
            )
          },
        ),
      [
        filter,
        sessions,
        subjectFilter,
      ],
    )

  const requestDeleteSession = (
    id: string,
  ) => {
    if (
      pendingDelete === id
    ) {
      onDeleteSession(id)
      setPendingDelete(null)
      return
    }

    setPendingDelete(id)
  }

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
    interrupted:
      t('interrupted'),
  }

  return (
    <section className="glass-panel recent-sessions-v5">
      <div className="recent-sessions-head">
        <div>
          <div className="eyebrow">
            {tr('Activity', 'چالاکی')}
          </div>
          <h2>
            {tr('Recent sessions', 'سێشنە نوێیەکان')}
          </h2>
        </div>

        <Filter size={16} />
      </div>

      <div className="recent-sessions-toolbar">
        <div className="recent-sessions-filters">
          {(
            [
              'all',
              'completed',
              'interrupted',
            ] as FilterMode[]
          ).map((mode) => (
            <button
              key={mode}
              type="button"
              className={
                filter === mode
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setFilter(mode)
              }
            >
              {
                filterLabels[
                  mode
                ]
              }
            </button>
          ))}
        </div>

        <select
          value={subjectFilter}
          onChange={(event) =>
            setSubjectFilter(
              event.target.value,
            )
          }
          aria-label={tr('Filter sessions by subject', 'پاڵاوتنی سێشنەکان بەپێی بابەت')}
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
            ),
          )}
        </select>
      </div>

      {filteredSessions.length ===
      0 ? (
        <div className="recent-sessions-empty">
          {t(
            'noMatchingSessions',
          )}
        </div>
      ) : (
        <div className="recent-sessions-list">
          {filteredSessions
            .slice(0, 30)
            .map(
              (session) => (
                <article
                  key={
                    session.id
                  }
                  className="recent-session-row"
                >
                  <div className="recent-session-state">
                    {session.completed ? (
                      <CheckCircle2
                        size={15}
                      />
                    ) : (
                      <CircleX
                        size={15}
                      />
                    )}
                  </div>

                  <div className="recent-session-main">
                    <strong>
                      {
                        session.subjectName
                      }
                    </strong>
                    <span className="mono">
                      {formatTimeOfDay(
                        session.completedAt,
                        locale,
                      )}
                    </span>
                  </div>

                  <div className="recent-session-meta">
                    <strong className="mono">
                      {formatTime(session.actualDuration, language)}
                    </strong>

                    {session.interruptions >
                      0 && (
                      <span>
                        {
                          session.interruptions
                        }{' '}
                        {tr(
                          session.interruptions === 1
                            ? 'interruption'
                            : 'interruptions',
                          'وەستاندن',
                        )}
                      </span>
                    )}

                    {session.totalPausedSeconds >
                      0 && (
                      <span>
                        +
                        {formatTime(
                          session.totalPausedSeconds,
                          language,
                        )}{' '}
                        {tr('paused', 'وەستاو')}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className={
                      pendingDelete ===
                      session.id
                        ? 'recent-session-delete confirm'
                        : 'recent-session-delete'
                    }
                    onClick={() =>
                      requestDeleteSession(
                        session.id,
                      )
                    }
                    onBlur={() => {
                      if (
                        pendingDelete ===
                        session.id
                      ) {
                        setPendingDelete(
                          null,
                        )
                      }
                    }}
                    title={
                      pendingDelete ===
                      session.id
                        ? t(
                            'confirmDeleteSession',
                          )
                        : t(
                            'deleteSession',
                          )
                    }
                    aria-label={
                      pendingDelete ===
                      session.id
                        ? t(
                            'confirmDeleteSession',
                          )
                        : t(
                            'deleteSession',
                          )
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </article>
              ),
            )}
        </div>
      )}
    </section>
  )
}
