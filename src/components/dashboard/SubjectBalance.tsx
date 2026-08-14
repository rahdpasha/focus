import { useEffect, useRef } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import type { StudySession } from '../../types'
import { getStartOfWeek } from '../../utils/goalHistory'

interface SubjectBalanceProps {
  sessions: StudySession[]
}

interface SubjectRow {
  name: string
  color: string
  thisWeek: number
  lastWeek: number
}

interface SubjectTooltipProps {
  active?: boolean
  payload?: Array<{
    dataKey?: string
    value?: number
    payload?: {
      name?: string
      color?: string
    }
  }>
}

function getCompletedSessions(
  sessions: StudySession[]
): StudySession[] {
  return sessions.filter(
    (session) =>
      session.completed &&
      session.actualDuration > 0
  )
}

function buildSubjectData(
  sessions: StudySession[]
): SubjectRow[] {
  const currentWeek =
    getStartOfWeek(new Date())

  const previousWeek =
    new Date(currentWeek)

  previousWeek.setDate(
    previousWeek.getDate() - 7
  )

  const currentStart =
    currentWeek.getTime()

  const previousStart =
    previousWeek.getTime()

  const currentEnd =
    new Date(currentWeek)

  currentEnd.setDate(
    currentEnd.getDate() + 7
  )

  const currentEndTime =
    currentEnd.getTime()

  const previousEnd =
    new Date(previousWeek)

  previousEnd.setDate(
    previousEnd.getDate() + 7
  )

  const previousEndTime =
    previousEnd.getTime()

  const map = new Map<
    string,
    {
      color: string
      thisWeek: number
      lastWeek: number
    }
  >()

  getCompletedSessions(
    sessions
  ).forEach((session) => {
    const timestamp =
      new Date(
        session.completedAt
      ).getTime()

    const existing =
      map.get(session.subjectName)

    if (!existing) {
      map.set(session.subjectName, {
        color:
          session.subjectColor,
        thisWeek: 0,
        lastWeek: 0,
      })
    }

    const entry =
      map.get(session.subjectName)!

    const minutes =
      session.actualDuration /
      60

    if (
      timestamp >= currentStart &&
      timestamp < currentEndTime
    ) {
      entry.thisWeek += minutes
    }

    if (
      timestamp >= previousStart &&
      timestamp < previousEndTime
    ) {
      entry.lastWeek += minutes
    }
  })

  const rows =
    Array.from(map.entries()).map(
      ([name, value]) => ({
        name,
        color: value.color,
        thisWeek:
          Math.round(
            value.thisWeek
          ),
        lastWeek:
          Math.round(
            value.lastWeek
          ),
      })
    )

  return rows.sort(
    (a, b) =>
      b.thisWeek - a.thisWeek
  )
}

function SubjectTooltip({
  active,
  payload,
}: SubjectTooltipProps) {
  if (
    !active ||
    !payload ||
    payload.length === 0
  ) {
    return null
  }

  const data =
    payload[0]?.payload

  if (!data) {
    return null
  }

  return (
    <div
      style={{
        background:
          'rgba(10,10,30,0.96)',
        border:
          `1px solid ${data.color}55`,
        borderRadius: '10px',
        padding: '12px 16px',
      }}
    >
      <div
        style={{
          fontSize: '10px',
          fontFamily:
            'Orbitron, sans-serif',
          color:
            'var(--text-muted)',
          marginBottom: '8px',
        }}
      >
        {data.name}
      </div>

      <div
        className="mono"
        style={{
          fontSize: '12px',
          color:
            'var(--text-primary)',
          marginBottom: '4px',
        }}
      >
        This week:{' '}
        {payload.find(
          (item) =>
            item.dataKey ===
            'thisWeek'
        )?.value ?? 0}
        m
      </div>

      <div
        className="mono"
        style={{
          fontSize: '12px',
          color:
            'var(--text-muted)',
        }}
      >
        Last week:{' '}
        {payload.find(
          (item) =>
            item.dataKey ===
            'lastWeek'
        )?.value ?? 0}
        m
      </div>
    </div>
  )
}

export default function SubjectBalance({
  sessions,
}: SubjectBalanceProps) {
  const cardRef =
    useRef<HTMLDivElement>(null)

  const data =
    buildSubjectData(
      sessions
    )

  const hasData =
    data.some(
      (item) =>
        item.thisWeek > 0 ||
        item.lastWeek > 0
    )

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
          -4

        const rotateY =
          ((x -
            rect.width / 2) /
            rect.width) *
          4

        card.style.transform =
          `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
      }

    const handleMouseLeave =
      () => {
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
        flex: '1 1 340px',
        transition:
          'transform 0.3s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent:
            'space-between',
          gap: '12px',
          marginBottom: '8px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background:
                'var(--cyber-blue)',
            }}
          />

          <span
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
            }}
          >
            Subject Balance
          </span>
        </div>

        <span
          className="mono"
          style={{
            fontSize: '10px',
            color:
              'var(--text-muted)',
          }}
        >
          THIS WEEK / LAST WEEK
        </span>
      </div>

      {!hasData ? (
        <div
          style={{
            display: 'flex',
            alignItems:
              'center',
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
            NO DATA STREAM
          </span>
        </div>
      ) : (
        <ResponsiveContainer
          width="100%"
          height={270}
        >
          <BarChart
            data={data}
            layout="vertical"
            margin={{
              top: 8,
              right: 12,
              bottom: 8,
              left: 24,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="rgba(106,106,136,0.18)"
            />

            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: '#6a6a88',
                fontSize: 10,
              }}
              unit="m"
            />

            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              width={110}
              tick={{
                fill: '#b0b0cc',
                fontSize: 10,
              }}
            />

            <Tooltip
              content={
                <SubjectTooltip />
              }
              cursor={{
                fill:
                  'rgba(139,92,246,0.05)',
              }}
            />

            <Bar
              dataKey="lastWeek"
              name="Last week"
              fill="rgba(106,106,136,0.45)"
              radius={[
                0,
                4,
                4,
                0,
              ]}
              barSize={9}
            />

            <Bar
              dataKey="thisWeek"
              name="This week"
              fill="#8b5cf6"
              radius={[
                0,
                4,
                4,
                0,
              ]}
              barSize={9}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
