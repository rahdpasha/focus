import {
  Activity,
  BrainCircuit,
  CalendarDays,
  Clock3,
  Flame,
  Gauge,
  Layers3,
  Medal,
  Sparkles,
  Target,
  TimerReset,
  Trophy,
  Zap,
} from 'lucide-react'
import type { StudySession } from '../../types'
import { useI18n } from '../../useI18n'
import {
  getStartOfWeek,
  getStreakStats,
  type WeeklyGoalMap,
} from '../../utils/goalHistory'
import { getPersonalRecords } from '../../utils/personalRecords'
import {
  getStatisticsOverview,
  getStatisticsWeeklyHistory,
} from '../../utils/statisticsInsights'
import AdvancedInsights from './AdvancedInsights'

interface StatisticsProps {
  sessions: StudySession[]
  weeklyGoal: number
  weeklyGoalsHistory: WeeklyGoalMap
}

interface DayPulse {
  key: string
  label: string
  shortLabel: string
  seconds: number
  sessions: number
}

interface SubjectPulse {
  name: string
  color: string
  seconds: number
  sessions: number
}

function formatMinutesHuman(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60

  if (hours > 0) {
    return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`
  }

  return `${minutes}m`
}

function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.round(seconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const remainingSeconds = safeSeconds % 60

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }

  if (minutes > 0) {
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`
  }

  return `${remainingSeconds}s`
}

function formatWeekLabel(
  date: Date,
  locale: string,
  currentWeek: boolean,
): string {
  if (currentWeek) {
    return locale === 'ku-IQ' ? 'ئەم هەفتە' : 'This week'
  }

  const end = new Date(date)
  end.setDate(end.getDate() + 6)

  const startLabel = date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
  })

  const endLabel = end.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
  })

  return `${startLabel} - ${endLabel}`
}

function getWeekKeySafe(): string {
  const start = getStartOfWeek(new Date())
  const year = start.getFullYear()
  const month = String(start.getMonth() + 1).padStart(2, '0')
  const day = String(start.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildDayPulse(
  sessions: StudySession[],
  locale: string,
): DayPulse[] {
  const now = new Date()

  return Array.from({ length: 7 }, (_, index) => {
    const offset = 6 - index
    const start = new Date(now)
    start.setDate(start.getDate() - offset)
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setDate(end.getDate() + 1)

    const daySessions = sessions.filter((session) => {
      if (!session.completed) return false
      const completedAt = new Date(session.completedAt).getTime()
      return completedAt >= start.getTime() && completedAt < end.getTime()
    })

    const seconds = daySessions.reduce(
      (sum, session) => sum + Math.max(0, session.actualDuration),
      0,
    )

    return {
      key: start.toISOString(),
      label:
        offset === 0
          ? 'Today'
          : start.toLocaleDateString(locale, { weekday: 'long' }),
      shortLabel: start.toLocaleDateString(locale, {
        weekday: 'short',
      }),
      seconds,
      sessions: daySessions.length,
    }
  })
}

function buildSubjectPulse(
  sessions: StudySession[],
): SubjectPulse[] {
  const map = new Map<
    string,
    { color: string; seconds: number; sessions: number }
  >()

  sessions.forEach((session) => {
    if (!session.completed || session.actualDuration <= 0) return

    const current = map.get(session.subjectName) ?? {
      color: session.subjectColor,
      seconds: 0,
      sessions: 0,
    }

    current.seconds += session.actualDuration
    current.sessions += 1
    map.set(session.subjectName, current)
  })

  return Array.from(map.entries())
    .map(([name, value]) => ({
      name,
      ...value,
    }))
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, 6)
}

export default function Statistics({
  sessions,
  weeklyGoal,
  weeklyGoalsHistory,
}: StatisticsProps) {
  const { language, t } = useI18n()
  const locale = language === 'ku' ? 'ku-IQ' : 'en-US'

  const overview = getStatisticsOverview(sessions)
  const completed = sessions.filter((session) => session.completed)
  const weeklyHistory = getStatisticsWeeklyHistory(
    sessions,
    weeklyGoalsHistory,
    weeklyGoal,
    4,
  )
  const personalRecords = getPersonalRecords(sessions, weeklyGoal)
  const streakStats = getStreakStats(
    sessions,
    weeklyGoalsHistory,
    weeklyGoal,
  )
  const dayPulse = buildDayPulse(sessions, locale)
  const subjectPulse = buildSubjectPulse(sessions)

  const maxDaySeconds = Math.max(
    1,
    ...dayPulse.map((day) => day.seconds),
  )
  const maxSubjectSeconds = Math.max(
    1,
    ...subjectPulse.map((subject) => subject.seconds),
  )

  const currentWeek = weeklyHistory[0]
  const weeklyProgress = currentWeek?.progressPercent ?? 0
  const activeDays = dayPulse.filter((day) => day.seconds > 0).length

  const strongestDay = [...dayPulse].sort(
    (a, b) => b.seconds - a.seconds,
  )[0]

  const headline =
    overview.weekFocusSeconds <= 0
      ? 'Your signal is waiting.'
      : weeklyProgress >= 100
        ? 'You cleared the weekly target.'
        : activeDays >= 5
          ? 'Your consistency is building.'
          : 'Your focus rhythm is taking shape.'

  return (
    <div className="stats-v4">
      <section className="stats-v4-hero">
        <div className="stats-v4-hero-grid" />

        <div className="stats-v4-hero-copy">
          <div className="stats-v4-kicker">
            <BrainCircuit size={15} />
            Focus intelligence
          </div>

          <h1>{headline}</h1>

          <p>
            A live read of your time, rhythm, consistency and strongest
            performance patterns — without noisy dashboard charts.
          </p>

          <div className="stats-v4-hero-chips">
            <span>
              <Flame size={13} />
              {streakStats.currentDailyStreak}d streak
            </span>
            <span>
              <CalendarDays size={13} />
              {activeDays}/7 active days
            </span>
            <span>
              <Target size={13} />
              {weeklyProgress}% weekly goal
            </span>
          </div>
        </div>

        <div className="stats-v4-orb">
          <div className="stats-v4-orb-ring">
            <span>This week</span>
            <strong>{formatDuration(overview.weekFocusSeconds)}</strong>
            <small>{weeklyProgress}% of target</small>
          </div>
        </div>
      </section>

      <section className="stats-v4-metrics">
        <article>
          <div className="stats-v4-metric-icon">
            <Zap size={17} />
          </div>
          <span>{t('today')}</span>
          <strong>{formatDuration(overview.todayFocusSeconds)}</strong>
          <small>focused today</small>
        </article>

        <article>
          <div className="stats-v4-metric-icon">
            <CalendarDays size={17} />
          </div>
          <span>{t('last7Days')}</span>
          <strong>{formatDuration(overview.weekFocusSeconds)}</strong>
          <small>{activeDays} active days</small>
        </article>

        <article>
          <div className="stats-v4-metric-icon">
            <Clock3 size={17} />
          </div>
          <span>{t('totalFocus')}</span>
          <strong>{formatDuration(overview.totalFocusSeconds)}</strong>
          <small>all recorded focus</small>
        </article>

        <article>
          <div className="stats-v4-metric-icon">
            <Activity size={17} />
          </div>
          <span>{t('sessions')}</span>
          <strong>{completed.length}</strong>
          <small>completed sessions</small>
        </article>

        <article>
          <div className="stats-v4-metric-icon">
            <Gauge size={17} />
          </div>
          <span>{t('avgSession')}</span>
          <strong>{formatDuration(overview.averageSessionSeconds)}</strong>
          <small>average depth</small>
        </article>

        <article>
          <div className="stats-v4-metric-icon">
            <TimerReset size={17} />
          </div>
          <span>{t('longest')}</span>
          <strong>{formatDuration(overview.longestSessionSeconds)}</strong>
          <small>longest session</small>
        </article>
      </section>

      <section className="stats-v4-rhythm">
        <div className="stats-v4-section-head">
          <div>
            <span>7-day pattern</span>
            <h2>Focus rhythm</h2>
          </div>

          <div className="stats-v4-head-stat">
            <span>Strongest day</span>
            <strong>
              {strongestDay && strongestDay.seconds > 0
                ? `${strongestDay.label} · ${formatDuration(
                    strongestDay.seconds,
                  )}`
                : 'Still learning'}
            </strong>
          </div>
        </div>

        <div className="stats-v4-day-grid">
          {dayPulse.map((day) => {
            const intensity = Math.max(
              day.seconds > 0 ? 8 : 2,
              Math.round((day.seconds / maxDaySeconds) * 100),
            )

            return (
              <article
                key={day.key}
                className={day.seconds > 0 ? 'active' : ''}
                title={`${day.label}: ${formatDuration(day.seconds)}`}
              >
                <div className="stats-v4-day-top">
                  <span>{day.shortLabel}</span>
                  <small>{day.sessions}x</small>
                </div>

                <div className="stats-v4-signal-track">
                  <div
                    className="stats-v4-signal-fill"
                    style={{ height: `${intensity}%` }}
                  />
                </div>

                <strong>{formatDuration(day.seconds)}</strong>
              </article>
            )
          })}
        </div>
      </section>

      <div className="stats-v4-split">
        <section className="stats-v4-weekly">
          <div className="stats-v4-section-head">
            <div>
              <span>Weekly goal</span>
              <h2>Weekly execution</h2>
            </div>

            <div className="stats-v4-head-stat">
              <span>Target</span>
              <strong>{weeklyGoal}m / week</strong>
            </div>
          </div>

          <div className="stats-v4-week-stack">
            {weeklyHistory.map((item, index) => (
              <article
                key={item.weekStart}
                className={index === 0 ? 'current' : ''}
              >
                <div className="stats-v4-week-copy">
                  <div>
                    <span>
                      {formatWeekLabel(
                        new Date(`${item.weekStart}T00:00:00`),
                        locale,
                        item.weekStart === getWeekKeySafe(),
                      )}
                    </span>
                    <strong>
                      {formatMinutesHuman(item.completedMinutes)}
                    </strong>
                  </div>

                  <div className="stats-v4-week-score">
                    <strong>{item.progressPercent}%</strong>
                    <span>{item.completed ? 'Complete' : 'In progress'}</span>
                  </div>
                </div>

                <div className="stats-v4-week-track">
                  <div
                    className={item.completed ? 'complete' : ''}
                    style={{
                      width: `${Math.min(100, item.progressPercent)}%`,
                    }}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="stats-v4-subjects">
          <div className="stats-v4-section-head">
            <div>
              <span>Focus by subject</span>
              <h2>Subject gravity</h2>
            </div>
            <Layers3 size={20} />
          </div>

          {subjectPulse.length === 0 ? (
            <div className="stats-v4-empty">
              Complete sessions to reveal your subject balance.
            </div>
          ) : (
            <div className="stats-v4-subject-stack">
              {subjectPulse.map((subject, index) => (
                <article key={subject.name}>
                  <div className="stats-v4-subject-rank">
                    {String(index + 1).padStart(2, '0')}
                  </div>

                  <div className="stats-v4-subject-main">
                    <div>
                      <strong>{subject.name}</strong>
                      <span>
                        {subject.sessions} sessions ·{' '}
                        {formatDuration(subject.seconds)}
                      </span>
                    </div>

                    <div className="stats-v4-subject-track">
                      <div
                        style={{
                          width: `${Math.max(
                            4,
                            Math.round(
                              (subject.seconds / maxSubjectSeconds) * 100,
                            ),
                          )}%`,
                          background: subject.color,
                        }}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <AdvancedInsights sessions={sessions} />

      <section className="stats-v4-records">
        <div className="stats-v4-section-head">
          <div>
            <span>Personal bests</span>
            <h2>Your performance vault</h2>
          </div>
          <Trophy size={21} />
        </div>

        <div className="stats-v4-record-grid">
          <article className="hero-record">
            <Medal size={20} />
            <span>Longest session</span>
            <strong>
              {formatDuration(personalRecords.longestSessionSeconds)}
            </strong>
            <small>deepest single focus block</small>
          </article>

          <article>
            <Sparkles size={18} />
            <span>Best day</span>
            <strong>
              {formatMinutesHuman(personalRecords.bestDayMinutes)}
            </strong>
            <small>highest daily output</small>
          </article>

          <article>
            <Flame size={18} />
            <span>Best week</span>
            <strong>
              {formatMinutesHuman(personalRecords.bestWeekMinutes)}
            </strong>
            <small>strongest seven-day run</small>
          </article>

          <article>
            <Layers3 size={18} />
            <span>Best subject</span>
            <strong title={personalRecords.bestSubjectName ?? undefined}>
              {personalRecords.bestSubjectName ?? '—'}
            </strong>
            <small>
              {formatMinutesHuman(personalRecords.bestSubjectMinutes)}
            </small>
          </article>
        </div>
      </section>
    </div>
  )
}
