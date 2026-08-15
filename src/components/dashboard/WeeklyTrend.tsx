import { useEffect, useRef } from 'react'
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

interface WeeklyDataPoint {
  day: string
  dateLabel: string
  hours: number
  seconds: number
  sessions: number
}

interface WeeklyTooltipProps {
  active?: boolean
  payload?: Array<{
    value?: number
    payload?: WeeklyDataPoint
  }>
}

function buildWeeklyData(
  sessions: StudySession[],
  dayNames: string[]
): WeeklyDataPoint[] {
  const result: WeeklyDataPoint[] = []
  const now = new Date()

  for (let i = 6; i >= 0; i -= 1) {
    const start = new Date(now)
    start.setDate(start.getDate() - i)
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setDate(end.getDate() + 1)

    const daySessions = sessions.filter((session) => {
      const timestamp =
        new Date(
          session.completedAt
        ).getTime()

      return (
        session.completed &&
        timestamp >= start.getTime() &&
        timestamp < end.getTime()
      )
    })

    const totalSeconds =
      daySessions.reduce(
        (sum, session) =>
          sum + session.actualDuration,
        0
      )

    result.push({
      day:
        i === 0
          ? 'Today'
          : dayNames[start.getDay()],
      dateLabel:
        start.toLocaleDateString(
          undefined,
          {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          }
        ),
      hours:
        totalSeconds / 3600,
      seconds:
        totalSeconds,
      sessions:
        daySessions.length,
    })
  }

  return result
}

function formatHours(
  hours: number
): string {
  const totalMinutes =
    Math.round(hours * 60)

  const wholeHours =
    Math.floor(
      totalMinutes / 60
    )

  const minutes =
    totalMinutes % 60

  if (wholeHours > 0) {
    return minutes > 0
      ? `${wholeHours}h ${minutes}m`
      : `${wholeHours}h`
  }

  return `${minutes}m`
}

function formatSeconds(
  seconds: number
): string {
  const wholeMinutes =
    Math.floor(seconds / 60)

  const remainingSeconds =
    seconds % 60

  if (wholeMinutes === 0) {
    return `${remainingSeconds}s`
  }

  if (remainingSeconds === 0) {
    return `${wholeMinutes}m`
  }

  return `${wholeMinutes}m ${remainingSeconds}s`
}

function CustomTooltip({
  active,
  payload,
}: WeeklyTooltipProps) {
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
        minWidth: '180px',
        padding: '13px 15px',
        borderRadius: '12px',
        border:
          '1px solid rgba(139,92,246,0.22)',
        background:
          'rgba(10,12,20,0.96)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter:
          'blur(18px)',
        boxShadow:
          '0 16px 42px rgba(0,0,0,0.32)',
      }}
    >
      <div
        style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
          marginBottom: '5px',
        }}
      >
        {point.dateLabel}
      </div>

      <div
        className="mono"
        style={{
          fontSize: '19px',
          color: 'var(--primary-glow)',
        }}
      >
        {formatSeconds(
          point.seconds
        )}
      </div>

      <div
        style={{
          marginTop: '5px',
          fontSize: '10px',
          color: 'var(--text-muted)',
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
  const cardRef =
    useRef<HTMLDivElement>(null)

  const dayNames = [
    t('sun'),
    t('mon'),
    t('tue'),
    t('wed'),
    t('thu'),
    t('fri'),
    t('sat'),
  ]

  const data =
    buildWeeklyData(
      sessions,
      dayNames
    )

  const totalSeconds =
    data.reduce(
      (sum, item) =>
        sum + item.seconds,
      0
    )

  const totalHours =
    totalSeconds / 3600

  const averageHours =
    data.length > 0
      ? totalHours / data.length
      : 0

  const bestDay =
    [...data].sort(
      (a, b) =>
        b.seconds - a.seconds
    )[0] ?? null

  const hasData =
    totalHours > 0

  useEffect(() => {
    const card =
      cardRef.current

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
          -2.5

        const rotateY =
          ((x -
            rect.width / 2) /
            rect.width) *
          2.5

        card.style.transform =
          `perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
      }

    const handleMouseLeave =
      () => {
        card.style.transform =
          'perspective(1100px) rotateX(0deg) rotateY(0deg)'
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

  return (
    <div
      ref={cardRef}
      className="glass-panel"
      style={{
        padding: '24px',
        minHeight: '380px',
        flex: '1 1 420px',
        transition:
          'transform 0.25s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '18px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '5px',
            }}
          >
            <div
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background:
                  'var(--primary)',
                boxShadow:
                  '0 0 12px rgba(139,92,246,0.35)',
              }}
            />

            <span
              style={{
                fontSize: '10px',
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
              {t('weeklyFocusTrend')}
            </span>
          </div>

          <div
            style={{
              fontSize: '12px',
              color:
                'var(--text-secondary)',
            }}
          >
            Your focus rhythm over the
            last seven days.
          </div>
        </div>

        {hasData && (
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
                  'rgba(139,92,246,0.08)',
                border:
                  '1px solid rgba(139,92,246,0.12)',
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
                {formatSeconds(
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
                border:
                  '1px solid rgba(56,189,248,0.10)',
              }}
            >
              <div
                style={{
                  fontSize: '9px',
                  color:
                    'var(--text-muted)',
                }}
              >
                BEST DAY
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
                {bestDay?.day ?? '—'}
              </div>
            </div>
          </div>
        )}
      </div>

      {!hasData ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '250px',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              border:
                '1px solid var(--void-border)',
              background:
                'rgba(139,92,246,0.05)',
            }}
          />

          <span
            style={{
              color:
                'var(--text-muted)',
              fontSize: '11px',
            }}
          >
            {t('noDataStream')}
          </span>
        </div>
      ) : (
        <>
          <ResponsiveContainer
            width="100%"
            height={235}
          >
            <AreaChart
              data={data}
              margin={{
                top: 10,
                right: 8,
                left: -20,
                bottom: 4,
              }}
            >
              <defs>
                <linearGradient
                  id="weeklyTrendFill"
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
                    offset="70%"
                    stopColor="#8b5cf6"
                    stopOpacity={0.07}
                  />
                  <stop
                    offset="100%"
                    stopColor="#8b5cf6"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                vertical={false}
                stroke="rgba(255,255,255,0.045)"
                strokeDasharray="4 5"
              />

              <XAxis
                dataKey="day"
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
                axisLine={false}
                tickLine={false}
                tick={{
                  fill:
                    'var(--text-muted)',
                  fontSize: 10,
                }}
                width={42}
                tickFormatter={(
                  value: number
                ) =>
                  `${value.toFixed(1)}h`
                }
              />

              <ReferenceLine
                y={averageHours}
                stroke="rgba(167,139,250,0.45)"
                strokeDasharray="5 5"
              />

              <Tooltip
                content={
                  <CustomTooltip />
                }
                cursor={{
                  stroke:
                    'rgba(139,92,246,0.26)',
                  strokeWidth: 1,
                }}
              />

              <Area
                type="monotone"
                dataKey="hours"
                stroke="#a78bfa"
                strokeWidth={2.5}
                fill="url(#weeklyTrendFill)"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: '#b59cff',
                  stroke:
                    '#0b0c12',
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent:
                'space-between',
              gap: '12px',
              marginTop: '8px',
              paddingTop: '12px',
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
                Daily Average
              </div>

              <div
                className="mono"
                style={{
                  marginTop: '3px',
                  fontSize: '12px',
                  color:
                    'var(--text-secondary)',
                }}
              >
                {formatHours(
                  averageHours
                )}
              </div>
            </div>

            <div
              style={{
                textAlign:
                  'right',
              }}
            >
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
                Peak
              </div>

              <div
                className="mono"
                style={{
                  marginTop: '3px',
                  fontSize: '12px',
                  color:
                    'var(--primary-glow)',
                }}
              >
                {bestDay
                  ? `${bestDay.day} · ${formatSeconds(bestDay.seconds)}`
                  : '—'}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
