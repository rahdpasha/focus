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

function formatMinutesHuman(
  minutes: number,
  language: 'en' | 'ku',
): string {
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60

  if (hours > 0) {
    if (remaining > 0) {
      return language === 'ku'
        ? `${hours} کاتژمێر ${remaining} خولەک`
        : `${hours}h ${remaining}m`
    }

    return language === 'ku'
      ? `${hours} کاتژمێر`
      : `${hours}h`
  }

  return language === 'ku'
    ? `${minutes} خولەک`
    : `${minutes}m`
}

function formatDuration(
  seconds: number,
  language: 'en' | 'ku',
): string {
  const safeSeconds = Math.max(0, Math.round(seconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const remainingSeconds = safeSeconds % 60

  if (hours > 0) {
    if (minutes > 0) {
      return language === 'ku'
        ? `${hours} کاتژمێر ${minutes} خولەک`
        : `${hours}h ${minutes}m`
    }

    return language === 'ku'
      ? `${hours} کاتژمێر`
      : `${hours}h`
  }

  if (minutes > 0) {
    return remainingSeconds > 0
      ? language === 'ku'
        ? `${minutes} خولەک ${remainingSeconds} چرکە`
        : `${minutes}m ${remainingSeconds}s`
      : language === 'ku'
        ? `${minutes} خولەک`
        : `${minutes}m`
  }

  return language === 'ku'
    ? `${remainingSeconds} چرکە`
    : `${remainingSeconds}s`
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
          ? locale === 'ku-IQ'
            ? 'ئەمڕۆ'
            : 'Today'
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
  const { language, t, tr } = useI18n()
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
  const dayPulse = buildDayPulse(sessions, locale).map((day) => ({
    ...day,
    label: day.label === 'Today' ? tr('Today', 'ئەمڕۆ') : day.label,
  }))
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
      ? tr('Your signal is waiting.', 'هێشتا داتای سەرنجت چاوەڕوانە.')
      : weeklyProgress >= 100
        ? tr('You cleared the weekly target.', 'ئامانجی هەفتانەت تەواو کرد.')
        : activeDays >= 5
          ? tr('Your consistency is building.', 'بەردەوامییەکەت بەهێزتر دەبێت.')
          : tr('Your focus rhythm is taking shape.', 'ڕێتمی سەرنجت خەریکە شێوە دەگرێت.')

  return (
    <div className="stats-v4">
      <section className="stats-v4-hero">
        <div className="stats-v4-hero-grid" />

        <div className="stats-v4-hero-copy">
          <div className="stats-v4-kicker">
            <BrainCircuit size={15} />
            {tr('Focus intelligence', 'زیرەکی سەرنج')}
          </div>

          <h1>{headline}</h1>

          <p>
            {tr('A live read of your time, rhythm, consistency and strongest performance patterns — without noisy dashboard charts.', 'خوێندنەوەیەکی ڕاستەوخۆ بۆ کات، ڕێتم، بەردەوامی و بەهێزترین شێوازی کارکردنت ـ بەبێ گرافی ئاڵۆز.')}
          </p>

          <div className="stats-v4-hero-chips">
            <span>
              <Flame size={13} />
              {streakStats.currentDailyStreak} {tr('day streak', 'ڕۆژ زنجیرە')}
            </span>
            <span>
              <CalendarDays size={13} />
              {activeDays}/7 {tr('active days', 'ڕۆژی چالاک')}
            </span>
            <span>
              <Target size={13} />
              {weeklyProgress}% {tr('weekly goal', 'ئامانجی هەفتانە')}
            </span>
          </div>
        </div>

        <div className="stats-v4-orb">
          <div className="stats-v4-orb-ring">
            <span>{tr('This week', 'ئەم هەفتەیە')}</span>
            <strong>{formatDuration(overview.weekFocusSeconds, language)}</strong>
            <small>{weeklyProgress}% {tr('of target', 'لە ئامانج')}</small>
          </div>
        </div>
      </section>

      <section className="stats-v4-metrics">
        <article>
          <div className="stats-v4-metric-icon">
            <Zap size={17} />
          </div>
          <span>{t('today')}</span>
          <strong>{formatDuration(overview.todayFocusSeconds, language)}</strong>
          <small>{tr('focused today', 'سەرنجی ئەمڕۆ')}</small>
        </article>

        <article>
          <div className="stats-v4-metric-icon">
            <CalendarDays size={17} />
          </div>
          <span>{t('last7Days')}</span>
          <strong>{formatDuration(overview.weekFocusSeconds, language)}</strong>
          <small>{activeDays} {tr('active days', 'ڕۆژی چالاک')}</small>
        </article>

        <article>
          <div className="stats-v4-metric-icon">
            <Clock3 size={17} />
          </div>
          <span>{t('totalFocus')}</span>
          <strong>{formatDuration(overview.totalFocusSeconds, language)}</strong>
          <small>{tr('all recorded focus', 'هەموو سەرنجی تۆمارکراو')}</small>
        </article>

        <article>
          <div className="stats-v4-metric-icon">
            <Activity size={17} />
          </div>
          <span>{t('sessions')}</span>
          <strong>{completed.length}</strong>
          <small>{tr('completed sessions', 'سێشنە تەواوکراوەکان')}</small>
        </article>

        <article>
          <div className="stats-v4-metric-icon">
            <Gauge size={17} />
          </div>
          <span>{t('avgSession')}</span>
          <strong>{formatDuration(overview.averageSessionSeconds, language)}</strong>
          <small>{tr('average depth', 'ناوەندی قووڵی')}</small>
        </article>

        <article>
          <div className="stats-v4-metric-icon">
            <TimerReset size={17} />
          </div>
          <span>{t('longest')}</span>
          <strong>{formatDuration(overview.longestSessionSeconds, language)}</strong>
          <small>{tr('longest session', 'درێژترین سێشن')}</small>
        </article>
      </section>

      <section className="stats-v4-rhythm">
        <div className="stats-v4-section-head">
          <div>
            <span>{tr('7-day pattern', 'شێوازی ٧ ڕۆژ')}</span>
            <h2>{tr('Focus rhythm', 'ڕێتمی سەرنج')}</h2>
          </div>

          <div className="stats-v4-head-stat">
            <span>{tr('Strongest day', 'بەهێزترین ڕۆژ')}</span>
            <strong>
              {strongestDay && strongestDay.seconds > 0
                ? `${strongestDay.label} · ${formatDuration(
                    strongestDay.seconds,
                    language,
                  )}`
                : tr('Still learning', 'هێشتا فێردەبێت')}
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
                title={`${day.label}: ${formatDuration(day.seconds, language)}`}
              >
                <div className="stats-v4-day-top">
                  <span>{day.shortLabel}</span>
                  <small>
                    {day.sessions}{language === 'ku' ? ' سێشن' : 'x'}
                  </small>
                </div>

                <div className="stats-v4-signal-track">
                  <div
                    className="stats-v4-signal-fill"
                    style={{ height: `${intensity}%` }}
                  />
                </div>

                <strong>{formatDuration(day.seconds, language)}</strong>
              </article>
            )
          })}
        </div>
      </section>

      <div className="stats-v4-split">
        <section className="stats-v4-weekly">
          <div className="stats-v4-section-head">
            <div>
              <span>{tr('Weekly goal', 'ئامانجی هەفتانە')}</span>
              <h2>{tr('Weekly execution', 'جێبەجێکردنی هەفتانە')}</h2>
            </div>

            <div className="stats-v4-head-stat">
              <span>{tr('Target', 'ئامانج')}</span>
              <strong>
                {weeklyGoal}
                {language === 'ku'
                  ? ' خولەک / '
                  : 'm / '}
                {tr('week', 'هەفتە')}
              </strong>
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
                      {formatMinutesHuman(item.completedMinutes, language)}
                    </strong>
                  </div>

                  <div className="stats-v4-week-score">
                    <strong>{item.progressPercent}%</strong>
                    <span>{item.completed ? tr('Complete', 'تەواو') : tr('In progress', 'لە بەردەوامیدایە')}</span>
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
              <span>{tr('Focus by subject', 'سەرنج بەپێی بابەت')}</span>
              <h2>{tr('Subject gravity', 'کێشی بابەتەکان')}</h2>
            </div>
            <Layers3 size={20} />
          </div>

          {subjectPulse.length === 0 ? (
            <div className="stats-v4-empty">
              {tr('Complete sessions to reveal your subject balance.', 'سێشن تەواو بکە بۆ بینینی هاوسەنگی بابەتەکانت.')}
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
                        {subject.sessions} {tr('sessions', 'سێشن')} ·{' '}
                        {formatDuration(subject.seconds, language)}
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
            <span>{tr('Personal bests', 'باشترینەکانی تۆ')}</span>
            <h2>{tr('Your performance vault', 'تۆماری باشترین کارکردنت')}</h2>
          </div>
          <Trophy size={21} />
        </div>

        <div className="stats-v4-record-grid">
          <article className="hero-record">
            <Medal size={20} />
            <span>{tr('Longest session', 'درێژترین سێشن')}</span>
            <strong>
              {formatDuration(personalRecords.longestSessionSeconds, language)}
            </strong>
            <small>{tr('deepest single focus block', 'قووڵترین بڵۆکی تاکە سەرنج')}</small>
          </article>

          <article>
            <Sparkles size={18} />
            <span>{tr('Best day', 'باشترین ڕۆژ')}</span>
            <strong>
              {formatMinutesHuman(personalRecords.bestDayMinutes, language)}
            </strong>
            <small>{tr('highest daily output', 'زۆرترین ئەنجامی ڕۆژانە')}</small>
          </article>

          <article>
            <Flame size={18} />
            <span>{tr('Best week', 'باشترین هەفتە')}</span>
            <strong>
              {formatMinutesHuman(personalRecords.bestWeekMinutes, language)}
            </strong>
            <small>{tr('strongest seven-day run', 'بەهێزترین ٧ ڕۆژ')}</small>
          </article>

          <article>
            <Layers3 size={18} />
            <span>{tr('Best subject', 'باشترین بابەت')}</span>
            <strong title={personalRecords.bestSubjectName ?? undefined}>
              {personalRecords.bestSubjectName ?? '—'}
            </strong>
            <small>
              {formatMinutesHuman(personalRecords.bestSubjectMinutes, language)}
            </small>
          </article>
        </div>
      </section>
    </div>
  )
}
