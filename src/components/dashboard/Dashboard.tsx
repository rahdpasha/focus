import { lazy, Suspense, useEffect, useRef } from 'react'
import { Clock, Target, Flame } from 'lucide-react'
import type { Subject, StudySession } from '../../types'
import Timer from '../timer/Timer'
import StatCard from './StatCard'
import RecentSessions from './RecentSessions'
import { useI18n } from '../../useI18n'
import { getStreakStats } from '../../utils/goalHistory'

const WeeklyTrend = lazy(() => import('./WeeklyTrend'))
const SubjectBalance = lazy(() => import('./SubjectBalance'))

interface DashboardProps {
  subjects: Subject[]
  activeSubjectId: string | null
  sessions: StudySession[]
  dailyGoal: number
  weeklyGoal: number
  onDailyGoalChange: (goal: number) => void
  onWeeklyGoalChange: (goal: number) => void
  onAddSession: (session: StudySession) => void
  onDeleteSession: (id: string) => void
  shortBreak: number
  longBreak: number
  sessionsBeforeLongBreak: number
  autoStartBreak: boolean
}

function getStartOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

function getStartOfWeek(date: Date): Date {
  const result = getStartOfDay(date)
  const day = result.getDay()
  const daysSinceMonday = day === 0 ? 6 : day - 1

  result.setDate(result.getDate() - daysSinceMonday)

  return result
}

function formatHoursMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`
  }

  return `${remainingMinutes}m`
}

function formatGoal(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`
  }

  return `${minutes}m`
}

export default function Dashboard({
  subjects,
  activeSubjectId,
  sessions,
  dailyGoal,
  weeklyGoal,
  onDailyGoalChange,
  onWeeklyGoalChange,
  onAddSession,
  onDeleteSession,
  shortBreak,
  longBreak,
  sessionsBeforeLongBreak,
  autoStartBreak,
}: DashboardProps) {
  const { t } = useI18n()
  const timerCardRef = useRef<HTMLDivElement>(null)

  const activeSubject = subjects.find(
    (subject) => subject.id === activeSubjectId
  )

  const today = getStartOfDay(new Date())
  const weekStart = getStartOfWeek(new Date())

  const completedSessions = sessions.filter(
    (session) => session.completed
  )

  const todaySessions = completedSessions.filter((session) => {
    const sessionDate = getStartOfDay(
      new Date(session.completedAt)
    )

    return sessionDate.getTime() === today.getTime()
  })

  const weekSessions = completedSessions.filter((session) => {
    const sessionDate = getStartOfDay(
      new Date(session.completedAt)
    )

    return sessionDate.getTime() >= weekStart.getTime()
  })

  const todayMinutes = Math.floor(
    todaySessions.reduce(
      (sum, session) => sum + session.actualDuration,
      0
    ) / 60
  )

  const weekMinutes = Math.floor(
    weekSessions.reduce(
      (sum, session) => sum + session.actualDuration,
      0
    ) / 60
  )

  const totalSessions = completedSessions.length

  const dailyGoalProgress =
    dailyGoal > 0
      ? Math.min(100, (todayMinutes / dailyGoal) * 100)
      : 0

  const weeklyGoalProgress =
    weeklyGoal > 0
      ? Math.min(100, (weekMinutes / weeklyGoal) * 100)
      : 0

  const dailyGoalReached =
    dailyGoal > 0 && todayMinutes >= dailyGoal

  const weeklyGoalReached =
    weeklyGoal > 0 && weekMinutes >= weeklyGoal

  const streakStats = getStreakStats(
    sessions,
    {},
    weeklyGoal
  )

  const streak =
    streakStats.currentDailyStreak

  const bestStreak =
    streakStats.bestDailyStreak



  useEffect(() => {
    const card = timerCardRef.current

    if (!card) return

    const handleMouseMove = (event: MouseEvent) => {
      const rect = card.getBoundingClientRect()

      if (rect.width === 0 || rect.height === 0) {
        return
      }

      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      const rotateX =
        ((y - rect.height / 2) / rect.height) * -4

      const rotateY =
        ((x - rect.width / 2) / rect.width) * 4

      card.style.transform =
        `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
    }

    const handleMouseLeave = () => {
      card.style.transform =
        'perspective(1000px) rotateX(0deg) rotateY(0deg)'
    }

    card.addEventListener('mousemove', handleMouseMove)
    card.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      card.removeEventListener('mousemove', handleMouseMove)
      card.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  const handleTimerComplete = () => {
    // Timer handles completion internally.
  }

  const handleSessionEnd = (
    duration: number,
    actualDuration: number,
    completed: boolean,
    interruptions: number,
    totalPausedSeconds: number
  ) => {
    if (!activeSubject) return

    const newSession: StudySession = {
      id: `s${Date.now()}`,
      subjectId: activeSubject.id,
      subjectName: activeSubject.name,
      subjectColor: activeSubject.color,
      duration,
      actualDuration,
      completedAt: new Date(),
      completed,
      interruptions,
      totalPausedSeconds,
    }

    onAddSession(newSession)
  }

  return (
    <div
      className="dashboard"
      style={{
        flex: 1,
        minWidth: 0,
        padding: '32px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '22px',
              color: 'var(--text-primary)',
              marginBottom: '4px',
            }}
          >
            {t('goodEvening')}
          </h1>

          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontFamily: 'Orbitron, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            {t('systemStatus')}
          </span>
        </div>

        <span
          className="mono"
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}
        >
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '14px',
          flexWrap: 'wrap',
        }}
      >
        <StatCard
          icon={Clock}
          label={t('activeFocus')}
          value={formatHoursMinutes(todayMinutes)}
          accentColor="var(--primary)"
        />

        <StatCard
          icon={Target}
          label={t('sessions')}
          value={String(totalSessions)}
          accentColor="var(--cyber-blue)"
        />

        <StatCard
          icon={Flame}
          label={t('streak')}
          value={`${streak} ${t('days')}`}
          accentColor="var(--energy)"
        />

        <StatCard
          icon={Flame}
          label="BEST STREAK"
          value={`${bestStreak} ${t('days')}`}
          accentColor="var(--teal)"
        />
      </div>

      <div
        className="glass-panel"
        style={{
          padding: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '14px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '11px',
                fontFamily: 'Orbitron, sans-serif',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '6px',
              }}
            >
              {t('dailyFocusGoal')}
            </div>

            <div
              className="mono"
              style={{
                fontSize: '22px',
                color: dailyGoalReached
                  ? 'var(--success)'
                  : 'var(--text-primary)',
              }}
            >
              {formatHoursMinutes(todayMinutes)}

              <span
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '14px',
                }}
              >
                {' '}
                / {formatGoal(dailyGoal)}
              </span>
            </div>
          </div>

          <select
            value={dailyGoal}
            onChange={(event) =>
              onDailyGoalChange(Number(event.target.value))
            }
            style={{
              padding: '8px 10px',
              background: 'var(--void-surface-hover)',
              border: '1px solid var(--void-border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value={30}>{t('minutes30')}</option>
            <option value={60}>{t('hour1')}</option>
            <option value={90}>{t('hours15')}</option>
            <option value={120}>{t('hours2')}</option>
            <option value={180}>{t('hours3')}</option>
            <option value={240}>{t('hours4')}</option>
            <option value={300}>{t('hours5')}</option>
          </select>
        </div>

        <div
          style={{
            height: '8px',
            background: 'var(--void-border)',
            borderRadius: '999px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${dailyGoalProgress}%`,
              height: '100%',
              background: dailyGoalReached
                ? 'var(--success)'
                : 'linear-gradient(90deg, var(--primary), var(--cyber-blue))',
              borderRadius: '999px',
              transition: 'width 0.5s ease',
              boxShadow: dailyGoalReached
                ? '0 0 15px rgba(34,197,94,0.4)'
                : '0 0 15px rgba(139,92,246,0.3)',
            }}
          />
        </div>

        <div
          className="mono"
          style={{
            marginTop: '8px',
            fontSize: '10px',
            color: dailyGoalReached
              ? 'var(--success)'
              : 'var(--text-muted)',
          }}
        >
          {dailyGoalReached
            ? t('dailyObjectiveComplete')
            : `${Math.round(dailyGoalProgress)}${t(
                'completePercent'
              )}`}
        </div>
      </div>

      <div
        className="glass-panel"
        style={{
          padding: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '14px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '11px',
                fontFamily: 'Orbitron, sans-serif',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '6px',
              }}
            >
              WEEKLY FOCUS GOAL
            </div>

            <div
              className="mono"
              style={{
                fontSize: '22px',
                color: weeklyGoalReached
                  ? 'var(--success)'
                  : 'var(--text-primary)',
              }}
            >
              {formatHoursMinutes(weekMinutes)}

              <span
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '14px',
                }}
              >
                {' '}
                / {formatGoal(weeklyGoal)}
              </span>
            </div>
          </div>

          <select
            value={weeklyGoal}
            onChange={(event) =>
              onWeeklyGoalChange(Number(event.target.value))
            }
            style={{
              padding: '8px 10px',
              background: 'var(--void-surface-hover)',
              border: '1px solid var(--void-border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value={300}>5 HOURS</option>
            <option value={600}>10 HOURS</option>
            <option value={900}>15 HOURS</option>
            <option value={1200}>20 HOURS</option>
            <option value={1500}>25 HOURS</option>
          </select>
        </div>

        <div
          style={{
            height: '8px',
            background: 'var(--void-border)',
            borderRadius: '999px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${weeklyGoalProgress}%`,
              height: '100%',
              background: weeklyGoalReached
                ? 'var(--success)'
                : 'linear-gradient(90deg, var(--cyber-blue), var(--teal))',
              borderRadius: '999px',
              transition: 'width 0.5s ease',
            }}
          />
        </div>

        <div
          className="mono"
          style={{
            marginTop: '8px',
            fontSize: '10px',
            color: weeklyGoalReached
              ? 'var(--success)'
              : 'var(--text-muted)',
          }}
        >
          {weeklyGoalReached
            ? 'WEEKLY OBJECTIVE COMPLETE'
            : `${Math.round(weeklyGoalProgress)}% COMPLETE`}
        </div>
      </div>

      <div
        ref={timerCardRef}
        className="glass-panel"
        style={{
          padding: '48px',
          display: 'flex',
          justifyContent: 'center',
          transition: 'transform 0.3s ease',
        }}
      >
        <Timer
          subjectName={
            activeSubject?.name ||
            t('selectSubject')
          }
          subjectColor={
            activeSubject?.color ||
            '#8b5cf6'
          }
          shortBreakMinutes={shortBreak}
          longBreakMinutes={longBreak}
          sessionsBeforeLongBreak={
            sessionsBeforeLongBreak
          }
          autoStartBreak={autoStartBreak}
          onComplete={handleTimerComplete}
          onSessionEnd={handleSessionEnd}
        />
      </div>

      <div
        style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          minWidth: 0,
        }}
      >
        <Suspense
          fallback={
            <div
              className="glass-panel"
              style={{
                minHeight: '340px',
                flex: '1 1 340px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '11px',
              }}
            >
              {t('loadingAnalytics')}
            </div>
          }
        >
          <WeeklyTrend sessions={sessions} />
          <SubjectBalance sessions={sessions} />
        </Suspense>
      </div>

      <RecentSessions
        sessions={sessions.slice(0, 10)}
        onDeleteSession={onDeleteSession}
      />
    </div>
  )
}
