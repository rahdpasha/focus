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
  dayNames: string[],
  todayLabel: string,
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
          ? todayLabel
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
  const { tr } = useI18n()
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
    <div className="focus-chart-tooltip focus-chart-tooltip-wide">
      <span>{point.dateLabel}</span>
      <strong className="mono">
        {formatDuration(point.seconds)}
      </strong>
      <small>
        {point.sessions}{' '}
        {tr(point.sessions === 1 ? 'session' : 'sessions', 'سێشن')}
      </small>
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
    <div className="focus-chart-tooltip">
      <span>
        {point.label} → {String(nextHour).padStart(2, '0')}:00
      </span>
      <strong className="mono">
        {formatDuration(point.seconds)}
      </strong>
    </div>
  )
}

export default function WeeklyTrend({
  sessions,
}: WeeklyTrendProps) {
  const { t, tr } = useI18n()

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
      dayNames,
      t('today'),
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
    <section className="glass-panel dashboard-insight-card weekly-trend-v5">
      <div className="dashboard-insight-head weekly-trend-v5-head">
        <div>
          <span className="dashboard-insight-kicker">{tr('Daily focus', 'سەرنجی ڕۆژانە')}</span>
          <p>{tr('Your focus rhythm across the last seven days.', 'ڕێتمی سەرنجت لە حەوت ڕۆژی ڕابردوو.')}</p>
        </div>

        <div className="dashboard-insight-summary">
          <div>
            <span>{tr('Total', 'کۆی گشتی')}</span>
            <strong className="mono">{formatDuration(totalSeconds)}</strong>
          </div>

          <div>
            <span>{tr('Peak day', 'بەهێزترین ڕۆژ')}</span>
            <strong className="mono">
              {peakDay
                ? `${peakDay.day} · ${formatDuration(peakDay.seconds)}`
                : '—'}
            </strong>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="dashboard-insight-empty">
          {tr('Complete a focus session to reveal your weekly rhythm.', 'سێشنێکی سەرنج تەواو بکە بۆ بینینی ڕێتمی هەفتانەت.')}
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
                    stopColor="var(--primary)"
                    stopOpacity={0.28}
                  />
                  <stop
                    offset="65%"
                    stopColor="var(--primary)"
                    stopOpacity={0.07}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--primary)"
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
                stroke="var(--focus-hairline)"
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
                stroke="var(--primary-border)"
                strokeDasharray="4 7"
              />

              <Tooltip
                content={
                  <DayTooltip />
                }
                cursor={{
                  stroke:
                    'var(--primary-border)',
                  strokeWidth: 1,
                }}
              />

              <Area
                type="natural"
                dataKey="seconds"
                stroke="var(--primary-glow)"
                strokeWidth={2}
                strokeDasharray="8 6"
                fill="url(#focusFill)"
                isAnimationActive
                animationDuration={900}
                animationEasing="ease-out"
                activeDot={{
                  r: 5,
                  fill:
                    'var(--primary-glow)',
                  stroke:
                    'var(--void-bg)',
                  strokeWidth: 2,
                  filter:
                    'url(#focusGlow)',
                }}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>

          <div className="weekly-trend-v5-hourly">
            <div className="dashboard-insight-subhead">
              <div>
                <span>{tr('24-hour rhythm', 'ڕێتمی ٢٤ کاتژمێر')}</span>
                <p>{tr('Recorded sessions by completion hour.', 'سێشنە تۆمارکراوەکان بەپێی کاتی تەواوبوون.')}</p>
              </div>

              <strong className="mono">
                {peakHour && peakHour.seconds > 0
                  ? `${tr('Peak', 'لووتکە')} · ${peakHour.label}`
                  : tr('No peak yet', 'هێشتا لووتکە نییە')}
              </strong>
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
                      stopColor="var(--energy)"
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--primary)"
                      stopOpacity={0.9}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  vertical={false}
                  stroke="var(--focus-hairline)"
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
                      'var(--primary-soft)',
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

          <div className="weekly-trend-v5-footer">
            <div>
              <span>{tr('Daily average', 'ناوەندی ڕۆژانە')}</span>
              <strong className="mono">{formatDuration(averageSeconds)}</strong>
            </div>

            <p>{tr('Hover any day or hour for exact recorded time.', 'لەسەر هەر ڕۆژ یان کاتژمێرێک بوەستە بۆ بینینی کاتی ورد.')}</p>
          </div>
        </>
      )}
    </section>
  )
}
