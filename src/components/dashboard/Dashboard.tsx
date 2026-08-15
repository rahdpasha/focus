import { lazy, Suspense, useEffect, useRef } from 'react'
import {
  Clock,
  Target,
  Flame,
} from 'lucide-react'
import type {
  Subject,
  StudySession,
} from '../../types'
import Timer from '../timer/Timer'
import StatCard from './StatCard'
import RecentSessions from './RecentSessions'
import { useI18n } from '../../useI18n'
import {
  getStreakStats,
} from '../../utils/goalHistory'
import {
  getProductivityInsights,
} from '../../utils/productivityInsights'
import {
  getConsistencyInsights,
} from '../../utils/consistencyInsights'
import {
  getStudyRecommendation,
} from '../../utils/studyRecommendations'

const WeeklyTrend = lazy(
  () => import('./WeeklyTrend')
)

const SubjectBalance = lazy(
  () => import('./SubjectBalance')
)

interface DashboardProps {
  subjects: Subject[]
  activeSubjectId: string | null
  sessions: StudySession[]
  dailyGoal: number
  weeklyGoal: number
  onDailyGoalChange: (
    goal: number
  ) => void
  onWeeklyGoalChange: (
    goal: number
  ) => void
  onAddSession: (
    session: StudySession
  ) => void
  onDeleteSession: (
    id: string
  ) => void
  shortBreak: number
  longBreak: number
  sessionsBeforeLongBreak: number
  autoStartBreak: boolean
  soundEnabled: boolean
  soundVolume: number
  notificationsEnabled: boolean
}

function getStartOfDay(
  date: Date
): Date {
  const result = new Date(date)

  result.setHours(0, 0, 0, 0)

  return result
}

function getStartOfWeek(
  date: Date
): Date {
  const result =
    getStartOfDay(date)

  const day =
    result.getDay()

  const daysSinceMonday =
    day === 0
      ? 6
      : day - 1

  result.setDate(
    result.getDate() -
      daysSinceMonday
  )

  return result
}

function formatHoursMinutes(
  minutes: number
): string {
  const hours =
    Math.floor(
      minutes / 60
    )

  const remainingMinutes =
    minutes % 60

  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`
  }

  return `${remainingMinutes}m`
}

function formatGoal(
  minutes: number
): string {
  if (minutes >= 60) {
    const hours =
      Math.floor(
        minutes / 60
      )

    const remainingMinutes =
      minutes % 60

    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`
  }

  return `${minutes}m`
}

function formatChange(
  percent: number
): string {
  if (percent > 0) {
    return `+${percent}%`
  }

  return `${percent}%`
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
  soundEnabled,
  soundVolume,
  notificationsEnabled,
}: DashboardProps) {
  const { t } =
    useI18n()

  const timerCardRef =
    useRef<HTMLDivElement>(null)

  const activeSubject =
    subjects.find(
      (subject) =>
        subject.id ===
        activeSubjectId
    )

  const today =
    getStartOfDay(
      new Date()
    )

  const weekStart =
    getStartOfWeek(
      new Date()
    )

  const completedSessions =
    sessions.filter(
      (session) =>
        session.completed
    )

  const todaySessions =
    completedSessions.filter(
      (session) => {
        const sessionDate =
          getStartOfDay(
            new Date(
              session.completedAt
            )
          )

        return (
          sessionDate.getTime() ===
          today.getTime()
        )
      }
    )

  const weekSessions =
    completedSessions.filter(
      (session) => {
        const sessionDate =
          getStartOfDay(
            new Date(
              session.completedAt
            )
          )

        return (
          sessionDate.getTime() >=
          weekStart.getTime()
        )
      }
    )

  const todayMinutes =
    Math.floor(
      todaySessions.reduce(
        (
          sum,
          session
        ) =>
          sum +
          session.actualDuration,
        0
      ) / 60
    )

  const weekMinutes =
    Math.floor(
      weekSessions.reduce(
        (
          sum,
          session
        ) =>
          sum +
          session.actualDuration,
        0
      ) / 60
    )

  const totalSessions =
    completedSessions.length

  const dailyGoalProgress =
    dailyGoal > 0
      ? Math.min(
          100,
          (todayMinutes /
            dailyGoal) *
            100
        )
      : 0

  const weeklyGoalProgress =
    weeklyGoal > 0
      ? Math.min(
          100,
          (weekMinutes /
            weeklyGoal) *
            100
        )
      : 0

  const dailyGoalReached =
    dailyGoal > 0 &&
    todayMinutes >= dailyGoal

  const weeklyGoalReached =
    weeklyGoal > 0 &&
    weekMinutes >= weeklyGoal

  const streakStats =
    getStreakStats(
      sessions,
      {},
      weeklyGoal
    )

  const streak =
    streakStats.currentDailyStreak

  const bestStreak =
    streakStats.bestDailyStreak

  const insights =
    getProductivityInsights(
      sessions
    )

  const consistency =
    getConsistencyInsights(
      sessions,
      weeklyGoal
    )


  const recommendation =
    getStudyRecommendation(
      sessions,
      subjects,
      weeklyGoal
    )


  const recommendationReason =
    (() => {
      if (
        recommendation.type ===
        'understudiedSubject'
      ) {
        const subject =
          insights.subjectBalance.find(
            (item) =>
              item.subjectName ===
              recommendation.subjectName
          )

        if (
          subject &&
          recommendation.consistencyTrend ===
            'declining'
        ) {
          return `Your consistency is declining, and ${subject.subjectName} has only ${subject.minutes} minutes this week.`
        }

        if (subject) {
          return `${subject.subjectName} has only ${subject.minutes} minutes this week.`
        }
      }

      if (
        recommendation.type ===
        'unstudiedSubject'
      ) {
        if (
          recommendation.consistencyTrend ===
          'declining'
        ) {
          return 'Your consistency is declining, so giving an untouched subject some attention can help rebalance your week.'
        }

        return 'You have not studied this subject yet this week.'
      }

      if (
        recommendation.type ===
        'shortSessions'
      ) {
        return `Your average session is only ${insights.averageSessionMinutes} minutes. A focused 25-minute session would strengthen the habit.`
      }

      if (
        recommendation.type ===
        'weeklyGoal'
      ) {
        return `You are ${recommendation.remainingMinutes} minutes short of your weekly goal.`
      }

      if (
        recommendation.type ===
        'maintain'
      ) {
        if (
          recommendation.consistencyTrend ===
          'improving'
        ) {
          return 'Your consistency is improving. Keep the current rhythm.'
        }

        if (
          recommendation.consistencyTrend ===
          'declining'
        ) {
          return 'Your consistency is declining. A focused session can help you get back on track.'
        }

        return 'Your study rhythm is stable. Keep it going.'
      }

      return ''
    })()

  useEffect(() => {
    const card =
      timerCardRef.current

    if (!card) {
      return
    }

    const handleMouseMove =
      (event: MouseEvent) => {
        const rect =
          card.getBoundingClientRect()

        if (
          rect.width === 0 ||
          rect.height === 0
        ) {
          return
        }

        const x =
          event.clientX -
          rect.left

        const y =
          event.clientY -
          rect.top

        const rotateX =
          ((y -
            rect.height / 2) /
            rect.height) *
          -4

        const rotateY =
          ((x -
            rect.width / 2) /
            rect.width) *
          4

        card.style.transform =
          `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
      }

    const handleMouseLeave =
      () => {
        card.style.transform =
          'perspective(1000px) rotateX(0deg) rotateY(0deg)'
      }

    card.addEventListener(
      'mousemove',
      handleMouseMove
    )

    card.addEventListener(
      'mouseleave',
      handleMouseLeave
    )

    return () => {
      card.removeEventListener(
        'mousemove',
        handleMouseMove
      )

      card.removeEventListener(
        'mouseleave',
        handleMouseLeave
      )
    }
  }, [])

  const handleTimerComplete =
    () => {
      // Timer handles completion internally.
    }

  const handleSessionEnd = (
    duration: number,
    actualDuration: number,
    completed: boolean,
    interruptions: number,
    totalPausedSeconds: number
  ) => {
    if (!activeSubject) {
      return
    }

    const newSession:
      StudySession = {
      id: `s${Date.now()}`,
      subjectId:
        activeSubject.id,
      subjectName:
        activeSubject.name,
      subjectColor:
        activeSubject.color,
      duration,
      actualDuration,
      completedAt:
        new Date(),
      completed,
      interruptions,
      totalPausedSeconds,
    }

    onAddSession(
      newSession
    )
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
        flexDirection:
          'column',
        gap: '24px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems:
            'flex-start',
          gap: '16px',
          flexWrap:
            'wrap',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '22px',
              color:
                'var(--text-primary)',
              marginBottom: '4px',
            }}
          >
            {t('goodEvening')}
          </h1>

          <span
            style={{
              fontSize: '11px',
              color:
                'var(--text-muted)',
              fontFamily:
                'Orbitron, sans-serif',
              textTransform:
                'uppercase',
              letterSpacing:
                '0.1em',
            }}
          >
            {t('systemStatus')}
          </span>
        </div>

        <span
          className="mono"
          style={{
            fontSize: '11px',
            color:
              'var(--text-muted)',
          }}
        >
          {new Date().toLocaleDateString(
            'en-US',
            {
              weekday:
                'long',
              month: 'short',
              day: 'numeric',
            }
          )}
        </span>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'flex',
          gap: '14px',
          flexWrap: 'wrap',
        }}
      >
        <StatCard
          icon={Clock}
          label={t(
            'activeFocus'
          )}
          value={formatHoursMinutes(
            todayMinutes
          )}
          accentColor="var(--primary)"
        />

        <StatCard
          icon={Target}
          label={t(
            'sessions'
          )}
          value={String(
            totalSessions
          )}
          accentColor="var(--cyber-blue)"
        />

        <StatCard
          icon={Flame}
          label={t('streak')}
          value={`${streak} ${t(
            'days'
          )}`}
          accentColor="var(--energy)"
        />

        <StatCard
          icon={Flame}
          label="BEST STREAK"
          value={`${bestStreak} ${t(
            'days'
          )}`}
          accentColor="var(--teal)"
        />
      </div>

      {/* Productivity Insights */}
      <div
        className="glass-panel"
        style={{
          padding: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems:
              'center',
            gap: '16px',
            marginBottom:
              '16px',
            flexWrap:
              'wrap',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '11px',
                fontFamily:
                  'Orbitron, sans-serif',
                color:
                  'var(--text-muted)',
                textTransform:
                  'uppercase',
                letterSpacing:
                  '0.1em',
                marginBottom:
                  '4px',
              }}
            >
              {t(
                'studyInsights'
              )}
            </div>

            <div
              style={{
                fontSize: '11px',
                color:
                  'var(--text-muted)',
              }}
            >
              Your study pattern
              this week.
            </div>
          </div>

          <div
            className="mono"
            style={{
              fontSize: '11px',
              color:
                insights.weekChangePercent >
                0
                  ? 'var(--success)'
                  : insights.weekChangePercent <
                      0
                    ? 'var(--danger)'
                    : 'var(--text-muted)',
            }}
          >
            {formatChange(
              insights.weekChangePercent
            )}{' '}
            {t(
              'vsLastWeek'
            )}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px',
          }}
        >
          {/* This week */}
          <div
            style={{
              padding: '14px',
              borderRadius:
                '10px',
              background:
                'rgba(139,92,246,0.08)',
              border:
                '1px solid var(--void-border)',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color:
                  'var(--text-muted)',
                marginBottom:
                  '6px',
              }}
            >
              {t('thisWeek')}
            </div>

            <div
              className="mono"
              style={{
                fontSize: '20px',
                color:
                  'var(--primary-glow)',
              }}
            >
              {formatHoursMinutes(
                insights.thisWeekMinutes
              )}
            </div>

            <div
              className="mono"
              style={{
                marginTop:
                  '5px',
                fontSize: '10px',
                color:
                  'var(--text-muted)',
              }}
            >
              {insights.thisWeekSessions}{' '}
              {t(
                'sessions'
              )}
            </div>
          </div>

          {/* Study days */}
          <div
            style={{
              padding: '14px',
              borderRadius:
                '10px',
              background:
                'rgba(6,182,212,0.08)',
              border:
                '1px solid var(--void-border)',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color:
                  'var(--text-muted)',
                marginBottom:
                  '6px',
              }}
            >
              {t(
                'studyDays'
              )}
            </div>

            <div
              className="mono"
              style={{
                fontSize: '20px',
                color:
                  'var(--cyber-glow)',
              }}
            >
              {
                insights.studyDaysThisWeek
              }
              <span
                style={{
                  fontSize:
                    '12px',
                  color:
                    'var(--text-muted)',
                }}
              >
                {' '}
                / 7
              </span>
            </div>

            <div
              style={{
                marginTop:
                  '5px',
                fontSize:
                  '10px',
                color:
                  'var(--text-muted)',
              }}
            >
              {t(
                'consistency'
              )}
            </div>
          </div>

          {/* Average session */}
          <div
            style={{
              padding: '14px',
              borderRadius:
                '10px',
              background:
                'rgba(20,184,166,0.08)',
              border:
                '1px solid var(--void-border)',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color:
                  'var(--text-muted)',
                marginBottom:
                  '6px',
              }}
            >
              {t(
                'avgSession'
              )}
            </div>

            <div
              className="mono"
              style={{
                fontSize: '20px',
                color:
                  'var(--teal-glow)',
              }}
            >
              {
                insights.averageSessionMinutes
              }m
            </div>

            <div
              style={{
                marginTop:
                  '5px',
                fontSize:
                  '10px',
                color:
                  'var(--text-muted)',
              }}
            >
              this week
            </div>
          </div>

          {/* Best study time */}
          <div
            style={{
              padding: '14px',
              borderRadius: '10px',
              background:
                'rgba(34,197,94,0.06)',
              border:
                '1px solid var(--void-border)',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                marginBottom: '6px',
              }}
            >
              {t('bestStudyTime')}
            </div>

            <div
              className="mono"
              style={{
                fontSize: '18px',
                color: 'var(--success)',
              }}
            >
              {insights.bestStudyTime?.label ?? '—'}
            </div>

            <div
              className="mono"
              style={{
                marginTop: '5px',
                fontSize: '10px',
                color: 'var(--text-muted)',
              }}
            >
              {insights.bestStudyTime
                ? `${insights.bestStudyTime.averageMinutes}m avg · ${insights.bestStudyTime.sessions} sessions`
                : t('noCompletedSessions')}
            </div>
          </div>

          {/* Study time distribution */}
          <div
            style={{
              gridColumn: '1 / -1',
              padding: '14px',
              borderRadius: '10px',
              background:
                'rgba(139,92,246,0.05)',
              border:
                '1px solid var(--void-border)',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                marginBottom: '10px',
              }}
            >
              {t('studyTimeDistribution')}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '10px',
              }}
            >
              {insights.studyTimePeriods.map(
                (period) => (
                  <div
                    key={period.period}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      background:
                        'rgba(255,255,255,0.02)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '10px',
                        color:
                          'var(--text-muted)',
                        marginBottom: '5px',
                      }}
                    >
                      {period.label}
                    </div>

                    <div
                      className="mono"
                      style={{
                        fontSize: '16px',
                        color:
                          period.sessions > 0
                            ? 'var(--text-primary)'
                            : 'var(--text-muted)',
                      }}
                    >
                      {period.averageMinutes}m
                    </div>

                    <div
                      className="mono"
                      style={{
                        marginTop: '4px',
                        fontSize: '9px',
                        color:
                          'var(--text-muted)',
                      }}
                    >
                      {period.sessions}{' '}
                      {t('sessions')}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Strongest subject */}
          <div
            style={{
              padding: '14px',
              borderRadius:
                '10px',
              background:
                'rgba(245,158,11,0.08)',
              border:
                '1px solid var(--void-border)',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color:
                  'var(--text-muted)',
                marginBottom:
                  '6px',
              }}
            >
              {t(
                'strongestSubject'
              )}
            </div>

            <div
              style={{
                fontSize: '13px',
                color:
                  'var(--text-primary)',
                overflow:
                  'hidden',
                textOverflow:
                  'ellipsis',
                whiteSpace:
                  'nowrap',
              }}
              title={
                insights.bestSubject
                  ?.subjectName
              }
            >
              {insights.bestSubject
                ?.subjectName ??
                '—'}
            </div>

            <div
              className="mono"
              style={{
                marginTop:
                  '5px',
                fontSize:
                  '10px',
                color:
                  'var(--text-muted)',
              }}
            >
              {insights.bestSubject
                ? `${insights.bestSubject.minutes}m · ${insights.bestSubject.percentage}%`
                : t(
                    'noCompletedSessions'
                  )}
            </div>
          </div>

          {/* Least studied */}
          <div
            style={{
              padding: '14px',
              borderRadius:
                '10px',
              background:
                'rgba(239,68,68,0.06)',
              border:
                '1px solid var(--void-border)',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color:
                  'var(--text-muted)',
                marginBottom:
                  '6px',
              }}
            >
              {t(
                'leastStudied'
              )}
            </div>

            <div
              style={{
                fontSize: '13px',
                color:
                  'var(--text-primary)',
                overflow:
                  'hidden',
                textOverflow:
                  'ellipsis',
                whiteSpace:
                  'nowrap',
              }}
              title={
                insights
                  .leastStudiedSubject
                  ?.subjectName
              }
            >
              {insights
                .leastStudiedSubject
                ?.subjectName ??
                '—'}
            </div>

            <div
              className="mono"
              style={{
                marginTop:
                  '5px',
                fontSize:
                  '10px',
                color:
                  'var(--text-muted)',
              }}
            >
              {insights
                .leastStudiedSubject
                ? `${insights.leastStudiedSubject.minutes}m · ${insights.leastStudiedSubject.percentage}%`
                : t(
                    'noCompletedSessions'
                  )}
            </div>
          </div>
        </div>
      </div>

      {/* Consistency */}
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
            gap: '12px',
            marginBottom: '16px',
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
                marginBottom: '4px',
              }}
            >
              {t('consistencyTrend')}
            </div>

            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
              }}
            >
              {t('consistencyDescription')}
            </div>
          </div>

          <div
            className="mono"
            style={{
              fontSize: '12px',
              color:
                consistency.trend === 'improving'
                  ? 'var(--success)'
                  : consistency.trend === 'declining'
                    ? 'var(--danger)'
                    : 'var(--text-muted)',
            }}
          >
            {consistency.changePercent > 0
              ? `+${consistency.changePercent}%`
              : `${consistency.changePercent}%`}{' '}
            {t('vsPreviousWeek')}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px',
          }}
        >
          <div
            style={{
              padding: '14px',
              borderRadius: '10px',
              background:
                'rgba(34,197,94,0.06)',
              border:
                '1px solid var(--void-border)',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                marginBottom: '6px',
              }}
            >
              {t('trend')}
            </div>

            <div
              style={{
                fontSize: '18px',
                color:
                  consistency.trend === 'improving'
                    ? 'var(--success)'
                    : consistency.trend === 'declining'
                      ? 'var(--danger)'
                      : 'var(--text-primary)',
              }}
            >
              {t(
                consistency.trend === 'improving'
                  ? 'improving'
                  : consistency.trend === 'declining'
                    ? 'declining'
                    : 'stable'
              )}
            </div>
          </div>

          <div
            style={{
              padding: '14px',
              borderRadius: '10px',
              background:
                'rgba(139,92,246,0.06)',
              border:
                '1px solid var(--void-border)',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                marginBottom: '6px',
              }}
            >
              {t('weeklyAverage')}
            </div>

            <div
              className="mono"
              style={{
                fontSize: '18px',
                color: 'var(--primary-glow)',
              }}
            >
              {formatHoursMinutes(
                consistency.averageWeeklyMinutes
              )}
            </div>
          </div>

          <div
            style={{
              padding: '14px',
              borderRadius: '10px',
              background:
                'rgba(6,182,212,0.06)',
              border:
                '1px solid var(--void-border)',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                marginBottom: '6px',
              }}
            >
              {t('bestWeek')}
            </div>

            <div
              className="mono"
              style={{
                fontSize: '18px',
                color: 'var(--cyber-glow)',
              }}
            >
              {formatHoursMinutes(
                consistency.bestWeek?.minutes ?? 0
              )}
            </div>
          </div>

          <div
            style={{
              padding: '14px',
              borderRadius: '10px',
              background:
                'rgba(245,158,11,0.06)',
              border:
                '1px solid var(--void-border)',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                marginBottom: '6px',
              }}
            >
              {t('strongestConsistency')}
            </div>

            <div
              className="mono"
              style={{
                fontSize: '18px',
                color: 'var(--energy)',
              }}
            >
              {consistency.strongestConsistencyWeek
                ?.studyDays ?? 0}{' '}
              / 7
            </div>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div
        className="glass-panel"
        style={{
          padding: '20px',
          borderColor: 'rgba(245,158,11,0.18)',
          background: 'rgba(245,158,11,0.05)',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontFamily: 'Orbitron, sans-serif',
            color: 'var(--energy)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '8px',
          }}
        >
          {t('recommendationTitle')}
        </div>

        {recommendation.type === 'noData' && (
          <div>
            <div
              style={{
                fontSize: '15px',
                color: 'var(--text-primary)',
                marginBottom: '6px',
              }}
            >
              {t('recommendNoData')}
            </div>
            <div className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {recommendation.minutes}m
            </div>
          </div>
        )}

        {recommendation.type === 'unstudiedSubject' && (
          <div>
            <div
              style={{
                fontSize: '15px',
                color: 'var(--text-primary)',
                marginBottom: '6px',
              }}
            >
              {t('recommendUnstudied')}{' '}
              <strong>{recommendation.subjectName}</strong>
            </div>
            <div className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {recommendation.minutes}m
            </div>
          </div>
        )}

        {recommendation.type === 'understudiedSubject' && (
          <div>
            <div
              style={{
                fontSize: '15px',
                color: 'var(--text-primary)',
                marginBottom: '6px',
              }}
            >
              {t('recommendUnderstudied')}{' '}
              <strong>{recommendation.subjectName}</strong>
            </div>

            <div
              className="mono"
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
              }}
            >
              {recommendation.minutes}m
            </div>

            {recommendationReason && (
              <div
                style={{
                  marginTop: '10px',
                  fontSize: '11px',
                  lineHeight: 1.5,
                  color: 'var(--text-secondary)',
                }}
              >
                {recommendationReason}
              </div>
            )}
          </div>
        )}

        {recommendation.type === 'shortSessions' && (
          <div>
            <div style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '6px' }}>
              {t('recommendShortSessions')}
            </div>
            <div className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {recommendation.minutes}m
            </div>

            {recommendationReason && (
              <div
                style={{
                  marginTop: '10px',
                  fontSize: '11px',
                  lineHeight: 1.5,
                  color: 'var(--text-secondary)',
                }}
              >
                {recommendationReason}
              </div>
            )}
          </div>
        )}

        {recommendation.type === 'weeklyGoal' && (
          <div>
            <div style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '6px' }}>
              {t('recommendWeeklyGoal')}{' '}
              <strong>{recommendation.remainingMinutes}m</strong>
            </div>
            <div className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {recommendation.minutes}m
            </div>

            {recommendationReason && (
              <div
                style={{
                  marginTop: '10px',
                  fontSize: '11px',
                  lineHeight: 1.5,
                  color: 'var(--text-secondary)',
                }}
              >
                {recommendationReason}
              </div>
            )}
          </div>
        )}

        {recommendation.type === 'maintain' && (
          <div>
            <div style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '6px' }}>
              {t('recommendMaintain')}
            </div>
            <div
              className="mono"
              style={{
                fontSize: '11px',
                color:
                  (recommendation.changePercent ?? 0) > 0
                    ? 'var(--success)'
                    : 'var(--text-muted)',
              }}
            >
              {(recommendation.changePercent ?? 0) > 0
                ? `+${recommendation.changePercent}%`
                : `${recommendation.changePercent ?? 0}%`}{' '}
              {t('vsLastWeek')}
            </div>
          </div>
        )}
      </div>

      {/* Daily Goal */}
      <div
        className="glass-panel"
        style={{
          padding: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems:
              'center',
            gap: '16px',
            marginBottom:
              '14px',
            flexWrap:
              'wrap',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '11px',
                fontFamily:
                  'Orbitron, sans-serif',
                color:
                  'var(--text-muted)',
                textTransform:
                  'uppercase',
                letterSpacing:
                  '0.1em',
                marginBottom:
                  '6px',
              }}
            >
              {t(
                'dailyFocusGoal'
              )}
            </div>

            <div
              className="mono"
              style={{
                fontSize: '22px',
                color:
                  dailyGoalReached
                    ? 'var(--success)'
                    : 'var(--text-primary)',
              }}
            >
              {formatHoursMinutes(
                todayMinutes
              )}

              <span
                style={{
                  color:
                    'var(--text-muted)',
                  fontSize:
                    '14px',
                }}
              >
                {' '}
                /{' '}
                {formatGoal(
                  dailyGoal
                )}
              </span>
            </div>
          </div>

          <select
            value={dailyGoal}
            onChange={(
              event
            ) =>
              onDailyGoalChange(
                Number(
                  event.target.value
                )
              )
            }
            style={{
              padding:
                '8px 10px',
              background:
                'var(--void-surface-hover)',
              border:
                '1px solid var(--void-border)',
              borderRadius:
                '8px',
              color:
                'var(--text-primary)',
              outline:
                'none',
              cursor:
                'pointer',
            }}
          >
            <option value={30}>
              {t(
                'minutes30'
              )}
            </option>

            <option value={60}>
              {t('hour1')}
            </option>

            <option value={90}>
              {t('hours15')}
            </option>

            <option value={120}>
              {t('hours2')}
            </option>

            <option value={180}>
              {t('hours3')}
            </option>

            <option value={240}>
              {t('hours4')}
            </option>

            <option value={300}>
              {t('hours5')}
            </option>
          </select>
        </div>

        <div
          style={{
            height: '8px',
            background:
              'var(--void-border)',
            borderRadius:
              '999px',
            overflow:
              'hidden',
          }}
        >
          <div
            style={{
              width:
                `${dailyGoalProgress}%`,
              height:
                '100%',
              background:
                dailyGoalReached
                  ? 'var(--success)'
                  : 'linear-gradient(90deg, var(--primary), var(--cyber-blue))',
              borderRadius:
                '999px',
              transition:
                'width 0.5s ease',
              boxShadow:
                dailyGoalReached
                  ? '0 0 15px rgba(34,197,94,0.4)'
                  : '0 0 15px rgba(139,92,246,0.3)',
            }}
          />
        </div>

        <div
          className="mono"
          style={{
            marginTop:
              '8px',
            fontSize:
              '10px',
            color:
              dailyGoalReached
                ? 'var(--success)'
                : 'var(--text-muted)',
          }}
        >
          {dailyGoalReached
            ? t(
                'dailyObjectiveComplete'
              )
            : `${Math.round(
                dailyGoalProgress
              )}${t(
                'completePercent'
              )}`}
        </div>
      </div>

      {/* Weekly Goal */}
      <div
        className="glass-panel"
        style={{
          padding: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems:
              'center',
            gap: '16px',
            marginBottom:
              '14px',
            flexWrap:
              'wrap',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '11px',
                fontFamily:
                  'Orbitron, sans-serif',
                color:
                  'var(--text-muted)',
                textTransform:
                  'uppercase',
                letterSpacing:
                  '0.1em',
                marginBottom:
                  '6px',
              }}
            >
              WEEKLY FOCUS GOAL
            </div>

            <div
              className="mono"
              style={{
                fontSize: '22px',
                color:
                  weeklyGoalReached
                    ? 'var(--success)'
                    : 'var(--text-primary)',
              }}
            >
              {formatHoursMinutes(
                weekMinutes
              )}

              <span
                style={{
                  color:
                    'var(--text-muted)',
                  fontSize:
                    '14px',
                }}
              >
                {' '}
                /{' '}
                {formatGoal(
                  weeklyGoal
                )}
              </span>
            </div>
          </div>

          <select
            value={weeklyGoal}
            onChange={(
              event
            ) =>
              onWeeklyGoalChange(
                Number(
                  event.target.value
                )
              )
            }
            style={{
              padding:
                '8px 10px',
              background:
                'var(--void-surface-hover)',
              border:
                '1px solid var(--void-border)',
              borderRadius:
                '8px',
              color:
                'var(--text-primary)',
              outline:
                'none',
              cursor:
                'pointer',
            }}
          >
            <option value={300}>
              5 HOURS
            </option>

            <option value={600}>
              10 HOURS
            </option>

            <option value={900}>
              15 HOURS
            </option>

            <option value={1200}>
              20 HOURS
            </option>

            <option value={1500}>
              25 HOURS
            </option>
          </select>
        </div>

        <div
          style={{
            height: '8px',
            background:
              'var(--void-border)',
            borderRadius:
              '999px',
            overflow:
              'hidden',
          }}
        >
          <div
            style={{
              width:
                `${weeklyGoalProgress}%`,
              height:
                '100%',
              background:
                weeklyGoalReached
                  ? 'var(--success)'
                  : 'linear-gradient(90deg, var(--cyber-blue), var(--teal))',
              borderRadius:
                '999px',
              transition:
                'width 0.5s ease',
            }}
          />
        </div>

        <div
          className="mono"
          style={{
            marginTop:
              '8px',
            fontSize:
              '10px',
            color:
              weeklyGoalReached
                ? 'var(--success)'
                : 'var(--text-muted)',
          }}
        >
          {weeklyGoalReached
            ? 'WEEKLY OBJECTIVE COMPLETE'
            : `${Math.round(
                weeklyGoalProgress
              )}% COMPLETE`}
        </div>
      </div>

      {/* Timer */}
      <div
        ref={timerCardRef}
        className="glass-panel"
        style={{
          padding: '48px',
          display: 'flex',
          justifyContent:
            'center',
          transition:
            'transform 0.3s ease',
        }}
      >
        <Timer
          subjectName={
            activeSubject?.name ||
            t(
              'selectSubject'
            )
          }
          subjectColor={
            activeSubject?.color ||
            '#8b5cf6'
          }
          shortBreakMinutes={
            shortBreak
          }
          longBreakMinutes={
            longBreak
          }
          sessionsBeforeLongBreak={
            sessionsBeforeLongBreak
          }
          autoStartBreak={
            autoStartBreak
          }
          soundEnabled={
            soundEnabled
          }
          soundVolume={
            soundVolume
          }
          notificationsEnabled={
            notificationsEnabled
          }
          onComplete={
            handleTimerComplete
          }
          onSessionEnd={
            handleSessionEnd
          }
        />
      </div>

      {/* Analytics */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          flexWrap:
            'wrap',
          minWidth: 0,
        }}
      >
        <Suspense
          fallback={
            <div
              className="glass-panel"
              style={{
                minHeight:
                  '340px',
                flex:
                  '1 1 340px',
                display:
                  'flex',
                alignItems:
                  'center',
                justifyContent:
                  'center',
                color:
                  'var(--text-muted)',
                fontFamily:
                  'Orbitron, sans-serif',
                fontSize:
                  '11px',
              }}
            >
              {t(
                'loadingAnalytics'
              )}
            </div>
          }
        >
          <WeeklyTrend
            sessions={sessions}
          />

          <SubjectBalance
            sessions={sessions}
          />
        </Suspense>
      </div>

      {/* Recent Sessions */}
      <RecentSessions
        sessions={sessions.slice(
          0,
          10
        )}
        onDeleteSession={
          onDeleteSession
        }
      />
    </div>
  )
}
