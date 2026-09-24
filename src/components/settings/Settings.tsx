import {
  Bell,
  BellOff,
  Cloud,
  CloudOff,
  Database,
  Download,
  Languages,
  LogOut,
  Monitor,
  Moon,
  SlidersHorizontal,
  Sun,
  TimerReset,
  Upload,
  Volume2,
  VolumeX,
} from 'lucide-react'
import {
  useRef,
  useState,
} from 'react'
import {
  useI18n,
} from '../../useI18n'
import {
  type ThemeMode,
} from '../../app/theme'
import {
  useTheme,
} from '../../app/useTheme'
import type {
  AppSettings,
} from '../../app/settings'
import type {
  CloudSyncStatus,
} from '../../storage/types'

interface SettingsProps {
  settings: AppSettings
  dailyGoal: number
  weeklyGoal: number
  accountEmail?: string | null
  cloudStatus: CloudSyncStatus
  onDailyGoalChange: (
    value: number,
  ) => void
  onWeeklyGoalChange: (
    value: number,
  ) => void
  onSettingChange: <
    K extends keyof AppSettings,
  >(
    key: K,
    value: AppSettings[K],
  ) => void
  onExportData: () => void
  onImportData: (
    file: File,
  ) => void
  onSignOut?: () => void
}

const themeOptions: Array<{
  value: ThemeMode
  label: string
  icon: typeof Monitor
}> = [
  {
    value: 'system',
    label: 'System',
    icon: Monitor,
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: Moon,
  },
  {
    value: 'light',
    label: 'Light',
    icon: Sun,
  },
]

export default function Settings({
  settings,
  dailyGoal,
  weeklyGoal,
  accountEmail,
  cloudStatus,
  onDailyGoalChange,
  onWeeklyGoalChange,
  onSettingChange,
  onExportData,
  onImportData,
  onSignOut,
}: SettingsProps) {
  const fileInputRef =
    useRef<HTMLInputElement>(
      null,
    )
  const [
    pendingImport,
    setPendingImport,
  ] = useState(false)

  const {
    language,
    t,
  } = useI18n()

  const {
    theme,
  } = useTheme()

  return (
    <div className="settings-v3">
      <section className="glass-panel settings-section settings-section-wide">
        <div className="settings-section-head">
          <div className="settings-section-icon">
            <SlidersHorizontal
              size={17}
            />
          </div>

          <div>
            <h2>
              Workspace
            </h2>
            <p>
              Choose how FOCUS
              looks and speaks.
            </p>
          </div>
        </div>

        <div className="settings-control-grid">
          <div className="settings-field">
            <span className="settings-label">
              {t('theme')}
            </span>

            <div
              className="settings-segmented"
              role="group"
              aria-label={t(
                'theme',
              )}
            >
              {themeOptions.map(
                (option) => {
                  const Icon =
                    option.icon
                  const active =
                    theme ===
                    option.value

                  return (
                    <button
                      key={
                        option.value
                      }
                      type="button"
                      className={
                        active
                          ? 'active'
                          : ''
                      }
                      aria-pressed={
                        active
                      }
                      onClick={() =>
                        onSettingChange(
                          'theme',
                          option.value,
                        )
                      }
                    >
                      <Icon
                        size={15}
                      />
                      {
                        option.label
                      }
                    </button>
                  )
                },
              )}
            </div>
          </div>

          <label className="settings-field">
            <span className="settings-label">
              {t(
                'language',
              )}
            </span>

            <div className="settings-input-with-icon">
              <Languages
                size={15}
              />
              <select
                value={
                  language
                }
                onChange={(
                  event,
                ) =>
                  onSettingChange(
                    'language',
                    event.target
                      .value ===
                      'ku'
                      ? 'ku'
                      : 'en',
                  )
                }
              >
                <option value="en">
                  {t(
                    'english',
                  )}
                </option>
                <option value="ku">
                  {t(
                    'kurdishSorani',
                  )}
                </option>
              </select>
            </div>
          </label>
        </div>
      </section>

      <section className="glass-panel settings-section">
        <div className="settings-section-head">
          <div className="settings-section-icon">
            <TimerReset
              size={17}
            />
          </div>

          <div>
            <h2>
              Focus targets
            </h2>
            <p>
              Define your baseline
              daily and weekly
              commitment.
            </p>
          </div>
        </div>

        <div className="settings-control-grid">
          <label className="settings-field">
            <span className="settings-label">
              {t(
                'dailyFocusGoal',
              )}
            </span>

            <select
              value={
                dailyGoal
              }
              onChange={(
                event,
              ) =>
                onDailyGoalChange(
                  Number(
                    event.target
                      .value,
                  ),
                )
              }
            >
              <option value={30}>
                30m
              </option>
              <option value={60}>
                1h
              </option>
              <option value={90}>
                1.5h
              </option>
              <option value={120}>
                2h
              </option>
              <option value={180}>
                3h
              </option>
              <option value={240}>
                4h
              </option>
              <option value={300}>
                5h
              </option>
            </select>
          </label>

          <label className="settings-field">
            <span className="settings-label">
              Weekly focus goal
            </span>

            <select
              value={
                weeklyGoal
              }
              onChange={(
                event,
              ) =>
                onWeeklyGoalChange(
                  Number(
                    event.target
                      .value,
                  ),
                )
              }
            >
              <option value={300}>
                5h
              </option>
              <option value={600}>
                10h
              </option>
              <option value={900}>
                15h
              </option>
              <option value={1200}>
                20h
              </option>
              <option value={1500}>
                25h
              </option>
              <option value={1800}>
                30h
              </option>
            </select>
          </label>
        </div>
      </section>

      <section className="glass-panel settings-section">
        <div className="settings-section-head">
          <div className="settings-section-icon">
            <TimerReset
              size={17}
            />
          </div>

          <div>
            <h2>
              Timer cycle
            </h2>
            <p>
              Tune breaks without
              changing your study
              history.
            </p>
          </div>
        </div>

        <div className="settings-three-grid">
          <label className="settings-field">
            <span className="settings-label">
              {t(
                'shortBreakMinutes',
              )}
            </span>
            <input
              type="number"
              min={1}
              max={60}
              value={
                settings.shortBreak
              }
              onChange={(
                event,
              ) =>
                onSettingChange(
                  'shortBreak',
                  Number(
                    event.target
                      .value,
                  ),
                )
              }
            />
          </label>

          <label className="settings-field">
            <span className="settings-label">
              {t(
                'longBreakMinutes',
              )}
            </span>
            <input
              type="number"
              min={1}
              max={120}
              value={
                settings.longBreak
              }
              onChange={(
                event,
              ) =>
                onSettingChange(
                  'longBreak',
                  Number(
                    event.target
                      .value,
                  ),
                )
              }
            />
          </label>

          <label className="settings-field">
            <span className="settings-label">
              Sessions / cycle
            </span>
            <input
              type="number"
              min={1}
              max={10}
              value={
                settings.sessionsBeforeLongBreak
              }
              onChange={(
                event,
              ) =>
                onSettingChange(
                  'sessionsBeforeLongBreak',
                  Number(
                    event.target
                      .value,
                  ),
                )
              }
            />
          </label>
        </div>

        <ToggleRow
          title={t(
            'automaticallyStartNextBreak',
          )}
          description="Start the next break immediately when a focus block finishes."
          checked={
            settings.autoStartBreak
          }
          onChange={(
            checked,
          ) =>
            onSettingChange(
              'autoStartBreak',
              checked,
            )
          }
        />
      </section>

      <section className="glass-panel settings-section">
        <div className="settings-section-head">
          <div className="settings-section-icon">
            {settings.soundEnabled ? (
              <Volume2
                size={17}
              />
            ) : (
              <VolumeX
                size={17}
              />
            )}
          </div>

          <div>
            <h2>
              Sound
            </h2>
            <p>
              Control timer feedback
              volume.
            </p>
          </div>
        </div>

        <ToggleRow
          title={t(
            'soundEnabled',
          )}
          description="Play timer sounds for focus and break transitions."
          checked={
            settings.soundEnabled
          }
          onChange={(
            checked,
          ) =>
            onSettingChange(
              'soundEnabled',
              checked,
            )
          }
        />

        <label className="settings-range">
          <div>
            <span>
              {t(
                'soundVolume',
              )}
            </span>
            <strong className="mono">
              {
                settings.soundVolume
              }
              %
            </strong>
          </div>

          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={
              settings.soundVolume
            }
            disabled={
              !settings.soundEnabled
            }
            onChange={(
              event,
            ) =>
              onSettingChange(
                'soundVolume',
                Number(
                  event.target
                    .value,
                ),
              )
            }
          />
        </label>
      </section>

      <section className="glass-panel settings-section">
        <div className="settings-section-head">
          <div className="settings-section-icon">
            {settings.notificationsEnabled ? (
              <Bell
                size={17}
              />
            ) : (
              <BellOff
                size={17}
              />
            )}
          </div>

          <div>
            <h2>
              Notifications
            </h2>
            <p>
              Decide whether FOCUS
              can alert you when a
              timer changes state.
            </p>
          </div>
        </div>

        <ToggleRow
          title={t(
            'notificationsEnabled',
          )}
          description="Browser permission may still be required before notifications can appear."
          checked={
            settings.notificationsEnabled
          }
          onChange={(
            checked,
          ) =>
            onSettingChange(
              'notificationsEnabled',
              checked,
            )
          }
        />
      </section>

      <section className="glass-panel settings-section settings-section-wide">
        <div className="settings-section-head">
          <div className="settings-section-icon">
            <Database
              size={17}
            />
          </div>

          <div>
            <h2>
              Data & account
            </h2>
            <p>
              Keep a portable backup
              and control the current
              session.
            </p>
          </div>
        </div>

        <div className="settings-data-row">
          <div className="settings-account-copy">
            <span>
              Account
            </span>
            <strong>
              {accountEmail ??
                'Local mode'}
            </strong>

            <div
              className={
                cloudStatus === 'error'
                  ? 'settings-sync-status error'
                  : cloudStatus === 'offline'
                    ? 'settings-sync-status offline'
                    : cloudStatus === 'synced'
                      ? 'settings-sync-status synced'
                      : 'settings-sync-status'
              }
            >
              {cloudStatus === 'error' ||
              cloudStatus === 'offline' ? (
                <CloudOff size={13} />
              ) : (
                <Cloud size={13} />
              )}
              <span>
                {cloudStatus === 'local'
                  ? 'Saved on this device'
                  : cloudStatus === 'loading'
                    ? 'Connecting to cloud…'
                    : cloudStatus === 'saving'
                      ? 'Saving changes…'
                      : cloudStatus === 'synced'
                        ? 'Cloud synced'
                        : cloudStatus === 'offline'
                          ? 'Offline · changes stay on this device'
                          : 'Cloud sync needs attention'}
              </span>
            </div>
          </div>

          <div className="settings-data-actions">
            <button
              type="button"
              className="settings-secondary-action"
              onClick={
                onExportData
              }
            >
              <Download
                size={15}
              />
              {t(
                'exportData',
              )}
            </button>

            <button
              type="button"
              className="settings-secondary-action"
              onClick={() => {
                if (!pendingImport) {
                  setPendingImport(true)
                  return
                }

                setPendingImport(false)
                fileInputRef
                  .current
                  ?.click()
              }}
              onBlur={() =>
                setPendingImport(false)
              }
              aria-label={
                pendingImport
                  ? t(
                      'confirmImportData',
                    )
                  : t(
                      'importData',
                    )
              }
              title={
                pendingImport
                  ? t(
                      'confirmImportData',
                    )
                  : undefined
              }
            >
              <Upload
                size={15}
              />
              {pendingImport
                ? t(
                    'confirmImportData',
                  )
                : t(
                    'importData',
                  )}
            </button>

            {onSignOut && (
              <button
                type="button"
                className="settings-danger-action"
                onClick={
                  onSignOut
                }
              >
                <LogOut
                  size={15}
                />
                Sign out
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(
              event,
            ) => {
              const file =
                event.target
                  .files?.[0]

              if (file) {
                onImportData(
                  file,
                )
              }

              event.target.value =
                ''
            }}
          />
        </div>
      </section>
    </div>
  )
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (
    value: boolean,
  ) => void
}) {
  return (
    <label className="settings-toggle-row">
      <div>
        <strong>
          {title}
        </strong>
        <span>
          {description}
        </span>
      </div>

      <input
        className="settings-switch-input"
        type="checkbox"
        checked={checked}
        onChange={(
          event,
        ) =>
          onChange(
            event.target
              .checked,
          )
        }
      />

      <span
        className="settings-switch"
        aria-hidden="true"
      />
    </label>
  )
}
