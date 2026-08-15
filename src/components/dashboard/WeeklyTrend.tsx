import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
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
  dateLabel: string
  seconds: number
  hours: number
  sessions: number
}

interface HourPoint {
  hour: number
  label: string
  seconds: number
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{
    payload?: DayPoint
  }>
}

interface HourTooltipProps {
  active?: boolean
  payload?: Array<{
    payload?: HourPoint
  }>
}

function formatDuration(
  seconds: number
): string {
  const totalMinutes =
    Math.floor(seconds / 60)

  const hours =
    Math.floor(totalMinutes / 60)

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

function formatAxisDuration(
  seconds: number
): string {
  const totalMinutes =
    Math.round(seconds / 60)

  const hours =
    Math.floor(totalMinutes / 60)

  const minutes =
    totalMinutes % 60

  if (hours === 0) {
    return `${minutes}m`
  }

  return minutes > 0
    ? `${hours}h ${minutes}m`
    : `${hours}h`
}

function buildDays(
  sessions: StudySession[],
  dayNames: string[]
): DayPoint[] {
  const now = new Date()
  const days: DayPoint[] = []

  for (
    let offset = 6;
    offset >= 0;
    offset -= 1
  ) {
    const start = new Date(now)

    start.setDate(
      start.getDate() - offset
    )

    start.setHours(0, 0, 0, 0)

    const end = new Date(start)

    end.setDate(
      end.getDate() + 1
    )

    const daySessions =
      sessions.filter(
        (session) => {
          if (!session.completed) {
            return false
          }

          const timestamp =
            new Date(
              session.completedAt
            ).getTime()

          return (
            timestamp >=
              start.getTime() &&
            timestamp <
              end.getTime()
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

function buildHourlyData(
  sessions: StudySession[]
): HourPoint[] {
  const buckets = Array.from(
    { length: 24 },
    (_, hour) => ({
      hour,
      label: `${String(hour).padStart(2, '0')}:00`,
      seconds: 0,
    })
  )

  const now = new Date()
  const startOfRange =
    new Date(now)

  startOfRange.setHours(
    0,
    0,
    0,
    0
  )

  startOfRange.setDate(
    startOfRange.getDate() - 6
  )

  const endOfRange =
    new Date(now)

  endOfRange.setHours(
    23,
    59,
    59,
    999
  )

  sessions.forEach(
    (session) => {
      if (!session.completed) {
        return
      }

      const completedAt =
        new Date(
          session.completedAt
        )

      if (
        completedAt < startOfRange ||
        completedAt > endOfRange
      ) {
        return
      }

      buckets[
        completedAt.getHours()
      ].seconds +=
        session.actualDuration
    }
  )

  return buckets
}

function DayTooltip({
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

function HourTooltip({
  active,
  payload,
}: HourTooltipProps) {
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

  const nextHour =
    (point.hour + 1) % 24

  return (
    <div
      style={{
        minWidth: '155px',
        padding: '12px 14px',
        borderRadius: '12px',
        background:
          'rgba(8,10,18,0.97)',
        border:
          '1px solid rgba(56,189,248,0.24)',
        boxShadow:
          '0 16px 40px rgba(0,0,0,0.28)',
        backdropFilter:
          'blur(18px)',
      }}
    >
      <div
        style={{
          fontSize: '10px',
          color:
            'var(--text-muted)',
        }}
      >
        {point.label} →{' '}
        {String(nextHour).padStart(
          2,
          '0'
        )}
        :00
      </div>

      <div
        className="mono"
        style={{
          marginTop: '5px',
          fontSize: '17px',
          color:
            'var(--cyber-glow)',
        }}
      >
        {formatDuration(
          point.seconds
        )}
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

  const hourlyData = useMemo(
    () =>
      buildHourlyData(
        sessions
      ),
    [sessions]
  )

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

  const peakDay =
    [...data].sort(
      (a, b) =>
        b.seconds -
        a.seconds
    )[0] ?? null

  const peakHour =
    [...hourlyData].sort(
      (a, b) =>
        b.seconds -
        a.seconds
    )[0] ?? null

  const maxDaySeconds =
    Math.max(
      3600,
      ...data.map(
        (item) =>
          item.seconds
      )
    )

  const hasData =
    totalSeconds > 0

  return (
    <div
      className="glass-panel"
      style={{
        padding: '24px',
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
            DAILY FOCUS
          </div>

          <div
            style={{
              marginTop: '5px',
              fontSize: '12px',
              color:
                'var(--text-secondary)',
            }}
          >
            Your exact focus rhythm
            across the last seven days.
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
              PEAK DAY
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
              {peakDay
                ? `${peakDay.day} · ${formatDuration(peakDay.seconds)}`
                : '—'}
            </div>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div
          style={{
            padding:
              '80px 20px',
            textAlign: 'center',
            color:
              'var(--text-muted)',
            fontSize: '11px',
          }}
        >
          No completed focus sessions yet.
        </div>
      ) : (
        <>
          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <AreaChart
              data={data}
              margin={{
                top: 12,
                right: 10,
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
                    stopOpacity={0.07}
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
                domain={[
                  0,
                  maxDaySeconds,
                ]}
                axisLine={false}
                tickLine={false}
                tick={{
                  fill:
                    'var(--text-muted)',
                  fontSize: 10,
                }}
                tickFormatter={
                  formatAxisDuration
                }
                width={60}
              />

              <ReferenceLine
                y={
                  averageSeconds
                }
                stroke="rgba(167,139,250,0.36)"
                strokeDasharray="4 7"
              />

              <Tooltip
                content={
                  <DayTooltip />
                }
                cursor={{
                  stroke:
                    'rgba(139,92,246,0.30)',
                  strokeWidth: 1,
                }}
              />

              <Area
                type="natural"
                dataKey="seconds"
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
              marginTop: '20px',
              paddingTop: '20px',
              borderTop:
                '1px solid var(--void-border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  'space-between',
                gap: '12px',
                marginBottom: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div
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
                      '0.1em',
                  }}
                >
                  24-HOUR RHYTHM
                </div>

                <div
                  style={{
                    marginTop: '4px',
                    fontSize: '10px',
                    color:
                      'var(--text-muted)',
                  }}
                >
                  Recorded sessions by
                  completion hour.
                </div>
              </div>

              <div
                className="mono"
                style={{
                  fontSize: '10px',
                  color:
                    'var(--text-muted)',
                }}
              >
                {peakHour &&
                peakHour.seconds > 0
                  ? `Peak · ${peakHour.label}`
                  : 'No peak yet'}
              </div>
            </div>

            <ResponsiveContainer
              width="100%"
              height={150}
            >
              <BarChart
                data={hourlyData}
                margin={{
                  top: 8,
                  right: 4,
                  left: -18,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient
                    id="hourlyGlow"
                    x1="0"
                    y1="1"
                    x2="0"
                    y2="0"
                  >
                    <stop
                      offset="0%"
                      stopColor="#38bdf8"
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="100%"
                      stopColor="#8b5cf6"
                      stopOpacity={0.9}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  vertical={false}
                  stroke="rgba(255,255,255,0.035)"
                  strokeDasharray="2 8"
                />

                <XAxis
                  dataKey="hour"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill:
                      'var(--text-muted)',
                    fontSize: 9,
                  }}
                  interval={3}
                  tickFormatter={(
                    hour: number
                  ) =>
                    `${String(hour).padStart(2, '0')}:00`
                  }
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={false}
                  width={12}
                />

                <Tooltip
                  content={
                    <HourTooltip />
                  }
                  cursor={{
                    fill:
                      'rgba(139,92,246,0.06)',
                  }}
                />

                <Bar
                  dataKey="seconds"
                  fill="url(#hourlyGlow)"
                  radius={[
                    4,
                    4,
                    0,
                    0,
                  ]}
                  maxBarSize={12}
                  isAnimationActive
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent:
                'space-between',
              gap: '16px',
              marginTop: '16px',
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
                }}
              >
                DAILY AVERAGE
              </div>

              <div
                className="mono"
                style={{
                  marginTop: '4px',
                  fontSize: '12px',
                  color:
                    'var(--text-secondary)',
                }}
              >
                {formatDuration(
                  averageSeconds
                )}
              </div>
            </div>

            <div
              style={{
                fontSize: '10px',
                color:
                  'var(--text-muted)',
                textAlign: 'right',
              }}
            >
              Hover any day or hour for
              exact recorded time.
            </div>
          </div>
        </>
      )}
    </div>
  )
}
