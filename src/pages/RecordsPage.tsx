import {
  CalendarCheck2,
  Clock3,
  Flame,
  Medal,
  Sparkles,
  Trophy,
} from 'lucide-react'
import type {
  StudySession,
} from '../types'
import {
  useI18n,
} from '../useI18n'
import {
  getPersonalRecords,
} from '../utils/personalRecords'
import {
  getRecordsViewModel,
} from '../utils/recordsViewModel'
import PageContainer from './PageContainer'
import PageHeader from '../components/layout/PageHeader'

interface RecordsPageProps {
  sessions: StudySession[]
  weeklyGoal: number
}

function prettyDate(
  value: string | null,
): string {
  if (!value) {
    return 'Still waiting'
  }

  const date =
    new Date(
      `${value}T00:00:00`,
    )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return date.toLocaleDateString(
    undefined,
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    },
  )
}

export default function RecordsPage({
  sessions,
  weeklyGoal,
}: RecordsPageProps) {
  const { t } = useI18n()

  const records =
    getPersonalRecords(
      sessions,
      weeklyGoal,
    )

  const items =
    getRecordsViewModel(
      records,
      t('days'),
    )

  const completedSessions =
    sessions.filter(
      (session) =>
        session.completed &&
        session.actualDuration > 0,
    )

  const hasRecords =
    completedSessions.length > 0

  return (
    <PageContainer>
      <PageHeader
        title={t('records')}
        description={t(
          'recordsPageQuestion',
        )}
      />

      {!hasRecords ? (
        <section className="glass-panel records-empty">
          <Trophy size={24} />
          <h2>
            Your records start with
            the first completed
            session.
          </h2>
          <p>
            FOCUS will preserve your
            strongest days, weeks,
            subjects and streaks as
            your history grows.
          </p>
        </section>
      ) : (
        <>
          <section className="records-hero-grid">
            <article className="glass-panel records-hero primary">
              <div className="records-hero-icon">
                <Trophy
                  size={21}
                />
              </div>

              <div className="eyebrow">
                Best day
              </div>

              <strong>
                {
                  records.bestDayMinutes
                }
                m
              </strong>

              <span>
                {prettyDate(
                  records.bestDayDate,
                )}
              </span>
            </article>

            <article className="glass-panel records-hero">
              <div className="records-hero-icon">
                <Flame
                  size={21}
                />
              </div>

              <div className="eyebrow">
                Best streak
              </div>

              <strong>
                {
                  records.bestDailyStreak
                }{' '}
                days
              </strong>

              <span>
                Consecutive active
                study days
              </span>
            </article>

            <article className="glass-panel records-hero">
              <div className="records-hero-icon">
                <Medal
                  size={21}
                />
              </div>

              <div className="eyebrow">
                Strongest subject
              </div>

              <strong className="records-hero-subject">
                {records.bestSubjectName ??
                  '—'}
              </strong>

              <span>
                {
                  records.bestSubjectMinutes
                }
                m accumulated
              </span>
            </article>
          </section>

          <section className="glass-panel records-story">
            <div className="records-story-head">
              <div>
                <div className="focus-pulse-kicker">
                  <Sparkles
                    size={15}
                  />
                  Personal bests
                </div>

                <h2>
                  Your strongest
                  study moments
                </h2>
              </div>

              <span className="mono">
                {
                  completedSessions.length
                }{' '}
                completed sessions
              </span>
            </div>

            <div className="records-grid">
              {items.map(
                (
                  item,
                  index,
                ) => (
                  <article
                    key={
                      item.id
                    }
                    className="records-metric-card"
                  >
                    <div className="records-metric-index">
                      {String(
                        index + 1,
                      ).padStart(
                        2,
                        '0',
                      )}
                    </div>

                    <span>
                      {
                        item.label
                      }
                    </span>

                    <strong>
                      {
                        item.value
                      }
                    </strong>
                  </article>
                ),
              )}
            </div>
          </section>

          <section className="records-context-grid">
            <article className="glass-panel records-context-card">
              <Clock3
                size={18}
              />
              <div>
                <span>
                  Longest session
                </span>
                <strong>
                  {Math.round(
                    records.longestSessionSeconds /
                      60,
                  )}
                  m
                </strong>
              </div>
            </article>

            <article className="glass-panel records-context-card">
              <CalendarCheck2
                size={18}
              />
              <div>
                <span>
                  Best week began
                </span>
                <strong>
                  {prettyDate(
                    records.bestWeekStart,
                  )}
                </strong>
              </div>
            </article>

            <article className="glass-panel records-context-card">
              <Flame
                size={18}
              />
              <div>
                <span>
                  Strongest weekday
                </span>
                <strong>
                  {records.bestDayWeekday ??
                    'Still learning'}
                </strong>
              </div>
            </article>
          </section>
        </>
      )}
    </PageContainer>
  )
}
