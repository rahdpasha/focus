import type { StudySession } from '../../types'
import { useI18n } from '../../useI18n'
import {
  getStartOfWeek,
  getStreakStats,
  getWeeklyGoalHistory,
  type WeeklyGoalMap,
} from '../../utils/goalHistory'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface StatisticsProps {
  sessions: StudySession[]
  weeklyGoal: number
  weeklyGoalsHistory: WeeklyGoalMap
}

function startOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

function formatDuration(
  seconds: number
): string {
  const minutes =
    Math.floor(seconds / 60)

  const remainingSeconds =
    seconds % 60

  if (minutes === 0) {
    return `${remainingSeconds}s`
  }

  if (remainingSeconds === 0) {
    return `${minutes}m`
  }

  return `${minutes}m ${remainingSeconds}s`
}

function formatWeekLabel(
  date: Date,
  locale: string,
  currentWeek: boolean
): string {
  if (currentWeek) {
    return locale === 'ku-IQ'
      ? 'ئەم هەفتە'
      : 'THIS WEEK'
  }

  const end =
    new Date(date)

  end.setDate(
    end.getDate() + 6
  )

  const startLabel =
    date.toLocaleDateString(
      locale,
      {
        month: 'short',
        day: 'numeric',
      }
    )

  const endLabel =
    end.toLocaleDateString(
      locale,
      {
        month: 'short',
        day: 'numeric',
      }
    )

  return `${startLabel} - ${endLabel}`
}

interface GoalChartTooltipProps {
  active?: boolean
  payload?: Array<{
    dataKey?: string
    value?: number
  }>
  label?: string
}

function GoalChartTooltip({
  active,
  payload,
  label,
}: GoalChartTooltipProps) {
  if (
    !active ||
    !payload ||
    payload.length === 0
  ) {
    return null
  }

  const goal =
    payload.find(
      (item) =>
        item.dataKey === 'goal'
    )?.value ?? 0

  const actual =
    payload.find(
      (item) =>
        item.dataKey === 'actual'
    )?.value ?? 0

  return (
    <div
      style={{
        background:
          'rgba(10,10,30,0.96)',
        border:
          '1px solid var(--void-border)',
        borderRadius: '10px',
        padding: '12px 16px',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div
        style={{
          fontSize: '10px',
          color:
            'var(--text-muted)',
          marginBottom: '8px',
          fontFamily:
            'Orbitron, sans-serif',
        }}
      >
        {label}
      </div>

      <div
        className="mono"
        style={{
          fontSize: '12px',
          color:
            'var(--text-secondary)',
          marginBottom: '4px',
        }}
      >
        Goal: {goal}m
      </div>

      <div
        className="mono"
        style={{
          fontSize: '12px',
          color:
            'var(--primary-glow)',
        }}
      >
        Focus: {actual}m
      </div>
    </div>
  )
}

export default function Statistics({
  sessions,
  weeklyGoal,
  weeklyGoalsHistory,
}: StatisticsProps) {
  const { language, t } =
    useI18n()

  const locale =
    language === 'ku'
      ? 'ku-IQ'
      : 'en-US'

  const completed =
    sessions.filter(
      (session) =>
        session.completed
    )

  const today =
    startOfDay(
      new Date()
    )

  const todaySessions =
    completed.filter(
      (session) =>
        startOfDay(
          new Date(
            session.completedAt
          )
        ).getTime() ===
        today.getTime()
    )

  const last7Start =
    new Date(today)

  last7Start.setDate(
    last7Start.getDate() -
      6
  )

  const last7Sessions =
    completed.filter(
      (session) => {
        const date =
          startOfDay(
            new Date(
              session.completedAt
            )
          )

        return (
          date >=
            last7Start &&
          date <= today
        )
      }
    )

  const totalFocusSeconds =
    completed.reduce(
      (sum, session) =>
        sum +
        session.actualDuration,
      0
    )

  const todayFocusSeconds =
    todaySessions.reduce(
      (sum, session) =>
        sum +
        session.actualDuration,
      0
    )

  const weekFocusSeconds =
    last7Sessions.reduce(
      (sum, session) =>
        sum +
        session.actualDuration,
      0
    )

  const averageSession =
    completed.length > 0
      ? Math.round(
          totalFocusSeconds /
            completed.length
        )
      : 0

  const longestSession =
    completed.length > 0
      ? Math.max(
          ...completed.map(
            (session) =>
              session.actualDuration
          )
        )
      : 0

  const weeklyHistory =
    getWeeklyGoalHistory(
      sessions,
      weeklyGoalsHistory,
      weeklyGoal,
      4
    )

  const chartData =
    [...weeklyHistory]
      .reverse()
      .map((item) => ({
        week:
          formatWeekLabel(
            new Date(
              `${item.weekStart}T00:00:00`
            ),
            locale,
            item.weekStart ===
              getWeekKeySafe()
          ),
        goal:
          item.goalMinutes,
        actual:
          item.completedMinutes,
      }))

  const streakStats =
    getStreakStats(
      sessions,
      weeklyGoalsHistory,
      weeklyGoal
    )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection:
          'column',
        gap: '16px',
      }}
    >
      {/* Overview */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '10px',
                color:
                  'var(--text-muted)',
                fontFamily:
                  'Orbitron, sans-serif',
              }}
            >
              {t('today')}
            </span>

            <div
              className="mono"
              style={{
                marginTop:
                  '8px',
                fontSize:
                  '22px',
                color:
                  'var(--primary-glow)',
              }}
            >
              {formatDuration(
                todayFocusSeconds
              )}
            </div>
          </div>

          <div>
            <span
              style={{
                fontSize: '10px',
                color:
                  'var(--text-muted)',
                fontFamily:
                  'Orbitron, sans-serif',
              }}
            >
              {t('last7Days')}
            </span>

            <div
              className="mono"
              style={{
                marginTop:
                  '8px',
                fontSize:
                  '22px',
                color:
                  'var(--cyber-blue)',
              }}
            >
              {formatDuration(
                weekFocusSeconds
              )}
            </div>
          </div>

          <div>
            <span
              style={{
                fontSize: '10px',
                color:
                  'var(--text-muted)',
                fontFamily:
                  'Orbitron, sans-serif',
              }}
            >
              {t('totalFocus')}
            </span>

            <div
              className="mono"
              style={{
                marginTop:
                  '8px',
                fontSize:
                  '22px',
                color:
                  'var(--teal)',
              }}
            >
              {formatDuration(
                totalFocusSeconds
              )}
            </div>
          </div>

          <div>
            <span
              style={{
                fontSize: '10px',
                color:
                  'var(--text-muted)',
                fontFamily:
                  'Orbitron, sans-serif',
              }}
            >
              {t('sessions')}
            </span>

            <div
              className="mono"
              style={{
                marginTop:
                  '8px',
                fontSize:
                  '22px',
                color:
                  'var(--energy)',
              }}
            >
              {
                completed.length
              }
            </div>
          </div>

          <div>
            <span
              style={{
                fontSize: '10px',
                color:
                  'var(--text-muted)',
                fontFamily:
                  'Orbitron, sans-serif',
              }}
            >
              {t('avgSession')}
            </span>

            <div
              className="mono"
              style={{
                marginTop:
                  '8px',
                fontSize:
                  '22px',
                color:
                  'var(--text-primary)',
              }}
            >
              {formatDuration(
                averageSession
              )}
            </div>
          </div>

          <div>
            <span
              style={{
                fontSize: '10px',
                color:
                  'var(--text-muted)',
                fontFamily:
                  'Orbitron, sans-serif',
              }}
            >
              {t('longest')}
            </span>

            <div
              className="mono"
              style={{
                marginTop:
                  '8px',
                fontSize:
                  '22px',
                color:
                  'var(--text-primary)',
              }}
            >
              {formatDuration(
                longestSession
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Streaks */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
        }}
      >
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
              '0.12em',
            marginBottom:
              '18px',
          }}
        >
          STREAKS
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
            className="glass-panel"
            style={{
              padding: '16px',
              background:
                'rgba(139,92,246,0.08)',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color:
                  'var(--text-muted)',
              }}
            >
              CURRENT DAILY
            </div>

            <div
              className="mono"
              style={{
                marginTop:
                  '8px',
                fontSize:
                  '26px',
                color:
                  'var(--primary-glow)',
              }}
            >
              {
                streakStats.currentDailyStreak
              }
            </div>

            <div
              style={{
                marginTop:
                  '4px',
                fontSize:
                  '10px',
                color:
                  'var(--text-muted)',
              }}
            >
              {t('days')}
            </div>
          </div>

          <div
            className="glass-panel"
            style={{
              padding: '16px',
              background:
                'rgba(6,182,212,0.08)',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color:
                  'var(--text-muted)',
              }}
            >
              BEST DAILY
            </div>

            <div
              className="mono"
              style={{
                marginTop:
                  '8px',
                fontSize:
                  '26px',
                color:
                  'var(--cyber-glow)',
              }}
            >
              {
                streakStats.bestDailyStreak
              }
            </div>

            <div
              style={{
                marginTop:
                  '4px',
                fontSize:
                  '10px',
                color:
                  'var(--text-muted)',
              }}
            >
              {t('days')}
            </div>
          </div>

          <div
            className="glass-panel"
            style={{
              padding: '16px',
              background:
                'rgba(20,184,166,0.08)',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color:
                  'var(--text-muted)',
              }}
            >
              CURRENT WEEKLY
            </div>

            <div
              className="mono"
              style={{
                marginTop:
                  '8px',
                fontSize:
                  '26px',
                color:
                  'var(--teal-glow)',
              }}
            >
              {
                streakStats.currentWeeklyStreak
              }
            </div>

            <div
              style={{
                marginTop:
                  '4px',
                fontSize:
                  '10px',
                color:
                  'var(--text-muted)',
              }}
            >
              WEEKS
            </div>
          </div>

          <div
            className="glass-panel"
            style={{
              padding: '16px',
              background:
                'rgba(245,158,11,0.08)',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color:
                  'var(--text-muted)',
              }}
            >
              BEST WEEKLY
            </div>

            <div
              className="mono"
              style={{
                marginTop:
                  '8px',
                fontSize:
                  '26px',
                color:
                  'var(--energy-glow)',
              }}
            >
              {
                streakStats.bestWeeklyStreak
              }
            </div>

            <div
              style={{
                marginTop:
                  '4px',
                fontSize:
                  '10px',
                color:
                  'var(--text-muted)',
              }}
            >
              WEEKS
            </div>
          </div>
        </div>
      </div>

      {/* Goal History Chart */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
        }}
      >
        <div
          style={{
            marginBottom:
              '20px',
          }}
        >
          <div
            style={{
              fontSize:
                '11px',
              fontFamily:
                'Orbitron, sans-serif',
              color:
                'var(--text-muted)',
              textTransform:
                'uppercase',
              letterSpacing:
                '0.12em',
              marginBottom:
                '6px',
            }}
          >
            WEEKLY GOAL HISTORY
          </div>

          <div
            style={{
              fontSize:
                '12px',
              color:
                'var(--text-muted)',
            }}
          >
            Goal compared with actual focus time.
          </div>
        </div>

        <ResponsiveContainer
          width="100%"
          height={280}
        >
          <BarChart
            data={chartData}
            margin={{
              top: 10,
              right: 10,
              left: -15,
              bottom: 0,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(106,106,136,0.18)"
              vertical={false}
            />

            <XAxis
              dataKey="week"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: '#6a6a88',
                fontSize: 10,
              }}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fill: '#6a6a88',
                fontSize: 10,
              }}
              unit="m"
            />

            <Tooltip
              content={
                <GoalChartTooltip />
              }
              cursor={{
                fill:
                  'rgba(139,92,246,0.06)',
              }}
            />

            <Bar
              dataKey="goal"
              name="Goal"
              fill="#06b6d4"
              radius={[
                4,
                4,
                0,
                0,
              ]}
              maxBarSize={34}
            />

            <Bar
              dataKey="actual"
              name="Focus"
              fill="#8b5cf6"
              radius={[
                4,
                4,
                0,
                0,
              ]}
              maxBarSize={34}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly History */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems:
              'center',
            justifyContent:
              'space-between',
            gap: '12px',
            marginBottom:
              '20px',
            flexWrap:
              'wrap',
          }}
        >
          <span
            style={{
              fontSize:
                '11px',
              fontFamily:
                'Orbitron, sans-serif',
              color:
                'var(--text-muted)',
              textTransform:
                'uppercase',
              letterSpacing:
                '0.12em',
            }}
          >
            {t('weeklyFocusTrend')}
          </span>

          <span
            className="mono"
            style={{
              fontSize:
                '11px',
              color:
                'var(--text-secondary)',
            }}
          >
            {weeklyGoal}m / week
          </span>
        </div>

        <div
          style={{
            display:
              'flex',
            flexDirection:
              'column',
            gap:
              '12px',
          }}
        >
          {weeklyHistory.map(
            (
              item,
              index
            ) => (
              <div
                key={
                  item.weekStart
                }
                style={{
                  padding:
                    '14px 16px',
                  borderRadius:
                    '10px',
                  background:
                    index === 0
                      ? 'rgba(139,92,246,0.08)'
                      : 'rgba(255,255,255,0.02)',
                  border:
                    '1px solid var(--void-border)',
                }}
              >
                <div
                  style={{
                    display:
                      'flex',
                    justifyContent:
                      'space-between',
                    alignItems:
                      'center',
                    gap:
                      '12px',
                    marginBottom:
                      '10px',
                    flexWrap:
                      'wrap',
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        '11px',
                      fontFamily:
                        'Orbitron, sans-serif',
                      color:
                        'var(--text-secondary)',
                    }}
                  >
                    {formatWeekLabel(
                      new Date(
                        `${item.weekStart}T00:00:00`
                      ),
                      locale,
                      index === 0
                    )}
                  </span>

                  <span
                    className="mono"
                    style={{
                      fontSize:
                        '11px',
                      color:
                        item.completed
                          ? 'var(--success)'
                          : 'var(--text-primary)',
                    }}
                  >
                    {
                      item.completedMinutes
                    }
                    m /{' '}
                    {
                      item.goalMinutes
                    }
                    m
                  </span>
                </div>

                <div
                  style={{
                    height:
                      '7px',
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
                        `${item.progressPercent}%`,
                      height:
                        '100%',
                      background:
                        item.completed
                          ? 'var(--success)'
                          : 'linear-gradient(90deg, var(--cyber-blue), var(--teal))',
                      borderRadius:
                        '999px',
                      transition:
                        'width 0.4s ease',
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
                      item.completed
                        ? 'var(--success)'
                        : 'var(--text-muted)',
                  }}
                >
                  {
                    item.progressPercent
                  }
                  %
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

function getWeekKeySafe(): string {
  return getStartOfWeek(
    new Date()
  )
    .toISOString()
    .slice(0, 10)
}
