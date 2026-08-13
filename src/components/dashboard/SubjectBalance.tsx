import { useRef, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { StudySession } from '../../types'

interface SubjectBalanceProps {
  sessions: StudySession[]
}

const subjectColors: Record<string, string> = {
  'Software Engineering': '#8b5cf6',
  'English': '#3b82f6',
  'History': '#f59e0b',
  'Faith': '#14b8a6',
}

function buildSubjectData(sessions: StudySession[]) {
  const completed = sessions.filter(s => s.completed)
  const map: Record<string, number> = {}

  completed.forEach(s => {
    map[s.subjectName] =
      (map[s.subjectName] || 0) + s.actualDuration / 3600
  })

  return Object.entries(map).map(([name, value]) => ({
    name,
    value: Math.round(value * 10) / 10,
    color: subjectColors[name] || '#6a6a88',
  }))
}

interface SubjectTooltipProps {
  active?: boolean
  payload?: Array<{
    name?: string
    value?: number
    payload?: {
      color?: string
    }
  }>
}

const CustomTooltip = ({
  active,
  payload,
}: SubjectTooltipProps) => {
  if (!active || !payload || !payload.length) return null

  const d = payload[0]

  return (
    <div style={{
      background: 'rgba(10,10,30,0.95)',
      border: `1px solid ${(d.payload?.color ?? 'var(--primary)')}40`,
      borderRadius: '10px',
      padding: '12px 16px',
    }}>
      <p style={{
        fontSize: '10px',
        fontFamily: 'Orbitron, sans-serif',
        color: 'var(--text-muted)',
        margin: '0 0 6px',
      }}>
        {d.name}
      </p>

      <p className="mono" style={{
        fontSize: '22px',
        color: d.payload?.color ?? 'var(--primary)',
        margin: 0,
      }}>
        {d.value}
        <span style={{
          fontSize: '14px',
          color: 'var(--text-muted)',
        }}>
          h
        </span>
      </p>
    </div>
  )
}

export default function SubjectBalance({ sessions }: SubjectBalanceProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const data = buildSubjectData(sessions)
  const total = data.reduce((sum, d) => sum + d.value, 0)

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const rotateX =
        ((y - rect.height / 2) / (rect.height / 2)) * -4
      const rotateY =
        ((x - rect.width / 2) / (rect.width / 2)) * 4

      card.style.transform =
        `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
    }

    const handleMouseLeave = () => {
      card.style.transform =
        'perspective(800px) rotateX(0deg) rotateY(0deg)'
    }

    card.addEventListener('mousemove', handleMouseMove)
    card.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      card.removeEventListener('mousemove', handleMouseMove)
      card.removeEventListener('mouseleave', handleMouseLeave)
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
        transition: 'transform 0.3s ease',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#06b6d4',
        }} />

        <span style={{
          fontSize: '11px',
          fontFamily: 'Orbitron, sans-serif',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
        }}>
          Subject Balance
        </span>
      </div>

      {total === 0 ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '240px',
        }}>
          <span style={{
            color: 'var(--text-muted)',
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '11px',
          }}>
            NO DATA STREAM
          </span>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={5}
                dataKey="value"
                stroke="transparent"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                  />
                ))}
              </Pie>

              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            justifyContent: 'center',
            marginTop: '8px',
          }}>
            {data.map((d, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '6px',
                }}
              >
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: d.color,
                }} />

                <span style={{
                  fontSize: '10px',
                  color: 'var(--text-secondary)',
                }}>
                  {d.name}
                </span>

                <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
}}>
  <span className="mono" style={{
    fontSize: '11px',
    color: d.color,
  }}>
    {((d.value / total) * 100).toFixed(1)}%
  </span>

  <span className="mono" style={{
    fontSize: '10px',
    color: 'var(--text-muted)',
  }}>
    {d.value < 0.1
      ? `${Math.round(d.value * 3600)}s`
      : `${Math.round(d.value * 60)}m`
    }
  </span>
</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
