import { lazy, Suspense, useState } from 'react'
import AppShell from './components/layout/AppShell'
import Dashboard from './components/dashboard/Dashboard'
import Settings from './components/settings/Settings'
import PageHeader from './components/layout/PageHeader'
import AuthScreen from './components/auth/AuthScreen'
import { useAuth } from './auth/useAuth'
import { supabase } from './api/supabaseClient'
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
  const auth = useAuth()

  const [page, setPage] = useState<Page>('dashboard')
  const [recommendedMinutes, setRecommendedMinutes] =
    useState<number | undefined>()

  const data = useFocusData(t)

  const activeSubject = data.subjects.find(
    (subject) => subject.id === data.activeSubjectId,
  )

  const startRecommendedSession = (
    subjectId?: string,
    minutes?: number,
  ) => {
    if (subjectId) {
      data.selectSubject(subjectId)
    }

    setRecommendedMinutes(minutes)
    setPage('focus')
  }

  const handleAddSubject = (
    name: string,
    color: string,
  ) => {
    data.addSubject(name, color)
    setPage('dashboard')
  }

  const handleSelectSubject = (
    id: string | null,
  ) => {
    data.selectSubject(id)
    setPage('dashboard')
  }

  if (supabase && auth.status === 'loading') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--void-bg)',
          color: 'var(--text-secondary)',
          fontFamily: 'Orbitron, sans-serif',
        }}
      >
        LOADING FOCUS...
      </div>
    )
  }

  if (supabase && auth.status === 'signed-out') {
    return <AuthScreen />
  }

  return (
    <AppShell
      page={page}
      onPageChange={setPage}
      subjects={data.subjects}
      activeSubjectId={data.activeSubjectId}
      onSelectSubject={handleSelectSubject}
      onAddSubject={handleAddSubject}
      onDeleteSubject={data.deleteSubject}
    >
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
          sessionsBeforeLongBreak={
            data.settings.sessionsBeforeLongBreak
          }
          autoStartBreak={data.settings.autoStartBreak}
          soundEnabled={data.settings.soundEnabled}
          soundVolume={data.settings.soundVolume}
          notificationsEnabled={
            data.settings.notificationsEnabled
          }
          onStartRecommendedSession={
            startRecommendedSession
          }
        />
      )}

      {page === 'focus' && (
        <FocusPage
          activeSubject={activeSubject}
          shortBreak={data.settings.shortBreak}
          longBreak={data.settings.longBreak}
          sessionsBeforeLongBreak={
            data.settings.sessionsBeforeLongBreak
          }
          autoStartBreak={data.settings.autoStartBreak}
          soundEnabled={data.settings.soundEnabled}
          soundVolume={data.settings.soundVolume}
          notificationsEnabled={
            data.settings.notificationsEnabled
          }
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
          <PageHeader title={t('statistics')} />

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
          <PageHeader title={t('settings')} />

          <Settings
            settings={data.settings}
            dailyGoal={data.dailyGoal}
            weeklyGoal={data.weeklyGoal}
            onDailyGoalChange={data.setDailyGoal}
            onWeeklyGoalChange={data.setWeeklyGoal}
            onSettingChange={data.updateSettings}
            onExportData={data.exportData}
            onImportData={data.importData}
          />

          {auth.session && (
            <div
              className="glass-panel"
              style={{
                marginTop: '16px',
                padding: '20px',
              }}
            >
              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  marginBottom: '12px',
                }}
              >
                Signed in as{' '}
                {auth.session.user.email ??
                  auth.session.user.id}
              </div>

              <button
                className="cyber-btn"
                onClick={() => {
                  void auth.signOut()
                }}
              >
                SIGN OUT
              </button>
            </div>
          )}
        </PageContainer>
      )}
    </AppShell>
  )
}

export default App
