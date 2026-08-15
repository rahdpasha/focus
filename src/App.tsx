import { lazy, Suspense, useEffect, useState } from 'react'
import Sidebar from './components/layout/Sidebar'
import Dashboard from './components/dashboard/Dashboard'
import Settings from './components/settings/Settings'
import BackgroundEffects from './components/effects/BackgroundEffects'
import { subjects as defaultSubjects } from './data/subjects'
import type { Subject, StudySession } from './types'
import { useI18n } from './useI18n'

const Statistics = lazy(() => import('./components/statistics/Statistics'))
import {
  getWeekKey,
  type WeeklyGoalMap,
} from './utils/goalHistory'

const STORAGE_KEY = 'focus-sessions'
const SUBJECTS_KEY = 'focus-subjects'
const GOAL_KEY = 'focus-daily-goal'
const WEEKLY_GOAL_KEY = 'focus-weekly-goal'
const WEEKLY_GOALS_HISTORY_KEY =
  'focus-weekly-goals-history'
const ACTIVE_SUBJECT_KEY =
  'focus-active-subject'
const SETTINGS_KEY = 'focus-settings'

type Page =
  | 'overview'
  | 'statistics'
  | 'settings'

interface AppSettings {
  shortBreak: number
  longBreak: number
  sessionsBeforeLongBreak: number
  autoStartBreak: boolean
  soundEnabled: boolean
  soundVolume: number
  notificationsEnabled: boolean
}

const defaultSettings: AppSettings = {
  shortBreak: 5,
  longBreak: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreak: false,
  soundEnabled: true,
  soundVolume: 70,
  notificationsEnabled: true,
}

function loadSessions(): StudySession[] {
  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY
      )

    if (!raw) return []

    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.map(
      (session: StudySession) => ({
        ...session,
        completedAt:
          new Date(
            session.completedAt
          ),
        totalPausedSeconds:
          session.totalPausedSeconds ??
          0,
      })
    )
  } catch {
    return []
  }
}

function loadSubjects(): Subject[] {
  try {
    const raw =
      localStorage.getItem(
        SUBJECTS_KEY
      )

    if (!raw) {
      return defaultSubjects
    }

    const parsed = JSON.parse(raw)

    if (
      !Array.isArray(parsed) ||
      parsed.length === 0
    ) {
      return defaultSubjects
    }

    return parsed
  } catch {
    return defaultSubjects
  }
}

function loadDailyGoal(): number {
  try {
    const value = Number(
      localStorage.getItem(
        GOAL_KEY
      )
    )

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      return 120
    }

    return value
  } catch {
    return 120
  }
}

function loadWeeklyGoal(): number {
  try {
    const value = Number(
      localStorage.getItem(
        WEEKLY_GOAL_KEY
      )
    )

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      return 600
    }

    return value
  } catch {
    return 600
  }
}

function loadWeeklyGoalsHistory(): WeeklyGoalMap {
  try {
    const raw =
      localStorage.getItem(
        WEEKLY_GOALS_HISTORY_KEY
      )

    if (!raw) {
      return {}
    }

    const parsed = JSON.parse(raw)

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed)
    ) {
      return {}
    }

    const result: WeeklyGoalMap = {}

    Object.entries(parsed).forEach(
      ([weekKey, value]) => {
        if (
          typeof value ===
            'number' &&
          Number.isFinite(value) &&
          value > 0
        ) {
          result[weekKey] = value
        }
      }
    )

    return result
  } catch {
    return {}
  }
}

function loadActiveSubject(): string | null {
  try {
    return localStorage.getItem(
      ACTIVE_SUBJECT_KEY
    )
  } catch {
    return null
  }
}

function loadSettings(): AppSettings {
  try {
    const raw =
      localStorage.getItem(
        SETTINGS_KEY
      )

    if (!raw) {
      return defaultSettings
    }

    const parsed = JSON.parse(raw)

    return {
      ...defaultSettings,
      ...parsed,
    }
  } catch {
    return defaultSettings
  }
}

function saveSessions(
  sessions: StudySession[]
) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(sessions)
    )
  } catch {
    // Ignore storage errors.
  }
}

function saveSubjects(
  subjects: Subject[]
) {
  try {
    localStorage.setItem(
      SUBJECTS_KEY,
      JSON.stringify(subjects)
    )
  } catch {
    // Ignore storage errors.
  }
}

function saveDailyGoal(
  goal: number
) {
  try {
    localStorage.setItem(
      GOAL_KEY,
      String(goal)
    )
  } catch {
    // Ignore storage errors.
  }
}

function saveWeeklyGoal(
  goal: number
) {
  try {
    localStorage.setItem(
      WEEKLY_GOAL_KEY,
      String(goal)
    )
  } catch {
    // Ignore storage errors.
  }
}

function saveWeeklyGoalsHistory(
  goals: WeeklyGoalMap
) {
  try {
    localStorage.setItem(
      WEEKLY_GOALS_HISTORY_KEY,
      JSON.stringify(goals)
    )
  } catch {
    // Ignore storage errors.
  }
}

function saveActiveSubject(
  id: string | null
) {
  try {
    if (id) {
      localStorage.setItem(
        ACTIVE_SUBJECT_KEY,
        id
      )
    } else {
      localStorage.removeItem(
        ACTIVE_SUBJECT_KEY
      )
    }
  } catch {
    // Ignore storage errors.
  }
}

function saveSettings(
  settings: AppSettings
) {
  try {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(settings)
    )
  } catch {
    // Ignore storage errors.
  }
}

function App() {
  const { t } = useI18n()

  const [page, setPage] =
    useState<Page>('overview')

  const [subjects, setSubjects] =
    useState<Subject[]>(
      loadSubjects
    )

  const [
    activeSubjectId,
    setActiveSubjectId,
  ] = useState<string | null>(
    loadActiveSubject
  )

  const [sessions, setSessions] =
    useState<StudySession[]>(
      loadSessions
    )

  const [dailyGoal, setDailyGoal] =
    useState<number>(
      loadDailyGoal
    )

  const [
    weeklyGoal,
    setWeeklyGoalState,
  ] = useState<number>(
    loadWeeklyGoal
  )

  const [
    weeklyGoalsHistory,
    setWeeklyGoalsHistory,
  ] = useState<WeeklyGoalMap>(
    loadWeeklyGoalsHistory
  )

  const [settings, setSettings] =
    useState<AppSettings>(
      loadSettings
    )

  useEffect(() => {
    saveSessions(sessions)
  }, [sessions])

  useEffect(() => {
    saveSubjects(subjects)
  }, [subjects])

  useEffect(() => {
    saveDailyGoal(dailyGoal)
  }, [dailyGoal])

  useEffect(() => {
    saveWeeklyGoal(weeklyGoal)
  }, [weeklyGoal])

  useEffect(() => {
    saveWeeklyGoalsHistory(
      weeklyGoalsHistory
    )
  }, [weeklyGoalsHistory])

  useEffect(() => {
    saveActiveSubject(
      activeSubjectId
    )
  }, [activeSubjectId])

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  const setWeeklyGoal = (
    goal: number
  ) => {
    if (
      !Number.isFinite(goal) ||
      goal <= 0
    ) {
      return
    }

    setWeeklyGoalState(goal)

    const weekKey =
      getWeekKey(new Date())

    setWeeklyGoalsHistory(
      (previous) => ({
        ...previous,
        [weekKey]: goal,
      })
    )
  }

  const addSession = (
    session: StudySession
  ) => {
    setSessions((previous) => [
      session,
      ...previous,
    ])
  }

  const deleteSession = (
    id: string
  ) => {
    setSessions((previous) =>
      previous.filter(
        (session) =>
          session.id !== id
      )
    )
  }

  const addSubject = (
    name: string,
    color: string
  ) => {
    const trimmedName =
      name.trim()

    if (!trimmedName) {
      return
    }

    const newSubject: Subject = {
      id: `subject-${Date.now()}`,
      name: trimmedName,
      color,
    }

    setSubjects((previous) => [
      ...previous,
      newSubject,
    ])

    setActiveSubjectId(
      newSubject.id
    )

    setPage('overview')
  }

  const deleteSubject = (
    id: string
  ) => {
    setSubjects((previous) =>
      previous.filter(
        (subject) =>
          subject.id !== id
      )
    )

    if (
      activeSubjectId === id
    ) {
      setActiveSubjectId(null)
    }
  }

  const handleSelectSubject = (
    id: string | null
  ) => {
    setActiveSubjectId(id)
    setPage('overview')
  }

  const exportData = () => {
    const backup = {
      version: 3,
      exportedAt:
        new Date().toISOString(),
      sessions,
      subjects,
      dailyGoal,
      weeklyGoal,
      weeklyGoalsHistory,
      settings,
      activeSubjectId,
    }

    const blob = new Blob(
      [
        JSON.stringify(
          backup,
          null,
          2
        ),
      ],
      {
        type: 'application/json',
      }
    )

    const url =
      URL.createObjectURL(blob)

    const link =
      document.createElement('a')

    link.href = url

    link.download =
      `focus-backup-${new Date()
        .toISOString()
        .slice(0, 10)}.json`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  const importData = (
    file: File
  ) => {
    const reader =
      new FileReader()

    reader.onload = () => {
      try {
        const backup =
          JSON.parse(
            String(
              reader.result
            )
          )

        if (
          !Array.isArray(
            backup.sessions
          )
        ) {
          throw new Error(
            'Invalid sessions'
          )
        }

        if (
          !Array.isArray(
            backup.subjects
          )
        ) {
          throw new Error(
            'Invalid subjects'
          )
        }

        const importedSessions:
          StudySession[] =
          backup.sessions.map(
            (
              session: StudySession
            ) => ({
              ...session,
              completedAt:
                new Date(
                  session.completedAt
                ),
              totalPausedSeconds:
                session.totalPausedSeconds ??
                0,
            })
          )

        setSessions(
          importedSessions
        )

        setSubjects(
          backup.subjects
        )

        if (
          typeof backup.dailyGoal ===
            'number' &&
          backup.dailyGoal > 0
        ) {
          setDailyGoal(
            backup.dailyGoal
          )
        }

        if (
          typeof backup.weeklyGoal ===
            'number' &&
          backup.weeklyGoal > 0
        ) {
          setWeeklyGoal(
            backup.weeklyGoal
          )
        }

        if (
          backup.weeklyGoalsHistory &&
          typeof backup.weeklyGoalsHistory ===
            'object' &&
          !Array.isArray(
            backup.weeklyGoalsHistory
          )
        ) {
          const importedWeeklyGoals: WeeklyGoalMap = {}

          Object.entries(
            backup.weeklyGoalsHistory
          ).forEach(
            ([weekKey, value]) => {
              if (
                typeof value === 'number' &&
                Number.isFinite(value) &&
                value > 0
              ) {
                const parsedDate =
                  new Date(
                    `${weekKey}T00:00:00`
                  )

                // Older backups stored week keys as Sunday.
                // Current FOCUS weeks start on Monday.
                if (
                  !Number.isNaN(
                    parsedDate.getTime()
                  ) &&
                  parsedDate.getDay() === 0
                ) {
                  parsedDate.setDate(
                    parsedDate.getDate() + 1
                  )

                  const migratedKey =
                    getWeekKey(parsedDate)

                  importedWeeklyGoals[
                    migratedKey
                  ] = value
                } else {
                  importedWeeklyGoals[
                    weekKey
                  ] = value
                }
              }
            }
          )

          setWeeklyGoalsHistory(
            importedWeeklyGoals
          )
        } else if (
          typeof backup.weeklyGoal ===
            'number' &&
          backup.weeklyGoal > 0
        ) {
          setWeeklyGoalsHistory({
            [getWeekKey(new Date())]:
              backup.weeklyGoal,
          })
        } else {
          setWeeklyGoalsHistory({})
        }

        if (
          backup.settings &&
          typeof backup.settings ===
            'object'
        ) {
          setSettings({
            ...defaultSettings,
            ...backup.settings,
          })
        }

        if (
          typeof backup.activeSubjectId ===
            'string' ||
          backup.activeSubjectId ===
            null
        ) {
          setActiveSubjectId(
            backup.activeSubjectId
          )
        }

        alert(
          t('dataImported')
        )
      } catch {
        alert(
          t('invalidBackup')
        )
      }
    }

    reader.onerror = () => {
      alert(
        t('backupReadFailed')
      )
    }

    reader.readAsText(file)
  }

  return (
    <>
      <BackgroundEffects />

      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          background:
            'transparent',
          position:
            'relative',
          zIndex: 2,
        }}
      >
        <Sidebar
          page={page}
          onPageChange={setPage}
          subjects={subjects}
          activeSubjectId={
            activeSubjectId
          }
          onSelectSubject={
            handleSelectSubject
          }
          onAddSubject={
            addSubject
          }
          onDeleteSubject={
            deleteSubject
          }
        />

        {page === 'overview' && (
          <Dashboard
            subjects={subjects}
            activeSubjectId={
              activeSubjectId
            }
            sessions={sessions}
            dailyGoal={
              dailyGoal
            }
            weeklyGoal={
              weeklyGoal
            }
            onDailyGoalChange={
              setDailyGoal
            }
            onWeeklyGoalChange={
              setWeeklyGoal
            }
            onAddSession={
              addSession
            }
            onDeleteSession={
              deleteSession
            }
            shortBreak={
              settings.shortBreak
            }
            longBreak={
              settings.longBreak
            }
            sessionsBeforeLongBreak={
              settings.sessionsBeforeLongBreak
            }
            autoStartBreak={
              settings.autoStartBreak
            }
            soundEnabled={
              settings.soundEnabled
            }
            soundVolume={
              settings.soundVolume
            }
            notificationsEnabled={
              settings.notificationsEnabled
            }
          />
        )}

        {page === 'statistics' && (
          <div
            style={{
              flex: 1,
              padding: '32px',
              overflowY:
                'auto',
            }}
          >
            <h1
              style={{
                fontSize: '22px',
                color:
                  'var(--text-primary)',
                marginBottom:
                  '24px',
              }}
            >
              {t('statistics')}
            </h1>

            <Suspense
              fallback={
                <div
                  className="glass-panel"
                  style={{
                    padding: '24px',
                    minHeight: '240px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    fontFamily: 'Orbitron, sans-serif',
                    fontSize: '11px',
                  }}
                >
                  {t('loadingAnalytics')}
                </div>
              }
            >
              <Statistics
                sessions={sessions}
                weeklyGoal={weeklyGoal}
                weeklyGoalsHistory={
                  weeklyGoalsHistory
                }
              />
            </Suspense>
          </div>
        )}

        {page === 'settings' && (
          <div
            style={{
              flex: 1,
              padding: '32px',
              overflowY:
                'auto',
            }}
          >
            <h1
              style={{
                fontSize: '22px',
                color:
                  'var(--text-primary)',
                marginBottom:
                  '24px',
              }}
            >
              {t('settings')}
            </h1>

            <Settings
              dailyGoal={
                dailyGoal
              }
              weeklyGoal={
                weeklyGoal
              }
              onWeeklyGoalChange={
                setWeeklyGoal
              }
              shortBreak={
                settings.shortBreak
              }
              longBreak={
                settings.longBreak
              }
              sessionsBeforeLongBreak={
                settings.sessionsBeforeLongBreak
              }
              autoStartBreak={
                settings.autoStartBreak
              }
              soundEnabled={
                settings.soundEnabled
              }
              soundVolume={
                settings.soundVolume
              }
              notificationsEnabled={
                settings.notificationsEnabled
              }
              onDailyGoalChange={
                setDailyGoal
              }
              onShortBreakChange={(
                value
              ) =>
                setSettings(
                  (previous) => ({
                    ...previous,
                    shortBreak:
                      value,
                  })
                )
              }
              onLongBreakChange={(
                value
              ) =>
                setSettings(
                  (previous) => ({
                    ...previous,
                    longBreak:
                      value,
                  })
                )
              }
              onSessionsBeforeLongBreakChange={(
                value
              ) =>
                setSettings(
                  (previous) => ({
                    ...previous,
                    sessionsBeforeLongBreak:
                      value,
                  })
                )
              }
              onAutoStartBreakChange={(
                value
              ) =>
                setSettings(
                  (previous) => ({
                    ...previous,
                    autoStartBreak:
                      value,
                  })
                )
              }
              onSoundEnabledChange={(
                value
              ) =>
                setSettings(
                  (previous) => ({
                    ...previous,
                    soundEnabled:
                      value,
                  })
                )
              }
              onSoundVolumeChange={(
                value
              ) =>
                setSettings(
                  (previous) => ({
                    ...previous,
                    soundVolume:
                      value,
                  })
                )
              }
              onNotificationsEnabledChange={(
                value
              ) =>
                setSettings(
                  (previous) => ({
                    ...previous,
                    notificationsEnabled:
                      value,
                  })
                )
              }
              onExportData={
                exportData
              }
              onImportData={
                importData
              }
            />
          </div>
        )}
      </div>
    </>
  )
}

export default App
