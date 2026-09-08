import { lazy, Suspense, useState } from 'react'
import Sidebar from './components/layout/Sidebar'
import Dashboard from './components/dashboard/Dashboard'
import Settings from './components/settings/Settings'
import BackgroundEffects from './components/effects/BackgroundEffects'
import { useI18n } from './useI18n'
import type { Page } from './app/navigation'
import FocusPage from './pages/FocusPage'
import SubjectsPage from './pages/SubjectsPage'
import StudyPlanPage from './pages/StudyPlanPage'
import RecordsPage from './pages/RecordsPage'
import { useFocusData } from './hooks/useFocusData'
import PageContainer from './pages/PageContainer'

const Statistics = lazy(() => import('./components/statistics/Statistics'))

function App() {
  const { t } = useI18n()
  const [page, setPage] = useState<Page>('dashboard')
  const [recommendedMinutes, setRecommendedMinutes] = useState<number | undefined>()
  const data = useFocusData(t)

  const activeSubject = data.subjects.find(
    (subject) => subject.id === data.activeSubjectId,
  )

  const startRecommendedSession = (subjectId?: string, minutes?: number) => {
    if (subjectId) data.selectSubject(subjectId)
    setRecommendedMinutes(minutes)
    setPage('focus')
  }

  const handleAddSubject = (name: string, color: string) => {
    data.addSubject(name, color)
    setPage('dashboard')
  }

  const handleSelectSubject = (id: string | null) => {
    data.selectSubject(id)
    setPage('dashboard')
  }

  return (
    <>
      <BackgroundEffects />

      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          background: 'transparent',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <Sidebar
          page={page}
          onPageChange={setPage}
          subjects={data.subjects}
          activeSubjectId={data.activeSubjectId}
          onSelectSubject={handleSelectSubject}
          onAddSubject={handleAddSubject}
          onDeleteSubject={data.deleteSubject}
        />

        {page === 'dashboard' && (
          <Dashboard
            subjects={data.subjects}
            activeSubjectId={data.activeSubjectId}
            sessions={data.sessions}
            dailyGoal={data.dailyGoal}
            weeklyGoal={data.weeklyGoal}
            onDailyGoalChange={data.setDailyGoal}
            onWeeklyGoalChange={data.setWeeklyGoal}
            onAddSession={data.addSession}
            onDeleteSession={data.deleteSession}
            shortBreak={data.settings.shortBreak}
            longBreak={data.settings.longBreak}
            sessionsBeforeLongBreak={data.settings.sessionsBeforeLongBreak}
            autoStartBreak={data.settings.autoStartBreak}
            soundEnabled={data.settings.soundEnabled}
            soundVolume={data.settings.soundVolume}
            notificationsEnabled={data.settings.notificationsEnabled}
            onStartRecommendedSession={startRecommendedSession}
          />
        )}

        {page === 'focus' && (
          <FocusPage
            activeSubject={activeSubject}
            shortBreak={data.settings.shortBreak}
            longBreak={data.settings.longBreak}
            sessionsBeforeLongBreak={data.settings.sessionsBeforeLongBreak}
            autoStartBreak={data.settings.autoStartBreak}
            soundEnabled={data.settings.soundEnabled}
            soundVolume={data.settings.soundVolume}
            notificationsEnabled={data.settings.notificationsEnabled}
            initialFocusMinutes={recommendedMinutes}
            onAddSession={data.addSession}
          />
        )}

        {page === 'subjects' && (
          <SubjectsPage
            subjects={data.subjects}
            activeSubjectId={data.activeSubjectId}
            onSelectSubject={handleSelectSubject}
            onAddSubject={handleAddSubject}
            onDeleteSubject={data.deleteSubject}
          />
        )}

        {page === 'study-plan' && (
          <StudyPlanPage
            sessions={data.sessions}
            subjects={data.subjects}
            weeklyGoal={data.weeklyGoal}
            dailyGoal={data.dailyGoal}
            onDailyGoalChange={data.setDailyGoal}
            onWeeklyGoalChange={data.setWeeklyGoal}
          />
        )}

        {page === 'records' && (
          <RecordsPage
            sessions={data.sessions}
            weeklyGoal={data.weeklyGoal}
          />
        )}

        {page === 'statistics' && (
          <PageContainer>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '24px' }}>
                {t('statistics')}
              </h1>
            </div>
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
                sessions={data.sessions}
                weeklyGoal={data.weeklyGoal}
                weeklyGoalsHistory={data.weeklyGoalsHistory}
              />
            </Suspense>
          </PageContainer>
        )}

        {page === 'settings' && (
          <PageContainer>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '24px' }}>
                {t('settings')}
              </h1>
            </div>
            <Settings
              dailyGoal={data.dailyGoal}
              weeklyGoal={data.weeklyGoal}
              onWeeklyGoalChange={data.setWeeklyGoal}
              shortBreak={data.settings.shortBreak}
              longBreak={data.settings.longBreak}
              sessionsBeforeLongBreak={data.settings.sessionsBeforeLongBreak}
              autoStartBreak={data.settings.autoStartBreak}
              soundEnabled={data.settings.soundEnabled}
              soundVolume={data.settings.soundVolume}
              notificationsEnabled={data.settings.notificationsEnabled}
              onDailyGoalChange={data.setDailyGoal}
              onShortBreakChange={(value) => data.updateSettings('shortBreak', value)}
              onLongBreakChange={(value) => data.updateSettings('longBreak', value)}
              onSessionsBeforeLongBreakChange={(value) => data.updateSettings('sessionsBeforeLongBreak', value)}
              onAutoStartBreakChange={(value) => data.updateSettings('autoStartBreak', value)}
              onSoundEnabledChange={(value) => data.updateSettings('soundEnabled', value)}
              onSoundVolumeChange={(value) => data.updateSettings('soundVolume', value)}
              onNotificationsEnabledChange={(value) => data.updateSettings('notificationsEnabled', value)}
              onExportData={data.exportData}
              onImportData={data.importData}
            />
          </PageContainer>
        )}
      </div>
    </>
  )
}

export default App
