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
  locale: string,
  waitingLabel: string,
): string {
  if (!value) {
    return waitingLabel
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
    locale,
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
  const { language, t, tr } = useI18n()
  const locale = language === 'ku' ? 'ku-IQ' : 'en-US'

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
            {tr('Your first record starts with one session.', 'یەکەم تۆمارەکەت بە یەک سێشن دەست پێ دەکات.')}
          </h2>
          <p>
            {tr('Complete a focus session and FOCUS will begin saving the days, weeks, subjects and streaks that become your personal bests.', 'سێشنێکی سەرنج تەواو بکە و FOCUS ڕۆژ، هەفتە، بابەت و زنجیرە باشترینەکانت پاشەکەوت دەکات.')}
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
                {tr('Best day', 'باشترین ڕۆژ')}
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
                  locale,
                  tr('Still waiting', 'هێشتا چاوەڕوانە'),
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
                {tr('Best streak', 'باشترین زنجیرە')}
              </div>

              <strong>
                {
                  records.bestDailyStreak
                }{' '}
                {tr('days', 'ڕۆژ')}
              </strong>

              <span>
                {tr('Your longest run of active study days', 'درێژترین زنجیرەی ڕۆژە چالاکەکانی خوێندنت')}
              </span>
            </article>

            <article className="glass-panel records-hero">
              <div className="records-hero-icon">
                <Medal
                  size={21}
                />
              </div>

              <div className="eyebrow">
                {tr('Strongest subject', 'بەهێزترین بابەت')}
              </div>

              <strong className="records-hero-subject">
                {records.bestSubjectName ??
                  '—'}
              </strong>

              <span>
                {
                  records.bestSubjectMinutes
                }
                m {tr('accumulated', 'کۆکراوەتەوە')}
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
                  {tr('Performance archive', 'ئەرشیفی کارکردن')}
                </div>

                <h2>
                  {tr('The work worth remembering', 'ئەو کارەی شایەنی بیرکردنەوەیە')}
                </h2>
              </div>

              <span className="mono">
                {
                  completedSessions.length
                }{' '}
                {tr('completed sessions', 'سێشنی تەواوکراو')}
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
                  {tr('Longest session', 'درێژترین سێشن')}
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
                  {tr('Best week began', 'باشترین هەفتە دەستی پێکرد')}
                </span>
                <strong>
                  {prettyDate(
                    records.bestWeekStart,
                    locale,
                    tr('Still waiting', 'هێشتا چاوەڕوانە'),
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
                  {tr('Strongest weekday', 'بەهێزترین ڕۆژی هەفتە')}
                </span>
                <strong>
                  {records.bestDayWeekday ??
                    tr('Still learning', 'هێشتا فێردەبێت')}
                </strong>
              </div>
            </article>
          </section>
        </>
      )}
    </PageContainer>
  )
}
