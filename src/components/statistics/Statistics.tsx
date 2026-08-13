import type { StudySession } from '../../types'
import { useI18n } from '../../useI18n'

interface StatisticsProps {
  sessions: StudySession[]
}

function startOfDay(
  date: Date
): Date {
  const result = new Date(date)

  result.setHours(
    0,
    0,
    0,
    0
  )

  return result
}

function formatDuration(
  seconds: number
): string {
  const minutes =
    Math.floor(
      seconds / 60
    )

  const remainingSeconds =
    seconds % 60

  if (minutes === 0) {
    return `${remainingSeconds}s`
  }

  if (
    remainingSeconds === 0
  ) {
    return `${minutes}m`
  }

  return `${minutes}m ${remainingSeconds}s`
}

export default function Statistics({
  sessions,
}: StatisticsProps) {
  const { t } = useI18n()

  const completed =
    sessions.filter(
      (session) =>
        session.completed
    )

  const today =
    startOfDay(new Date())

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

  const weekStart =
    new Date(today)

  weekStart.setDate(
    weekStart.getDate() - 6
  )

  const weekSessions =
    completed.filter(
      (session) => {
        const date =
          startOfDay(
            new Date(
              session.completedAt
            )
          )

        return (
          date >= weekStart &&
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
    weekSessions.reduce(
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

  return (
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
  )
}