import { useRef } from 'react'
import { useI18n } from '../../useI18n'

interface SettingsProps {
  dailyGoal: number
  weeklyGoal: number
  shortBreak: number
  longBreak: number
  sessionsBeforeLongBreak: number
  autoStartBreak: boolean
  onDailyGoalChange: (value: number) => void
  onWeeklyGoalChange: (value: number) => void
  onShortBreakChange: (value: number) => void
  onLongBreakChange: (value: number) => void
  onSessionsBeforeLongBreakChange: (value: number) => void
  onAutoStartBreakChange: (value: boolean) => void
  onExportData: () => void
  onImportData: (file: File) => void
}

export default function Settings({
  dailyGoal,
  weeklyGoal,
  shortBreak,
  longBreak,
  sessionsBeforeLongBreak,
  autoStartBreak,
  onDailyGoalChange,
  onWeeklyGoalChange,
  onShortBreakChange,
  onLongBreakChange,
  onSessionsBeforeLongBreakChange,
  onAutoStartBreakChange,
  onExportData,
  onImportData,
}: SettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { language, setLanguage, t } = useI18n()

  const selectStyle = {
    padding: '9px',
    background: 'var(--void-surface-hover)',
    border: '1px solid var(--void-border)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    outline: 'none',
    cursor: 'pointer',
  }

  const inputStyle = {
    padding: '9px',
    background: 'var(--void-surface-hover)',
    border: '1px solid var(--void-border)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    outline: 'none',
  }

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '720px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* Language */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
        }}
      >
        <h2
          style={{
            fontSize: '16px',
            marginBottom: '20px',
          }}
        >
          {t('language')}
        </h2>

        <select
          value={language}
          onChange={(event) =>
            setLanguage(
              event.target.value === 'ku'
                ? 'ku'
                : 'en'
            )
          }
          style={{
            width: '220px',
            maxWidth: '100%',
            ...selectStyle,
          }}
        >
          <option value="en">
            {t('english')}
          </option>

          <option value="ku">
            {t('kurdishSorani')}
          </option>
        </select>
      </div>

      {/* Study Goals */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
        }}
      >
        <h2
          style={{
            fontSize: '16px',
            marginBottom: '20px',
          }}
        >
          {t('studyGoals')}
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              color: 'var(--text-secondary)',
              fontSize: '13px',
            }}
          >
            {t('dailyFocusGoal')}

            <select
              value={dailyGoal}
              onChange={(event) =>
                onDailyGoalChange(
                  Number(event.target.value)
                )
              }
              style={selectStyle}
            >
              <option value={30}>
                {t('minutes30')}
              </option>

              <option value={60}>
                {t('hour1')}
              </option>

              <option value={90}>
                {t('hours15')}
              </option>

              <option value={120}>
                {t('hours2')}
              </option>

              <option value={180}>
                {t('hours3')}
              </option>

              <option value={240}>
                {t('hours4')}
              </option>

              <option value={300}>
                {t('hours5')}
              </option>
            </select>
          </label>

          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              color: 'var(--text-secondary)',
              fontSize: '13px',
            }}
          >
            WEEKLY FOCUS GOAL

            <select
              value={weeklyGoal}
              onChange={(event) =>
                onWeeklyGoalChange(
                  Number(event.target.value)
                )
              }
              style={selectStyle}
            >
              <option value={300}>
                5 HOURS
              </option>

              <option value={600}>
                10 HOURS
              </option>

              <option value={900}>
                15 HOURS
              </option>

              <option value={1200}>
                20 HOURS
              </option>

              <option value={1500}>
                25 HOURS
              </option>
            </select>
          </label>
        </div>
      </div>

      {/* Pomodoro */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
        }}
      >
        <h2
          style={{
            fontSize: '16px',
            marginBottom: '20px',
          }}
        >
          {t('pomodoro')}
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
            {t('shortBreakMinutes')}

            <input
              type="number"
              min="1"
              max="60"
              value={shortBreak}
              onChange={(event) =>
                onShortBreakChange(
                  Math.max(
                    1,
                    Number(
                      event.target.value
                    )
                  )
                )
              }
              style={inputStyle}
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
            {t('longBreakMinutes')}

            <input
              type="number"
              min="1"
              max="120"
              value={longBreak}
              onChange={(event) =>
                onLongBreakChange(
                  Math.max(
                    1,
                    Number(
                      event.target.value
                    )
                  )
                )
              }
              style={inputStyle}
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
            {t(
              'focusSessionsBeforeLongBreak'
            )}

            <input
              type="number"
              min="1"
              max="10"
              value={sessionsBeforeLongBreak}
              onChange={(event) =>
                onSessionsBeforeLongBreakChange(
                  Math.max(
                    1,
                    Number(
                      event.target.value
                    )
                  )
                )
              }
              style={inputStyle}
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
              onAutoStartBreakChange(
                event.target.checked
              )
            }
          />

          {t(
            'automaticallyStartNextBreak'
          )}
        </label>
      </div>

      {/* Data */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
        }}
      >
        <h2
          style={{
            fontSize: '16px',
            marginBottom: '8px',
          }}
        >
          {t('data')}
        </h2>

        <p
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            marginBottom: '18px',
          }}
        >
          {t('backupDescription')}
        </p>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <button
            className="cyber-btn"
            onClick={onExportData}
          >
            {t('exportData')}
          </button>

          <button
            className="cyber-btn"
            onClick={() =>
              fileInputRef.current?.click()
            }
          >
            {t('importData')}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => {
              const file =
                event.target.files?.[0]

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
