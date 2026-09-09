import { useRef } from 'react'
import { useI18n } from '../../useI18n'
import { type ThemeMode } from '../../app/theme'
import { useTheme } from '../../app/useTheme'
import type { AppSettings } from '../../app/settings'

interface SettingsProps {
  settings: AppSettings
  dailyGoal: number
  weeklyGoal: number
  onDailyGoalChange: (value: number) => void
  onWeeklyGoalChange: (value: number) => void
  onSettingChange: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void
  onExportData: () => void
  onImportData: (file: File) => void
}

export default function Settings({
  settings,
  dailyGoal,
  weeklyGoal,
  onDailyGoalChange,
  onWeeklyGoalChange,
  onSettingChange,
  onExportData,
  onImportData,
}: SettingsProps) {
  const fileInputRef =
    useRef<HTMLInputElement>(null)

  const {
    language,
    setLanguage,
    t,
  } = useI18n()

  const { theme, setTheme } = useTheme()

  const selectStyle = {
    padding: '9px',
    background:
      'var(--void-surface-hover)',
    border:
      '1px solid var(--void-border)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    outline: 'none',
    cursor: 'pointer',
  }

  const inputStyle = {
    padding: '9px',
    background:
      'var(--void-surface-hover)',
    border:
      '1px solid var(--void-border)',
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
      {/* Appearance */}
      <div
        className="glass-panel"
        style={{ padding: '24px' }}
      >
        <h2 style={{ fontSize: '16px', marginBottom: '20px' }}>
          {t('appearance')}
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
          {t('theme')}
          <select
            value={theme}
            onChange={(event) => setTheme(event.target.value as ThemeMode)}
            style={{ width: '220px', maxWidth: '100%', ...selectStyle }}
          >
            <option value="system">{t('themeSystem')}</option>
            <option value="dark">{t('themeDark')}</option>
            <option value="light">{t('themeLight')}</option>
          </select>
        </label>
      </div>

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
              color:
                'var(--text-secondary)',
              fontSize: '13px',
            }}
          >
            {t('dailyFocusGoal')}

            <select
              value={dailyGoal}
              onChange={(event) =>
                onDailyGoalChange(
                  Number(
                    event.target.value
                  )
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
              color:
                'var(--text-secondary)',
              fontSize: '13px',
            }}
          >
            WEEKLY FOCUS GOAL

            <select
              value={weeklyGoal}
              onChange={(event) =>
                onWeeklyGoalChange(
                  Number(
                    event.target.value
                  )
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
              color:
                'var(--text-secondary)',
            }}
          >
            {t('shortBreakMinutes')}

            <input
              type="number"
              min="1"
              max="60"
              value={settings.shortBreak}
              onChange={(event) =>
                onSettingChange(
                  'shortBreak',
                  Number(event.target.value)
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
              color:
                'var(--text-secondary)',
            }}
          >
            {t('longBreakMinutes')}

            <input
              type="number"
              min="1"
              max="120"
              value={settings.longBreak}
              onChange={(event) =>
                onSettingChange(
                  'longBreak',
                  Number(event.target.value)
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
              color:
                'var(--text-secondary)',
            }}
          >
            {t(
              'focusSessionsBeforeLongBreak'
            )}

            <input
              type="number"
              min="1"
              max="10"
              value={settings.sessionsBeforeLongBreak}
              onChange={(event) =>
                onSettingChange(
                  'sessionsBeforeLongBreak',
                  Number(event.target.value)
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
            color:
              'var(--text-secondary)',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={settings.autoStartBreak}
            onChange={(event) =>
              onSettingChange(
                'autoStartBreak',
                event.target.checked
              )
            }
          />

          {t(
            'automaticallyStartNextBreak'
          )}
        </label>
      </div>

      {/* Sound */}
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
          {t('sound')}
        </h2>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color:
              'var(--text-secondary)',
            fontSize: '13px',
            cursor: 'pointer',
            marginBottom: '18px',
          }}
        >
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={(event) =>
              onSettingChange(
                'soundEnabled',
                event.target.checked
              )
            }
          />

          {t('soundEnabled')}
        </label>

        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            color:
              'var(--text-secondary)',
            fontSize: '13px',
          }}
        >
          {t('soundVolume')}

          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={settings.soundVolume}
            disabled={!settings.soundEnabled}
            onChange={(event) =>
              onSettingChange(
                'soundVolume',
                Number(event.target.value)
              )
            }
          />

          <span
            className="mono"
            style={{
              fontSize: '11px',
              color:
                'var(--text-muted)',
            }}
          >
            {settings.soundVolume}%
          </span>
        </label>
      </div>

      {/* Notifications */}
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
          {t('notifications')}
        </h2>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color:
              'var(--text-secondary)',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={settings.notificationsEnabled}
            onChange={(event) =>
              onSettingChange(
                'notificationsEnabled',
                event.target.checked
              )
            }
          />

          {t('notificationsEnabled')}
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
            color:
              'var(--text-muted)',
            marginBottom:
              '18px',
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
            onClick={
              onExportData
            }
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
