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
import FocusPulse from './FocusPulse'
import RecentSessions from './RecentSessions'
import StatCard from './StatCard'
import {
  getStreakStats,
} from '../../utils/goalHistory'
import {
  getStudyPlan,
} from '../../utils/studyPlan'

interface DashboardProps {
  subjects: Subject[]
  sessions: StudySession[]
  dailyGoal: number
  weeklyGoal: number
  onDeleteSession: (
    id: string,
  ) => void
  onStartRecommendedSession: (
    subjectId?: string,
    minutes?: number,
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
  onDeleteSession,
  onStartRecommendedSession,
}: DashboardProps) {
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

  return (
    <main className="dashboard dashboard-v3">
      <header className="dashboard-v3-header">
        <div>
          <div className="eyebrow">
            FOCUS command center
          </div>
          <h1>
            What should you do next?
          </h1>
          <p>
            One recommendation,
            your current momentum,
            and the next useful
            session.
          </p>
        </div>

        <div className="dashboard-date">
          <CalendarDays
            size={15}
          />
          {now.toLocaleDateString(
            'en-US',
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
          label="Today"
          value={minutesLabel(
            todayMinutes,
          )}
          accentColor="var(--primary)"
        />

        <StatCard
          icon={Layers3}
          label="Today's sessions"
          value={String(
            todaySessions.length,
          )}
          accentColor="var(--cyber-blue)"
        />

        <StatCard
          icon={Flame}
          label="Current streak"
          value={`${streak}d`}
          accentColor="var(--energy)"
        />

        <StatCard
          icon={Clock3}
          label="This week"
          value={minutesLabel(
            weekMinutes,
          )}
          accentColor="var(--teal)"
        />
      </section>

      <section className="dashboard-v3-grid">
        <div className="glass-panel dashboard-route">
          <div className="dashboard-section-head">
            <div>
              <div className="eyebrow">
                Today's route
              </div>
              <h2>
                Your next study
                blocks
              </h2>
            </div>

            <span className="mono">
              {
                plan.totalPlannedTodayMinutes
              }
              m planned
            </span>
          </div>

          <div className="dashboard-route-list">
            {plan.items.length === 0 ? (
              <div className="dashboard-empty">
                Add a subject to
                generate your plan.
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
              Daily remaining
            </span>
            <strong>
              {
                plan.todayRemainingMinutes
              }
              m
            </strong>

            <span>
              Weekly remaining
            </span>
            <strong>
              {
                plan.weeklyRemainingMinutes
              }
              m
            </strong>

            <span>
              Best window
            </span>
            <strong>
              {plan.bestTime ??
                'Still learning'}
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
