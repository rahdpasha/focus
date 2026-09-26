import { useEffect, useState } from 'react'
import AppShell from './components/layout/AppShell'
import Dashboard from './components/dashboard/Dashboard'
import Settings from './components/settings/Settings'
import PageHeader from './components/layout/PageHeader'
import PageContainer from './pages/PageContainer'
import AuthScreen from './components/auth/AuthScreen'
import { useAuth } from './auth/useAuth'
import { supabase } from './api/supabaseClient'
import { useI18n } from './useI18n'
import { useTheme } from './app/useTheme'
import type { Page } from './app/navigation'
import type { TranslationKey } from './translations'
import type { AuthState } from './auth/types'
import FocusPage from './pages/FocusPage'
import PlanPage from './pages/PlanPage'
import ProgressPage from './pages/ProgressPage'
import LeaguePage from './pages/LeaguePage'
import { useFocusData } from './hooks/useFocusData'
import type { RoutineSessionContext } from './storage/types'

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
  const [
    planSubjectCreateRequest,
    setPlanSubjectCreateRequest,
  ] = useState(0)

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

  const openSubjectCreator = () => {
    setPlanSubjectCreateRequest(
      (value) => value + 1,
    )
    setPage('plan')
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
          onAddSubjectRequest={
            openSubjectCreator
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
          onAddSubjectRequest={
            openSubjectCreator
          }
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
          subjectCreateRequestKey={
            planSubjectCreateRequest
          }
        />
      )}

      {page === 'progress' && (
        <ProgressPage
          sessions={data.sessions}
          weeklyGoal={data.weeklyGoal}
          weeklyGoalsHistory={
            data.weeklyGoalsHistory
          }
          onStartFocus={() =>
            setPage('focus')
          }
        />
      )}

      {page === 'league' && (
        <LeaguePage
          userId={auth.session?.user.id ?? null}
          displayName={auth.session?.user.displayName}
        />
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
