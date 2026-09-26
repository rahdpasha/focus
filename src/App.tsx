import { lazy, Suspense, useEffect, useState } from 'react'
import AppShell from './components/layout/AppShell'
import Dashboard from './components/dashboard/Dashboard'
import Settings from './components/settings/Settings'
import PageHeader from './components/layout/PageHeader'
import AuthScreen from './components/auth/AuthScreen'
import { useAuth } from './auth/useAuth'
import { supabase } from './api/supabaseClient'
import { useI18n } from './useI18n'
import { useTheme } from './app/useTheme'
import type { Page } from './app/navigation'
import type { TranslationKey } from './translations'
import type { AuthState } from './auth/types'
import FocusPage from './pages/FocusPage'
import SubjectsPage from './pages/SubjectsPage'
import StudyPlanPage from './pages/StudyPlanPage'
import PlanPage from './pages/PlanPage'
import RoutinePage from './pages/RoutinePage'
import RecordsPage from './pages/RecordsPage'
import HistoryPage from './pages/HistoryPage'
import LeaguePage from './pages/LeaguePage'
import AdvisorPage from './pages/AdvisorPage'
import { useFocusData } from './hooks/useFocusData'
import type { RoutineSessionContext } from './storage/types'
import PageContainer from './pages/PageContainer'

const Statistics = lazy(() => import('./components/statistics/Statistics'))

type Translate = (key: TranslationKey) => string

function App() {
  const { t, tr } = useI18n()
  const auth = useAuth()

  if (supabase && auth.status === 'loading') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--void-bg)',
          color: 'var(--text-secondary)',
          fontFamily: 'Space Grotesk, sans-serif',
        }}
      >
        {tr('Preparing FOCUS…', 'FOCUS ئامادە دەکرێت…')}
      </div>
    )
  }

  if (supabase && auth.status === 'signed-out') {
    return <AuthScreen />
  }

  return (
    <AuthenticatedApp
      key={auth.session?.user.id ?? 'local'}
      t={t}
      auth={auth}
    />
  )
}

function AuthenticatedApp({
  t,
  auth,
}: {
  t: Translate
  auth: AuthState & ReturnType<typeof useAuth>
}) {
  const [page, setPage] = useState<Page>('dashboard')
  const [recommendedMinutes, setRecommendedMinutes] =
    useState<number | undefined>()
  const [
    routineSessionContext,
    setRoutineSessionContext,
  ] = useState<
    RoutineSessionContext | undefined
  >()

  const data = useFocusData(
    t,
    undefined,
    auth.session,
  )

  const {
    language,
    setLanguage,
    tr,
  } = useI18n()
  const {
    theme,
    customThemePack,
    setTheme,
    setCustomThemePack,
  } = useTheme()

  useEffect(() => {
    if (
      theme !== data.settings.theme
    ) {
      setTheme(
        data.settings.theme,
      )
    }
  }, [
    data.settings.theme,
    setTheme,
    theme,
  ])

  useEffect(() => {
    if (
      JSON.stringify(customThemePack) !==
      JSON.stringify(
        data.settings.customThemePack,
      )
    ) {
      setCustomThemePack(
        data.settings.customThemePack,
      )
    }
  }, [
    customThemePack,
    data.settings.customThemePack,
    setCustomThemePack,
  ])

  useEffect(() => {
    if (
      language !== data.settings.language
    ) {
      setLanguage(
        data.settings.language,
      )
    }
  }, [
    data.settings.language,
    language,
    setLanguage,
  ])

  const activeSubject = data.subjects.find(
    (subject) => subject.id === data.activeSubjectId,
  )

  const startRecommendedSession = (
    subjectId?: string,
    minutes?: number,
    routineContext?: RoutineSessionContext,
  ) => {
    if (subjectId) {
      data.selectSubject(subjectId)
    }

    setRecommendedMinutes(minutes)
    setRoutineSessionContext(
      routineContext,
    )
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

  return (
    <AppShell
      page={page}
      onPageChange={(nextPage) => {
        if (nextPage !== 'focus') {
          setRecommendedMinutes(
            undefined,
          )
          setRoutineSessionContext(
            undefined,
          )
        }

        setPage(nextPage)
      }}
      subjects={data.subjects}
      activeSubjectId={data.activeSubjectId}
      onSelectSubject={handleSelectSubject}
      onAddSubject={handleAddSubject}
      onDeleteSubject={data.deleteSubject}
    >
      {page === 'dashboard' && (
        <Dashboard
          subjects={data.subjects}
          sessions={data.sessions}
          dailyGoal={data.dailyGoal}
          weeklyGoal={data.weeklyGoal}
          routineItems={data.routineItems}
          onStartRecommendedSession={
            startRecommendedSession
          }
        />
      )}

      {page === 'focus' && (
        <FocusPage
          activeSubject={activeSubject}
          subjects={data.subjects}
          sessions={data.sessions}
          weeklyGoal={data.weeklyGoal}
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
          routineContext={routineSessionContext}
          onAddSession={data.addSession}
          onSelectSubject={(subjectId) => {
            setRoutineSessionContext(
              undefined,
            )
            data.selectSubject(
              subjectId,
            )
          }}
        />
      )}

      {page === 'subjects' && (
        <SubjectsPage
          subjects={data.subjects}
          activeSubjectId={data.activeSubjectId}
          sessions={data.sessions}
          onSelectSubject={data.selectSubject}
          onAddSubject={data.addSubject}
          onDeleteSubject={data.deleteSubject}
          onStartSession={startRecommendedSession}
        />
      )}

      {page === 'plan' && (
        <PlanPage
          subjects={data.subjects}
          activeSubjectId={data.activeSubjectId}
          sessions={data.sessions}
          weeklyGoal={data.weeklyGoal}
          dailyGoal={data.dailyGoal}
          advancedGoals={data.advancedGoals}
          routineItems={data.routineItems}
          onSelectSubject={data.selectSubject}
          onAddSubject={data.addSubject}
          onDeleteSubject={data.deleteSubject}
          onDailyGoalChange={data.setDailyGoal}
          onWeeklyGoalChange={data.setWeeklyGoal}
          onAddAdvancedGoal={data.addAdvancedGoal}
          onUpdateAdvancedGoal={data.updateAdvancedGoal}
          onDeleteAdvancedGoal={data.deleteAdvancedGoal}
          onAddRoutineItem={data.addRoutineItem}
          onUpdateRoutineItem={data.updateRoutineItem}
          onDeleteRoutineItem={data.deleteRoutineItem}
          onStartSession={startRecommendedSession}
        />
      )}

      {page === 'study-plan' && (
        <StudyPlanPage
          sessions={data.sessions}
          subjects={data.subjects}
          weeklyGoal={data.weeklyGoal}
          dailyGoal={data.dailyGoal}
          advancedGoals={data.advancedGoals}
          onDailyGoalChange={data.setDailyGoal}
          onWeeklyGoalChange={data.setWeeklyGoal}
          onAddAdvancedGoal={data.addAdvancedGoal}
          onUpdateAdvancedGoal={data.updateAdvancedGoal}
          onDeleteAdvancedGoal={data.deleteAdvancedGoal}
          onStartSession={startRecommendedSession}
        />
      )}

      {page === 'routine' && (
        <RoutinePage
          subjects={data.subjects}
          sessions={data.sessions}
          routineItems={data.routineItems}
          onAddRoutineItem={data.addRoutineItem}
          onUpdateRoutineItem={data.updateRoutineItem}
          onDeleteRoutineItem={data.deleteRoutineItem}
          onStartSession={startRecommendedSession}
        />
      )}

      {page === 'records' && (
        <RecordsPage
          sessions={data.sessions}
          weeklyGoal={data.weeklyGoal}
        />
      )}

      {page === 'history' && (
        <HistoryPage
          sessions={data.sessions}
        />
      )}

      {page === 'advisor' && (
        <AdvisorPage
          sessions={data.sessions}
          subjects={data.subjects}
          dailyGoal={data.dailyGoal}
          weeklyGoal={data.weeklyGoal}
          advancedGoals={data.advancedGoals}
          onStartSession={startRecommendedSession}
        />
      )}

      {page === 'league' && (
        <LeaguePage
          userId={auth.session?.user.id ?? null}
          displayName={auth.session?.user.displayName}
        />
      )}

      {page === 'statistics' && (
        <PageContainer>
          <PageHeader
            title={t('statistics')}
            description={tr(
              'Understand your focus rhythm, consistency, and strongest patterns without the noise.',
              'ڕێتمی سەرنج، بەردەوامی و بەهێزترین شێوازەکانت بەبێ ئاڵۆزی تێبگە.',
            )}
          />

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
              weeklyGoalsHistory={
                data.weeklyGoalsHistory
              }
            />
          </Suspense>
        </PageContainer>
      )}

      {page === 'settings' && (
        <PageContainer>
          <PageHeader
            title={t('settings')}
            description={tr(
              'Shape how FOCUS looks, feels, syncs, and supports your daily work.',
              'ڕووکار، هەست، هاوکاتبوون و شێوازی یارمەتیدانی FOCUS بۆ کاری ڕۆژانەت ڕێکبخە.',
            )}
          />

          <Settings
            settings={data.settings}
            dailyGoal={data.dailyGoal}
            weeklyGoal={data.weeklyGoal}
            accountEmail={
              auth.session?.user.email ??
              null
            }
            cloudStatus={
              data.cloudStatus
            }
            onDailyGoalChange={data.setDailyGoal}
            onWeeklyGoalChange={data.setWeeklyGoal}
            onSettingChange={data.updateSettings}
            onExportData={data.exportData}
            onImportData={data.importData}
            onSignOut={
              auth.session
                ? () => {
                    void (async () => {
                      const flushed =
                        await data.flushCloudChanges()

                      if (!flushed) {
                        return
                      }

                      await auth.signOut()
                    })()
                  }
                : undefined
            }
          />
        </PageContainer>
      )}
    </AppShell>
  )
}

export default App
