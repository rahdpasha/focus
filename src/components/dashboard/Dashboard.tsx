import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Flame,
  Layers3,
} from 'lucide-react'
import type {
  Subject,
  StudySession,
} from '../../types'
import type {
  RoutineItem,
  RoutineSessionContext,
} from '../../storage/types'
import FocusPulse from './FocusPulse'
import RecentSessions from './RecentSessions'
import StatCard from './StatCard'
import {
  getStreakStats,
} from '../../utils/goalHistory'
import {
  getStudyPlan,
} from '../../utils/studyPlan'
import { useI18n } from '../../useI18n'
import {
  getRotationItemForDate,
  getRoutineItemsForDate,
  getRoutineMinutesForDate,
  toRoutineDateKey,
} from '../../utils/routine'

interface DashboardProps {
  subjects: Subject[]
  sessions: StudySession[]
  dailyGoal: number
  weeklyGoal: number
  routineItems: RoutineItem[]
  onDeleteSession: (
    id: string,
  ) => void
  onStartRecommendedSession: (
    subjectId?: string,
    minutes?: number,
    routineContext?: RoutineSessionContext,
  ) => void
}

function startOfDay(
  date: Date,
): number {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value.getTime()
}

function startOfWeek(
  date: Date,
): number {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)

  const weekday =
    value.getDay()
  const offset =
    weekday === 0
      ? 6
      : weekday - 1

  value.setDate(
    value.getDate() - offset,
  )

  return value.getTime()
}

function minutesLabel(
  minutes: number,
): string {
  const hours =
    Math.floor(minutes / 60)
  const remainder =
    minutes % 60

  if (hours === 0) {
    return `${remainder}m`
  }

  return remainder > 0
    ? `${hours}h ${remainder}m`
    : `${hours}h`
}

export default function Dashboard({
  subjects,
  sessions,
  dailyGoal,
  weeklyGoal,
  routineItems,
  onDeleteSession,
  onStartRecommendedSession,
}: DashboardProps) {
  const { language, tr } = useI18n()
  const now = new Date()
  const todayStart =
    startOfDay(now)
  const weekStart =
    startOfWeek(now)

  const completed =
    sessions.filter(
      (session) =>
        session.completed &&
        session.actualDuration > 0,
    )

  const todaySessions =
    completed.filter(
      (session) =>
        startOfDay(
          new Date(
            session.completedAt,
          ),
        ) === todayStart,
    )

  const weekSessions =
    completed.filter(
      (session) =>
        new Date(
          session.completedAt,
        ).getTime() >=
        weekStart,
    )

  const todayMinutes =
    Math.round(
      todaySessions.reduce(
        (sum, session) =>
          sum +
          session.actualDuration,
        0,
      ) / 60,
    )

  const weekMinutes =
    Math.round(
      weekSessions.reduce(
        (sum, session) =>
          sum +
          session.actualDuration,
        0,
      ) / 60,
    )

  const streak =
    getStreakStats(
      sessions,
      {},
      weeklyGoal,
    ).currentDailyStreak

  const plan =
    getStudyPlan(
      sessions,
      subjects,
      weeklyGoal,
      dailyGoal,
    )

  const todaysRoutine =
    getRoutineItemsForDate(
      routineItems,
      now,
    )

  const todaysRotation =
    getRotationItemForDate(
      routineItems,
      now,
    )

  const routineCompleted =
    todaysRoutine.filter(
      (item) =>
        getRoutineMinutesForDate(
          item,
          sessions,
          now,
        ) >= item.targetMinutes,
    ).length

  const routinePreview =
    todaysRoutine.slice(0, 4)
  const hiddenRoutineCount =
    Math.max(
      0,
      todaysRoutine.length -
        routinePreview.length,
    )

  return (
    <main className="dashboard dashboard-v3">
      <header className="dashboard-v3-header">
        <div>
          <div className="eyebrow">
            {tr('Today', 'ئەمڕۆ')}
          </div>
          <h1>
            {tr('Make the next session count.', 'سێشنی داهاتوو بەهێز بکە.')}
          </h1>
          <p>
            {tr("Your next move, current momentum, and today's plan — all in one place.", 'هەنگاوی داهاتوو، بەردەوامی ئێستا و پلانی ئەمڕۆ هەمووی لە یەک شوێندایە.')}
          </p>
        </div>

        <div className="dashboard-date">
          <CalendarDays
            size={15}
          />
          {now.toLocaleDateString(
            language === 'ku' ? 'ku-IQ' : 'en-US',
            {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            },
          )}
        </div>
      </header>

      <FocusPulse
        sessions={sessions}
        subjects={subjects}
        dailyGoal={dailyGoal}
        weeklyGoal={weeklyGoal}
        onStart={
          onStartRecommendedSession
        }
      />

      <section className="dashboard-stat-grid">
        <StatCard
          icon={Clock3}
          label={tr('Today', 'ئەمڕۆ')}
          value={minutesLabel(
            todayMinutes,
          )}
          accentColor="var(--primary)"
        />

        <StatCard
          icon={Layers3}
          label={tr("Today's sessions", 'سێشنەکانی ئەمڕۆ')}
          value={String(
            todaySessions.length,
          )}
          accentColor="var(--cyber-blue)"
        />

        <StatCard
          icon={Flame}
          label={tr('Current streak', 'زنجیرەی ئێستا')}
          value={`${streak}d`}
          accentColor="var(--energy)"
        />

        <StatCard
          icon={Clock3}
          label={tr('This week', 'ئەم هەفتەیە')}
          value={minutesLabel(
            weekMinutes,
          )}
          accentColor="var(--teal)"
        />
      </section>

      <section className="glass-panel dashboard-routine-preview">
        <div className="dashboard-section-head dashboard-routine-head">
          <div>
            <div className="eyebrow">
              {tr("Today's routine", 'ڕوتینی ئەمڕۆ')}
            </div>
            <h2>
              {routineCompleted}/{
                todaysRoutine.length
              } {tr('complete', 'تەواو')}
            </h2>
          </div>

          {todaysRotation && (
            <span className="mono">
              {tr('Rotation', 'گۆڕانکاری')} · {
                todaysRotation.title
              }
            </span>
          )}
        </div>

        {todaysRoutine.length === 0 ? (
          <div className="dashboard-empty">
            {tr('Add fixed or rotating study items in Routine.', 'لە بەشی ڕوتیندا بڕگەی جێگیر یان گۆڕاو زیاد بکە.')}
          </div>
        ) : (
          <div className="dashboard-routine-grid">
            {routinePreview.map(
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
                    now,
                  )

                const done =
                  minutes >=
                  item.targetMinutes

                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!subject}
                    onClick={() =>
                      onStartRecommendedSession(
                        item.subjectId,
                        item.targetMinutes,
                        {
                          itemId:
                            item.id,
                          routineDate:
                            toRoutineDateKey(
                              now,
                            ),
                        },
                      )
                    }
                    className="dashboard-routine-card"
                  >
                    <span
                      aria-label={
                        done
                          ? tr('Completed', 'تەواوکراو')
                          : tr('Pending', 'چاوەڕوان')
                      }
                      className={`dashboard-routine-state ${done ? 'done' : ''}`}
                    >
                      {done
                        ? '✅'
                        : '⬜'}
                    </span>

                    <span className="dashboard-routine-copy">
                      <strong>
                        {item.title}
                      </strong>
                      <small>
                        {minutes}/{
                          item.targetMinutes
                        }m · {
                          item.mode ===
                          'rotation'
                            ? tr('rotation', 'گۆڕاو')
                            : tr('daily', 'ڕۆژانە')
                        }
                      </small>
                    </span>
                  </button>
                )
              },
            )}

            {hiddenRoutineCount > 0 && (
              <div className="dashboard-routine-more">
                +{hiddenRoutineCount} {tr('more in Routine', 'زیاتر لە ڕوتین')}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="dashboard-v3-grid">
        <div className="glass-panel dashboard-route">
          <div className="dashboard-section-head">
            <div>
              <div className="eyebrow">
                {tr("Today's route", 'ڕێڕەوی ئەمڕۆ')}
              </div>
              <h2>
                {tr('Your next study blocks', 'بڵۆکەکانی خوێندنی داهاتووت')}
              </h2>
            </div>

            <span className="mono">
              {
                plan.totalPlannedTodayMinutes
              }
              m {tr('planned', 'پلانکراو')}
            </span>
          </div>

          <div className="dashboard-route-list">
            {plan.items.length === 0 ? (
              <div className="dashboard-empty">
                {tr('Add a subject to generate your plan.', 'بابەتێک زیاد بکە بۆ دروستکردنی پلانەکەت.')}
              </div>
            ) : (
              plan.items
                .slice(0, 3)
                .map(
                  (
                    item,
                    index,
                  ) => (
                    <article
                      key={
                        item.subjectId +
                        index
                      }
                      className="dashboard-route-item"
                    >
                      <div
                        className="dashboard-route-index"
                        style={{
                          borderColor:
                            item.subjectColor ??
                            'var(--primary-border)',
                          color:
                            item.subjectColor ??
                            'var(--primary-glow)',
                        }}
                      >
                        {index + 1}
                      </div>

                      <div className="dashboard-route-copy">
                        <strong>
                          {
                            item.subjectName
                          }
                        </strong>
                        <span>
                          {item.reason}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="dashboard-route-action"
                        onClick={() =>
                          onStartRecommendedSession(
                            item.subjectId,
                            item.minutes,
                          )
                        }
                      >
                        {item.minutes}m
                        <ArrowRight
                          size={14}
                        />
                      </button>
                    </article>
                  ),
                )
            )}
          </div>

          <div className="dashboard-route-footer">
            <span>
              {tr('Daily remaining', 'ماوەی ڕۆژانە')}
            </span>
            <strong>
              {
                plan.todayRemainingMinutes
              }
              m
            </strong>

            <span>
              {tr('Weekly remaining', 'ماوەی هەفتانە')}
            </span>
            <strong>
              {
                plan.weeklyRemainingMinutes
              }
              m
            </strong>

            <span>
              {tr('Best window', 'باشترین کات')}
            </span>
            <strong>
              {plan.bestTime ??
                tr('Still learning', 'هێشتا فێردەبێت')}
            </strong>
          </div>
        </div>

        <RecentSessions
          sessions={sessions}
          onDeleteSession={
            onDeleteSession
          }
        />
      </section>
    </main>
  )
}
