import { useRef } from 'react'

interface SettingsProps {
  dailyGoal: number
  shortBreak: number
  longBreak: number
  sessionsBeforeLongBreak: number
  autoStartBreak: boolean
  onDailyGoalChange: (value: number) => void
  onShortBreakChange: (value: number) => void
  onLongBreakChange: (value: number) => void
  onSessionsBeforeLongBreakChange: (value: number) => void
  onAutoStartBreakChange: (value: boolean) => void
  onExportData: () => void
  onImportData: (file: File) => void
}

export default function Settings({
  dailyGoal,
  shortBreak,
  longBreak,
  sessionsBeforeLongBreak,
  autoStartBreak,
  onDailyGoalChange,
  onShortBreakChange,
  onLongBreakChange,
  onSessionsBeforeLongBreakChange,
  onAutoStartBreakChange,
  onExportData,
  onImportData,
}: SettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      style={{
        maxWidth: '720px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '16px', marginBottom: '20px' }}>
          STUDY GOALS
        </h2>

        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            color: 'var(--text-secondary)',
            fontSize: '13px',
          }}
        >
          Daily focus goal

          <select
            value={dailyGoal}
            onChange={(event) =>
              onDailyGoalChange(Number(event.target.value))
            }
            style={{
              width: '180px',
              padding: '9px',
              background: 'var(--void-surface-hover)',
              border: '1px solid var(--void-border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
            }}
          >
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
            <option value={180}>3 hours</option>
            <option value={240}>4 hours</option>
            <option value={300}>5 hours</option>
          </select>
        </label>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '16px', marginBottom: '20px' }}>
          POMODORO
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
          }}
        >
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
            }}
          >
            Short break (minutes)

            <input
              type="number"
              min="1"
              max="60"
              value={shortBreak}
              onChange={(event) =>
                onShortBreakChange(
                  Math.max(1, Number(event.target.value))
                )
              }
              style={{
                padding: '9px',
                background: 'var(--void-surface-hover)',
                border: '1px solid var(--void-border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
              }}
            />
          </label>

          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
            }}
          >
            Long break (minutes)

            <input
              type="number"
              min="1"
              max="120"
              value={longBreak}
              onChange={(event) =>
                onLongBreakChange(
                  Math.max(1, Number(event.target.value))
                )
              }
              style={{
                padding: '9px',
                background: 'var(--void-surface-hover)',
                border: '1px solid var(--void-border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
              }}
            />
          </label>

          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
            }}
          >
            Focus sessions before long break

            <input
              type="number"
              min="1"
              max="10"
              value={sessionsBeforeLongBreak}
              onChange={(event) =>
                onSessionsBeforeLongBreakChange(
                  Math.max(1, Number(event.target.value))
                )
              }
              style={{
                padding: '9px',
                background: 'var(--void-surface-hover)',
                border: '1px solid var(--void-border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
              }}
            />
          </label>
        </div>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginTop: '20px',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={autoStartBreak}
            onChange={(event) =>
              onAutoStartBreakChange(event.target.checked)
            }
          />
          Automatically start the next break
        </label>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '16px', marginBottom: '8px' }}>
          DATA
        </h2>

        <p
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            marginBottom: '18px',
          }}
        >
          Backup your subjects, sessions, goals, and timer settings.
        </p>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <button className="cyber-btn" onClick={onExportData}>
            EXPORT DATA
          </button>

          <button
            className="cyber-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            IMPORT DATA
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0]

              if (file) {
                onImportData(file)
              }

              event.target.value = ''
            }}
          />
        </div>
      </div>
    </div>
  )
}