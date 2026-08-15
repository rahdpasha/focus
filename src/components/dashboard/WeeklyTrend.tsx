import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import type { StudySession } from '../../types'
import { useI18n } from '../../useI18n'

interface WeeklyTrendProps {
  sessions: StudySession[]
}

interface DayPoint {
  day: string
  shortDay: string
  dateLabel: string
  seconds: number
  hours: number
  sessions: number
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{
    payload?: DayPoint
  }>
}

function formatDuration(seconds: number): string {
  const totalMinutes = Math.floor(
    seconds / 60
  )

  const hours = Math.floor(
    totalMinutes / 60
  )

  const minutes =
    totalMinutes % 60

  const remainingSeconds =
    seconds % 60

  if (hours > 0) {
    if (minutes > 0) {
      return `${hours}h ${minutes}m`
    }

    return `${hours}h`
  }

  if (minutes > 0) {
    if (remainingSeconds > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }

    return `${minutes}m`
  }

  return `${remainingSeconds}s`
}

function formatHoursTick(value: number): string {
  if (value === 0) {
    return '0'
  }

  if (Number.isInteger(value)) {
    return `${value}h`
  }

  const hours = Math.floor(value)
  const minutes = Math.round(
    (value - hours) * 60
  )

  if (minutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${minutes}m`
}

function buildDays(
  sessions: StudySession[],
  dayNames: string[]
): DayPoint[] {
  const now = new Date()
  const days: DayPoint[] = []

  for (let offset = 6; offset >= 0; offset -= 1) {
    const start = new Date(now)
    start.setDate(
      start.getDate() - offset
    )
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setDate(
      end.getDate() + 1
    )

    const daySessions = sessions.filter(
      (session) => {
        if (!session.completed) {
          return false
        }

        const timestamp =
          new Date(
            session.completedAt
          ).getTime()

        return (
          timestamp >= start.getTime() &&
          timestamp < end.getTime()
        )
      }
    )

    const seconds =
      daySessions.reduce(
        (sum, session) =>
          sum +
          session.actualDuration,
        0
      )

    days.push({
      day:
        offset === 0
          ? 'Today'
          : dayNames[
              start.getDay()
            ],
      shortDay:
        offset === 0
          ? 'Today'
          : dayNames[
              start.getDay()
            ],
      dateLabel:
        start.toLocaleDateString(
          undefined,
          {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          }
        ),
      seconds,
      hours: seconds / 3600,
      sessions:
        daySessions.length,
    })
  }

  return days
}

function ChartTooltip({
  active,
  payload,
}: TooltipProps) {
  if (
    !active ||
    !payload ||
    payload.length === 0
  ) {
    return null
  }

  const point =
    payload[0]?.payload

  if (!point) {
    return null
  }

  return (
    <div
      style={{
        minWidth: '190px',
        padding: '14px 16px',
        borderRadius: '14px',
        background:
          'rgba(8,10,18,0.97)',
        border:
          '1px solid rgba(139,92,246,0.28)',
        boxShadow:
          '0 18px 45px rgba(0,0,0,0.32)',
        backdropFilter:
          'blur(20px)',
      }}
    >
      <div
        style={{
          fontSize: '10px',
          color:
            'var(--text-muted)',
          marginBottom: '7px',
        }}
      >
        {point.dateLabel}
      </div>

      <div
        className="mono"
        style={{
          fontSize: '20px',
          color:
            'var(--primary-glow)',
        }}
      >
        {formatDuration(
          point.seconds
        )}
      </div>

      <div
        style={{
          marginTop: '6px',
          fontSize: '10px',
          color:
            'var(--text-muted)',
        }}
      >
        {point.sessions}{' '}
        {point.sessions === 1
          ? 'session'
          : 'sessions'}
      </div>
    </div>
  )
}

export default function WeeklyTrend({
  sessions,
}: WeeklyTrendProps) {
  const { t } = useI18n()

  const data = useMemo(() => {
    const dayNames = [
      t('sun'),
      t('mon'),
      t('tue'),
      t('wed'),
      t('thu'),
      t('fri'),
      t('sat'),
    ]

    return buildDays(
      sessions,
      dayNames
    )
  }, [sessions, t])

  const totalSeconds =
    data.reduce(
      (sum, item) =>
        sum + item.seconds,
      0
    )

  const averageSeconds =
    data.length > 0
      ? Math.round(
          totalSeconds /
            data.length
        )
      : 0

  const maxDay =
    [...data].sort(
      (a, b) =>
        b.seconds -
        a.seconds
    )[0] ?? null

  const maxHours =
    Math.max(
      1,
      ...data.map(
        (item) => item.hours
      )
    )

  const yMax =
    Math.ceil(
      maxHours * 1.15
    )

  return (
    <div
      className="glass-panel"
      style={{
        padding: '24px',
        minHeight: '420px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent:
            'space-between',
          gap: '18px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '11px',
              fontFamily:
                'Space Grotesk, sans-serif',
              fontWeight: 600,
              color:
                'var(--text-muted)',
              textTransform:
                'uppercase',
              letterSpacing:
                '0.12em',
            }}
          >
            DAILY FOCUS TREND
          </div>

          <div
            style={{
              marginTop: '6px',
              fontSize: '12px',
              color:
                'var(--text-secondary)',
            }}
          >
            Exact focus recorded for
            each calendar day.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              padding:
                '7px 10px',
              borderRadius: '9px',
              background:
                'rgba(139,92,246,0.07)',
            }}
          >
            <div
              style={{
                fontSize: '9px',
                color:
                  'var(--text-muted)',
              }}
            >
              TOTAL
            </div>

            <div
              className="mono"
              style={{
                marginTop: '2px',
                fontSize: '12px',
                color:
                  'var(--primary-glow)',
              }}
            >
              {formatDuration(
                totalSeconds
              )}
            </div>
          </div>

          <div
            style={{
              padding:
                '7px 10px',
              borderRadius: '9px',
              background:
                'rgba(56,189,248,0.06)',
            }}
          >
            <div
              style={{
                fontSize: '9px',
                color:
                  'var(--text-muted)',
              }}
            >
              DAILY AVG
            </div>

            <div
              className="mono"
              style={{
                marginTop: '2px',
                fontSize: '12px',
                color:
                  'var(--cyber-glow)',
              }}
            >
              {formatDuration(
                averageSeconds
              )}
            </div>
          </div>
        </div>
      </div>

      <ResponsiveContainer
        width="100%"
        height={275}
      >
        <AreaChart
          data={data}
          margin={{
            top: 12,
            right: 12,
            left: -10,
            bottom: 8,
          }}
        >
          <defs>
            <linearGradient
              id="focusFill"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#8b5cf6"
                stopOpacity={0.28}
              />
              <stop
                offset="65%"
                stopColor="#8b5cf6"
                stopOpacity={0.08}
              />
              <stop
                offset="100%"
                stopColor="#8b5cf6"
                stopOpacity={0}
              />
            </linearGradient>

            <filter
              id="focusGlow"
              x="-30%"
              y="-30%"
              width="160%"
              height="160%"
            >
              <feGaussianBlur
                stdDeviation="3"
                result="blur"
              />
              <feMerge>
                <feMergeNode
                  in="blur"
                />
                <feMergeNode
                  in="SourceGraphic"
                />
              </feMerge>
            </filter>
          </defs>

          <CartesianGrid
            vertical={false}
            stroke="rgba(255,255,255,0.045)"
            strokeDasharray="3 7"
          />

          <XAxis
            dataKey="shortDay"
            axisLine={false}
            tickLine={false}
            tick={{
              fill:
                'var(--text-muted)',
              fontSize: 10,
            }}
            dy={8}
          />

          <YAxis
            domain={[
              0,
              yMax,
            ]}
            axisLine={false}
            tickLine={false}
            tick={{
              fill:
                'var(--text-muted)',
              fontSize: 10,
            }}
            tickFormatter={
              formatHoursTick
            }
            width={55}
          />

          <ReferenceLine
            y={
              averageSeconds /
              3600
            }
            stroke="rgba(167,139,250,0.35)"
            strokeDasharray="4 7"
          />

          <Tooltip
            content={
              <ChartTooltip />
            }
            cursor={{
              stroke:
                'rgba(139,92,246,0.30)',
              strokeWidth: 1,
            }}
          />

          <Area
            type="natural"
            dataKey="hours"
            stroke="#b59cff"
            strokeWidth={2}
            strokeDasharray="8 6"
            fill="url(#focusFill)"
            isAnimationActive
            animationDuration={900}
            animationEasing="ease-out"
            activeDot={{
              r: 5,
              fill:
                '#b59cff',
              stroke:
                '#0b0c12',
              strokeWidth: 2,
              filter:
                'url(#focusGlow)',
            }}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent:
            'space-between',
          gap: '16px',
          marginTop: '12px',
          paddingTop: '14px',
          borderTop:
            '1px solid var(--void-border)',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '9px',
              color:
                'var(--text-muted)',
              textTransform:
                'uppercase',
              letterSpacing:
                '0.08em',
            }}
          >
            PEAK DAY
          </div>

          <div
            className="mono"
            style={{
              marginTop: '4px',
              fontSize: '12px',
              color:
                'var(--primary-glow)',
            }}
          >
            {maxDay
              ? `${maxDay.day} · ${formatDuration(maxDay.seconds)}`
              : '—'}
          </div>
        </div>

        <div
          style={{
            fontSize: '10px',
            color:
              'var(--text-muted)',
          }}
        >
          Hover a day for exact
          recorded time
        </div>
      </div>
    </div>
  )
}
