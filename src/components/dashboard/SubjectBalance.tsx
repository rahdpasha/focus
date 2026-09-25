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
    <div className="focus-chart-tooltip">
      <span>{data.name}</span>

      <strong className="mono">
        This week:{' '}
        {payload.find(
          (item) =>
            item.dataKey ===
            'thisWeek'
        )?.value ?? 0}
        m
      </strong>

      <small className="mono">
        Last week:{' '}
        {payload.find(
          (item) =>
            item.dataKey ===
            'lastWeek'
        )?.value ?? 0}
        m
      </small>
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
    <section
      ref={cardRef}
      className="glass-panel dashboard-insight-card subject-balance-v5"
    >
      <div className="dashboard-insight-head">
        <div>
          <span className="dashboard-insight-kicker">Subject balance</span>
          <p>Compare where your focus went this week against last week.</p>
        </div>

        <span className="dashboard-insight-meta mono">
          This week / last week
        </span>
      </div>

      {!hasData ? (
        <div className="dashboard-insight-empty">
          Complete a focus session to reveal your subject balance.
        </div>
      ) : (
        <div className="dashboard-insight-chart">
          <ResponsiveContainer width="100%" height={270}>
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
                stroke="var(--focus-hairline)"
              />

              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: 'var(--text-muted)',
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
                  fill: 'var(--text-secondary)',
                  fontSize: 10,
                }}
              />

              <Tooltip
                content={<SubjectTooltip />}
                cursor={{
                  fill: 'var(--primary-soft)',
                }}
              />

              <Bar
                dataKey="lastWeek"
                name="Last week"
                fill="var(--text-muted)"
                fillOpacity={0.28}
                radius={[0, 4, 4, 0]}
                barSize={9}
              />

              <Bar
                dataKey="thisWeek"
                name="This week"
                fill="var(--primary-glow)"
                radius={[0, 4, 4, 0]}
                barSize={9}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}
