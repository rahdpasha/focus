
cat > src/components/dashboard/Dashboard.tsx <<'EOF'

[200~import { useEffect, useRef } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { StudySession } from '../../types'
import { useI18n } from '../../useI18n'

interface WeeklyTrendProps {
  sessions: StudySession[]
}

interface WeeklyTooltipPayload {
  value?: number
}

interface WeeklyTooltipProps {
  active?: boolean
  payload?: WeeklyTooltipPayload[]
  label?: string
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: WeeklyTooltipProps) => {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const point = payload[0]

  if (!point) {
    return null
  }

  return (
    <div
      style={{
        background: 'rgba(10,10,30,0.95)',
        border: '1px solid rgba(139,92,246,0.4)',
        borderRadius: '10px',
        padding: '12px 16px',
        backdropFilter: 'blur(20px)',
      }}
    >
      <p
        style={{
          fontSize: '10px',
          fontFamily: 'Orbitron, sans-serif',
          color: 'var(--text-muted)',
          margin: '0 0 6px',
        }}
      >
        {label}
      </p>

      <p
        className="mono"
        style={{
          fontSize: '22px',
          color: '#c4b5fd',
          margin: 0,
        }}
      >
        {Number(point.value ?? 0).toFixed(1)}

        <span
          style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
          }}
        >
          h
        </span>
      </p>
    </div>
  )
}

function buildWeeklyData(
  sessions: StudySession[],
  dayNames: string[]
) {
  const days: {
    day: string
    hours: number
  }[] = []

  const now = new Date()

  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(now)

    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)

    const next = new Date(date)
    next.setDate(next.getDate() + 1)

    const daySessions = sessions.filter(
      (session) => {
        const timestamp =
          new Date(
            session.completedAt
          ).getTime()

        return (
          timestamp >= date.getTime() &&
          timestamp < next.getTime() &&
          session.completed
        )
      }
    )

    const hours = daySessions.reduce(
      (sum, session) =>
        sum +
        session.actualDuration / 3600,
      0
    )

    days.push({
      day: dayNames[date.getDay()] ?? '',
      hours:
        Math.round(hours * 10) / 10,
    })
  }

  return days
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

  const data = buildWeeklyData(
    sessions,
    dayNames
  )

  const hasData = data.some(
    (item) => item.hours > 0
  )

  useEffect(() => {
    const card = cardRef.current

    if (!card) {
      return
    }

    const handleMouseMove = (
      event: MouseEvent
    ) => {
      const rect =
        card.getBoundingClientRect()

      if (
        rect.width === 0 ||
        rect.height === 0
      ) {
        return
      }

      const x =
        event.clientX - rect.left

      const y =
        event.clientY - rect.top

      const rotateX =
        ((y - rect.height / 2) /
          (rect.height / 2)) *
        -4

      const rotateY =
        ((x - rect.width / 2) /
          (rect.width / 2)) *
        4

      card.style.transform =
        `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
    }

    const handleMouseLeave = () => {
      card.style.transform =
        'perspective(800px) rotateX(0deg) rotateY(0deg)'
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
        minHeight: '340px',
        flex: '1 1 420px',
        transition:
          'transform 0.3s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#8b5cf6',
          }}
        />

        <span
          style={{
            fontSize: '11px',
            fontFamily:
              'Orbitron, sans-serif',
            color:
              'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing:
              '0.12em',
          }}
        >
          {t('weeklyFocusTrend')}
        </span>
      </div>

      {!hasData ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              'center',
            height: '240px',
          }}
        >
          <span
            style={{
              color:
                'var(--text-muted)',
              fontFamily:
                'Orbitron, sans-serif',
              fontSize: '11px',
            }}
          >
            {t('noDataStream')}
          </span>
        </div>
      ) : (
        <ResponsiveContainer
          width="100%"
          height={240}
        >
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: -15,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient
                id="trendGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#8b5cf6"
                  stopOpacity={0.35}
                />

                <stop
                  offset="100%"
                  stopColor="#8b5cf6"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: '#6a6a88',
                fontSize: 11,
              }}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fill: '#6a6a88',
                fontSize: 11,
              }}
              unit="h"
            />

            <Tooltip
              content={
                <CustomTooltip />
              }
              cursor={{
                stroke:
                  'rgba(139,92,246,0.2)',
                strokeWidth: 1,
              }}
            />

            <Area
              type="monotone"
              dataKey="hours"
              stroke="#a78bfa"
              strokeWidth={2.5}
              fill="url(#trendGradient)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}~



